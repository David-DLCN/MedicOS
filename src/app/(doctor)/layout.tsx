import { AppShell } from "@/components/layout/app-shell";
import { IS_DEMO_DATA } from "@/lib/config";
import { getNow, getPracticeContext } from "@/lib/data/repository";
import { capitalize, formatDate } from "@/lib/format";

/** Layout for every screen of the doctor-facing app ("Doctor OS"). */
export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { doctor, clinic } = await getPracticeContext();

  return (
    <AppShell
      doctor={{
        displayName: `${doctor.title} ${doctor.fullName}`,
        specialty: doctor.specialty,
        clinicName: clinic.name,
      }}
      todayLabel={capitalize(formatDate(getNow(), "long"))}
      isDemo={IS_DEMO_DATA}
    >
      {children}
    </AppShell>
  );
}
