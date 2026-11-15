import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const failed = params.error === "link";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <main className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <section className="rounded-xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold tracking-tight">Tu consultorio, desde cualquier lugar</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Entra para ver tu agenda, tus pacientes y tus finanzas.</p>
          {failed ? (
            <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              El enlace no es válido o ya caducó. Inicia sesión o pide uno nuevo.
            </p>
          ) : null}
          <LoginForm next={next} />
        </section>
      </main>
    </div>
  );
}
