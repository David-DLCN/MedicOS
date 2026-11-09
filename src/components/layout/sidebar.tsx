"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";

export interface SidebarDoctor {
  displayName: string;
  specialty: string;
  clinicName: string;
}

export function Sidebar({
  doctor,
  onNavigate,
}: {
  doctor: SidebarDoctor;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5 text-white">
        <Logo />
      </div>

      <nav aria-label="Principal" className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-foreground hover:bg-sidebar-active/60 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-4.5", active ? "text-teal-300" : "text-sidebar-muted")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={doctor.displayName.replace(/^Dr[a]?\.\s*/, "")} className="bg-white/10 text-white" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{doctor.displayName}</p>
            <p className="truncate text-xs text-sidebar-muted">
              {doctor.specialty} · {doctor.clinicName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
