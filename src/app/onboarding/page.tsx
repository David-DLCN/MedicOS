import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { findPracticeContext } from "@/lib/data/repository";

export const metadata: Metadata = { title: "Tu consultorio" };

export default async function OnboardingPage() {
  // Already set up: straight to the dashboard.
  if (await findPracticeContext()) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <main className="w-full max-w-md">
        <Logo className="mb-8 justify-center" />
        <section className="rounded-xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold tracking-tight">Configura tu consultorio</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Un paso y entras a tu panel.</p>
          <OnboardingForm />
        </section>
      </main>
    </div>
  );
}
