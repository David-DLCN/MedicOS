-- =============================================================================
-- MedicOS · esquema inicial
--
-- Multi-tenant por médico: cada fila clínica/financiera lleva doctor_id y
-- Row Level Security garantiza que un médico solo vea y modifique lo suyo.
-- Las llaves foráneas compuestas (doctor_id, id) impiden mezclar datos de dos
-- médicos (p. ej. una cita apuntando al paciente de otro médico).
--
-- Dinero en centavos (integer) + moneda. Fechas en timestamptz (UTC).
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.booking_channel as enum ('marketplace', 'doctoralia', 'phone', 'walk_in');
create type public.consultation_modality as enum ('in_person', 'video');
create type public.payment_status as enum ('paid', 'pending', 'refunded', 'failed');
create type public.payment_method as enum ('card', 'apple_pay', 'cash', 'transfer');

-- ---------------------------------------------------------------------------
-- Consultorios y médicos
-- ---------------------------------------------------------------------------
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  city text not null default '',
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id),
  full_name text not null check (length(trim(full_name)) > 0),
  title text not null default 'Dr.',
  specialty text not null default '',
  email text not null default '',
  phone text not null default '',
  -- Datos fiscales (CFDI 4.0)
  billing_legal_name text not null default '',
  billing_rfc text not null default '',
  billing_tax_regime text not null default '612',
  billing_postal_code text not null default '',
  license_number text not null default '',
  billing_address text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catálogo, pacientes, citas, cobros y facturas
-- ---------------------------------------------------------------------------
create table public.consultation_types (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  price_amount integer not null check (price_amount >= 0),
  currency char(3) not null default 'MXN',
  modality public.consultation_modality not null default 'in_person',
  active boolean not null default true,
  unique (doctor_id, id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  unique (doctor_id, id)
);
create index patients_doctor_idx on public.patients (doctor_id, last_name, first_name);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  patient_id uuid not null,
  consultation_type_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  modality public.consultation_modality not null default 'in_person',
  channel public.booking_channel not null default 'phone',
  external_booking_id text,
  reminder_sent_at timestamptz,
  reminder_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (doctor_id, id),
  foreign key (doctor_id, patient_id) references public.patients (doctor_id, id) on delete cascade,
  foreign key (doctor_id, consultation_type_id) references public.consultation_types (doctor_id, id)
);
create index appointments_doctor_starts_idx on public.appointments (doctor_id, starts_at);
create index appointments_patient_idx on public.appointments (patient_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  appointment_id uuid not null,
  patient_id uuid not null,
  amount integer not null check (amount >= 0),
  currency char(3) not null default 'MXN',
  status public.payment_status not null,
  method public.payment_method not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  -- Token aleatorio para el enlace público de autofactura (no adivinable).
  invoice_token uuid not null default gen_random_uuid() unique,
  unique (doctor_id, id),
  unique (appointment_id),
  foreign key (doctor_id, appointment_id) references public.appointments (doctor_id, id) on delete cascade,
  foreign key (doctor_id, patient_id) references public.patients (doctor_id, id) on delete cascade
);
create index transactions_doctor_created_idx on public.transactions (doctor_id, created_at);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  transaction_id uuid not null unique,
  patient_id uuid not null,
  folio text not null,
  uuid text not null,
  issued_at timestamptz not null default now(),
  receiver_rfc text not null,
  receiver_name text not null,
  receiver_tax_regime text not null,
  receiver_postal_code text not null,
  receiver_cfdi_use text not null,
  receiver_email text not null,
  subtotal_amount integer not null check (subtotal_amount >= 0),
  currency char(3) not null default 'MXN',
  isr_withheld integer not null default 0 check (isr_withheld >= 0),
  foreign key (doctor_id, transaction_id) references public.transactions (doctor_id, id) on delete cascade,
  foreign key (doctor_id, patient_id) references public.patients (doctor_id, id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

-- Médico del usuario que hace la petición (null si no tiene consultorio aún).
create function public.current_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.doctors where user_id = auth.uid()
$$;

-- Alta del consultorio en un solo paso (onboarding), para el usuario actual.
create function public.create_my_practice(
  p_full_name text,
  p_title text,
  p_specialty text,
  p_phone text,
  p_clinic_name text,
  p_city text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_clinic uuid;
  v_doctor uuid;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.doctors where user_id = v_user) then
    raise exception 'practice already exists';
  end if;

  insert into public.clinics (name, city) values (p_clinic_name, coalesce(p_city, ''))
  returning id into v_clinic;

  insert into public.doctors (user_id, clinic_id, full_name, title, specialty, email, phone, billing_legal_name)
  values (
    v_user, v_clinic, p_full_name, coalesce(nullif(p_title, ''), 'Dr.'), coalesce(p_specialty, ''),
    coalesce((select email from auth.users where id = v_user), ''), coalesce(p_phone, ''), p_full_name
  )
  returning id into v_doctor;

  -- Catálogo inicial que el médico podrá ajustar.
  insert into public.consultation_types (doctor_id, name, duration_minutes, price_amount, modality) values
    (v_doctor, 'Primera consulta', 45, 120000, 'in_person'),
    (v_doctor, 'Consulta de seguimiento', 30, 90000, 'in_person'),
    (v_doctor, 'Teleconsulta', 30, 80000, 'video'),
    (v_doctor, 'Revisión de resultados', 15, 60000, 'in_person');

  return v_doctor;
end;
$$;

-- Datos mínimos para la página pública de autofactura, buscando por token.
-- No requiere sesión: el token es aleatorio y solo expone lo necesario.
create function public.self_invoice_context(p_token uuid)
returns table (
  transaction_id uuid,
  amount integer,
  currency char(3),
  method public.payment_method,
  service_starts_at timestamptz,
  consultation_name text,
  doctor_title text,
  doctor_name text,
  specialty text,
  clinic_name text,
  issuer_legal_name text,
  issuer_rfc text,
  issuer_tax_regime text,
  issuer_postal_code text,
  patient_email text,
  invoice_folio text,
  invoice_uuid text,
  invoice_issued_at timestamptz,
  invoice_receiver_rfc text
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.amount, t.currency, t.method, a.starts_at, ct.name,
         d.title, d.full_name, d.specialty, c.name,
         d.billing_legal_name, d.billing_rfc, d.billing_tax_regime, d.billing_postal_code,
         p.email, i.folio, i.uuid, i.issued_at, i.receiver_rfc
  from public.transactions t
  join public.appointments a on a.id = t.appointment_id
  join public.consultation_types ct on ct.id = a.consultation_type_id
  join public.doctors d on d.id = t.doctor_id
  join public.clinics c on c.id = d.clinic_id
  join public.patients p on p.id = t.patient_id
  left join public.invoices i on i.transaction_id = t.id
  where t.invoice_token = p_token and t.status = 'paid'
$$;

revoke all on function public.create_my_practice(text, text, text, text, text, text) from public, anon;
grant execute on function public.create_my_practice(text, text, text, text, text, text) to authenticated;
revoke all on function public.self_invoice_context(uuid) from public;
grant execute on function public.self_invoice_context(uuid) to anon, authenticated;
revoke all on function public.current_doctor_id() from public, anon;
grant execute on function public.current_doctor_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.clinics enable row level security;
alter table public.doctors enable row level security;
alter table public.consultation_types enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;

create policy "clinic: el médico ve su consultorio" on public.clinics
  for select to authenticated
  using (id = (select clinic_id from public.doctors where user_id = auth.uid()));
create policy "clinic: el médico edita su consultorio" on public.clinics
  for update to authenticated
  using (id = (select clinic_id from public.doctors where user_id = auth.uid()));

create policy "doctor: ve su perfil" on public.doctors
  for select to authenticated using (user_id = auth.uid());
create policy "doctor: edita su perfil" on public.doctors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mismo patrón para todas las tablas del médico.
create policy "consultation_types: solo del médico" on public.consultation_types
  for all to authenticated
  using (doctor_id = public.current_doctor_id())
  with check (doctor_id = public.current_doctor_id());
create policy "patients: solo del médico" on public.patients
  for all to authenticated
  using (doctor_id = public.current_doctor_id())
  with check (doctor_id = public.current_doctor_id());
create policy "appointments: solo del médico" on public.appointments
  for all to authenticated
  using (doctor_id = public.current_doctor_id())
  with check (doctor_id = public.current_doctor_id());
create policy "transactions: solo del médico" on public.transactions
  for all to authenticated
  using (doctor_id = public.current_doctor_id())
  with check (doctor_id = public.current_doctor_id());
create policy "invoices: solo del médico" on public.invoices
  for all to authenticated
  using (doctor_id = public.current_doctor_id())
  with check (doctor_id = public.current_doctor_id());
