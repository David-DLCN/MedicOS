import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for the doctor app navigation. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/appointments", label: "Citas", icon: CalendarDays },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/finance", label: "Finanzas", icon: Wallet },
  { href: "/settings", label: "Ajustes e integraciones", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
