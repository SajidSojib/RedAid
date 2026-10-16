import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  Droplet,
  Flag,
  Inbox,
  Package,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { MenuItem } from "@/components/layout/navbar";
import { ROLE } from "@/constants/roles";
import {
  DASHBOARD_ROUTES,
  isKnownRole,
  type DashboardRoute,
  type IconKey,
} from "./dashboardRoutes";

// Keeps any file that imported this type from here working
export type { UserRole } from "./dashboardRoutes";

const ICONS: Record<IconKey, LucideIcon> = {
  droplet: Droplet,
  clipboard: ClipboardList,
  inbox: Inbox,
  user: UserRound,
  package: Package,
  building: Building2,
  shield: ShieldCheck,
  flag: Flag,
  users: Users,
};

const toMenuItem = (route: DashboardRoute): MenuItem => {
  const Icon = ICONS[route.icon];

  return {
    title: route.title,
    description: route.description,
    url: route.url,
    icon: <Icon className="size-5 shrink-0" />,
  };
};

const baseMenu: MenuItem[] = [
  { title: "Home", url: "/" },
  { title: "Blood Banks", url: "/blood-banks" },
  { title: "Top Donors", url: "/top-donors" },
  { title: "All Requests", url: "/all-requests" },
];

export const navbarBeforeLogin: MenuItem[] = baseMenu;

export const getNavbarAfterLogin = (role?: string | null): MenuItem[] => {
  // An unknown role falls back to the donor menu instead of an empty dropdown
  const routes = isKnownRole(role)
    ? DASHBOARD_ROUTES[role]
    : DASHBOARD_ROUTES.USER;

  return [
    ...baseMenu,
    ...(role === ROLE.USER
      ? [{ title: "Add Request", url: "/add-request" }]
      : []),
    {
      title: "Dashboard",
      url: "#",
      items: routes.filter((route) => !route.hidden).map(toMenuItem),
    },
  ];
};
