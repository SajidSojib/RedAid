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
import type { IconKey } from "./dashboardRoutes";

export const DASHBOARD_ICONS: Record<IconKey, LucideIcon> = {
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
