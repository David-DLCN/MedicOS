# MedicOS

El sistema operativo para médicos independientes y consultorios pequeños.

> **Estado:** prototipo del MVP (Fase 5 completada: panel, Citas, Pacientes, Finanzas y Ajustes). **Todos los datos son ficticios**:
> pacientes, citas y cifras se generan de forma determinista. No hay backend, autenticación ni
> pagos reales, y el prototipo **no** cumple ninguna normativa sanitaria.

> **Diseño:** toda pantalla debe cumplir [`docs/guia-de-diseno.md`](docs/guia-de-diseno.md)
> (4 colores fríos como máximo, una sola fuente, menú de 5 secciones como máximo, textos breves).
> Las instrucciones para agentes de código están en [`AGENTS.md`](AGENTS.md).

## Puesta en marcha

Requisitos: Node.js 20 o superior (probado con 22).

```bash
npm ci
npm run dev        # http://localhost:3000
```

Comprobaciones:

```bash
npx tsc --noEmit   # tipos
npm run lint       # ESLint
npm run build      # build de producción
```

## Stack

| Capa | Elección | Nota |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto | |
| Estilos | Tailwind CSS v4 con tokens semánticos en `src/app/globals.css` (paleta de 4 colores) | Componentes al estilo shadcn/ui, escritos a mano (sin CLI) |
| Gráficos | Recharts | |
| Iconos | lucide-react | |
| Datos | Repositorio en memoria con datos ficticios | Preparado para Supabase/PostgreSQL |
| Despliegue | Vercel (previsto) | |

## Estructura

```
src/
  app/
    page.tsx                 # "/" → reservado al marketplace futuro; hoy redirige a /dashboard
    (doctor)/                # Doctor OS: todas las pantallas del médico comparten AppShell
      layout.tsx
      dashboard/             # Panel (implementado)
      appointments/          # Agenda día/semana (?date=YYYY-MM-DD&view=day|week) y detalle /[id]
      patients/              # Listado (?q=&segment=&sort=&page=) y perfil /[id] con carpeta de documentos
      finance/               # Resumen por periodo, pendientes y movimientos (?period=&status=&method=&page=)
      settings/              # Pestañas: perfil, consultas e integraciones (solo lectura)
    receipts/[transactionId] # Recibo de honorarios imprimible / PDF (fuera del menú, para imprimir)
    facturar/[token]         # Autofactura CFDI pública para el paciente (sin cuenta, pensada para celular)
    (doctor)/finance/close   # Cierre de caja diario
  components/
    ui/                      # Primitivas reutilizables: Card, Badge, Button, Table, Avatar, EmptyState
    layout/                  # AppShell, Sidebar, navegación, PageHeader
    charts/                  # Gráficos (componentes cliente)
  features/                  # Lógica de presentación por módulo (dashboard, appointments, finance…)
  lib/
    config.ts                # Locale, moneda, zona horaria, "hoy" de la demo
    format.ts                # Formateo de dinero, fechas y números (Intl)
    domain/                  # Tipos de dominio, métricas puras, utilidades de fecha
    data/
      repository.ts          # ÚNICO punto de acceso a datos para la UI
      mock/                  # Semilla y generador determinista de datos ficticios
```

## Decisiones de arquitectura

1. **La UI solo lee datos a través de `lib/data/repository.ts`.** Las funciones son `async` y
   devuelven los tipos de `lib/domain/types.ts`. Para conectar Supabase se reimplementa ese
   archivo; los componentes no cambian.
2. **Las métricas son funciones puras** (`lib/domain/metrics.ts`). Ningún número del panel está
   escrito a mano en un componente.
3. **Datos ficticios coherentes.** El generador crea primero las citas y *deriva* los pagos de
   ellas: los ingresos siempre corresponden a consultas concretas. Reglas: las consultas
   realizadas se cobran (las recientes pueden quedar pendientes); las reservas online se
   prepagan; las inasistencias conservan el pago; las cancelaciones se reembolsan.
4. **Dinero en unidades menores** (`{ amount: 90000, currency: "MXN" }`) para evitar errores de
   coma flotante.
5. **Fechas en UTC y un "hoy" fijo** (`DEMO_NOW` en `lib/config.ts`) para que la demo sea
   estable y el HTML del servidor coincida con el del cliente. Las zonas horarias por consultorio
   llegarán con el backend.
6. **Multi-tenencia preparada:** cada entidad lleva `doctorId`, y el médico pertenece a un
   `Clinic`. Hoy solo hay un médico.
7. **Pagos agnósticos del proveedor.** `Transaction` no contiene identificadores de Stripe ni de
   Shopify. Los datos propios de cada proveedor irán en tablas aparte.

## Funciones añadidas tras la Fase 5

- **Carpeta de documentos del paciente** (perfil del paciente): acepta cualquier tipo de archivo
  (hasta 25 MB), lo clasifica (resultados, recetas, imagen, informes…) y lista también los
  recibos. En la demo, los archivos subidos se guardan **solo en el navegador** (IndexedDB,
  `features/documents/document-store.ts`). En producción irán a almacenamiento privado y
  cifrado por médico.
- **Recibos de honorarios** para reembolso de seguros médicos: uno por pago cobrado, con folio y
  datos de facturación del médico (`lib/domain/receipts.ts`). No son facturas fiscales: ver
  "Decisiones abiertas".
- **Doctoralia integrado, no sustituido**: canal de reserva propio en la agenda y plan técnico en
  [`docs/integraciones/doctoralia.md`](docs/integraciones/doctoralia.md).

- **Facturación CFDI 4.0 con autofactura**: cada pago cobrado tiene un enlace que el médico comparte
  (por ejemplo, por WhatsApp). El paciente captura RFC, nombre, régimen, C.P. y uso (D01 por
  defecto; G03 si es empresa) y ve su factura: honorarios **exentos de IVA** y **retención del
  10 % de ISR** cuando factura una persona moral (`lib/domain/invoicing.ts`). En la demo no se
  timbra: en producción se conectará un PAC certificado con la e.firma (CSD) del médico.
- **Cierre de caja diario** (`lib/domain/cash-close.ts`): cobrado por método, efectivo esperado,
  prepagos en línea y consultas sin cobrar. La suma de cierres coincide con los ingresos del mes.

## Decisiones abiertas

- **Infraestructura de pagos para el marketplace.** Stripe Connect encaja de forma natural con
  muchos médicos, comisiones de plataforma, pagos a médicos y reembolsos por cita. Shopify no
  está pensado para repartir pagos entre varios proveedores, así que necesita una evaluación
  aparte antes de adoptarlo.
- **Proveedor de timbrado (PAC)** para CFDI 4.0 y gestión de los CSD de cada médico.
- **Expediente clínico**: cuando se guarde historia clínica real, cumplir la NOM-024-SSA3-2012 y la
  NOM-004-SSA3-2012.
- Moneda, locale y zona horaria por consultorio (hoy: MXN, `es-MX`, UTC en `lib/config.ts`; mercado inicial: México, empezando por el norte).
- Autenticación y autorización (probablemente Supabase Auth con Row Level Security por `doctorId`).
- Modo oscuro (los tokens ya lo permiten).

## Próximos pasos

1. Esquema de Supabase que refleje `lib/domain/types.ts`, más el repositorio real.
2. Autenticación del médico; después, la edición de perfil, consultas y precios en Ajustes.
3. Prototipo del marketplace y del flujo de pago.
