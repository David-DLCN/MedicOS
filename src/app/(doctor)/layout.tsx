import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { IS_DEMO_DATA, IS_LIVE } from "@/lib/config";
import { findPracticeContext, getNow } from "@/lib/data/repository";
import { capitalize, formatDate } from "@/lib/format";

/** Layout for every screen of the doctor-facing app ("Doctor OS"). */
export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const context = await findPracticeContext();
  // Live mode: a signed-in user without a practice goes through onboarding first.
  if (!context) redirect("/onboarding");
  const { doctor, clinic } = context;

  return (
    <AppShell
      doctor={{
        fullName: doctor.fullName,
        displayName: `${doctor.title} ${doctor.fullName}`,
        specialty: doctor.specialty,
        clinicName: clinic.name,
      }}
      todayLabel={capitalize(formatDate(getNow(), "long"))}
      isDemo={IS_DEMO_DATA}
      canSignOut={IS_LIVE}
    >
      {children}
    </AppShell>
  );
}
