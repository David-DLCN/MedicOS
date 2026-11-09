"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Sidebar, type SidebarDoctor } from "./sidebar";

/**
 * Doctor app frame: fixed sidebar on desktop, slide-over drawer on mobile.
 */
export function AppShell({
  doctor,
  todayLabel,
  isDemo,
  children,
}: {
  doctor: SidebarDoctor;
  todayLabel: string;
  isDemo: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border lg:block">
        <Sidebar doctor={doctor} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar doctor={doctor} onNavigate={() => setOpen(false)} />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1.5 text-muted hover:bg-surface-muted"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="-ml-1.5 rounded-md p-1.5 text-muted hover:bg-surface-muted lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Logo className="lg:hidden" />
          <p className="hidden text-sm text-muted lg:block">{todayLabel}</p>
          <div className="ml-auto flex items-center gap-3">
            {isDemo ? (
              <span
                className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-info"
                title="Todos los pacientes, citas y cifras de esta versión son ficticios."
              >
                Datos de demostración
              </span>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
