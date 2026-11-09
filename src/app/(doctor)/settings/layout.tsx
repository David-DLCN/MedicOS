import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/features/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Ajustes" description="Tu perfil profesional, tus consultas y los servicios conectados." />
      <SettingsTabs />
      {children}
    </>
  );
}
