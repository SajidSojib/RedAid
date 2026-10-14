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

export type UserRole = "USER" | "BANK" | "ADMIN";

const icon = (Icon: LucideIcon) => <Icon className="size-5 shrink-0" />;

// What appears in the "Dashboard" dropdown for each role
const dashboardItems: Record<UserRole, MenuItem[]> = {
  USER: [
    {
      title: "My Donations",
      description: "Your donation history, points, badges and certificates",
      icon: icon(Droplet),
      url: "/dashboard/my-donations",
    },
    {
      title: "My Requests",
      description: "Blood requests you created and the donors who accepted",
      icon: icon(ClipboardList),
      url: "/dashboard/my-requests",
    },
    {
      title: "My Offers",
      description: "Requests sent to you as a donor",
      icon: icon(Inbox),
      url: "/dashboard/my-offers",
    },
    {
      title: "Profile & Areas",
      description: "Edit your details and the areas where you can donate",
      icon: icon(UserRound),
      url: "/dashboard/profile",
    },
  ],
  BANK: [
    {
      title: "Inventory",
      description: "Update your blood stock by blood type",
      icon: icon(Package),
      url: "/dashboard/inventory",
    },
    {
      title: "Incoming Requests",
      description: "Approve, reject or fulfill requests sent to your bank",
      icon: icon(Inbox),
      url: "/dashboard/bank-requests",
    },
    {
      title: "Bank Profile",
      description: "Bank details and verification status",
      icon: icon(Building2),
      url: "/dashboard/bank-profile",
    },
  ],
  ADMIN: [
    {
      title: "Bank Verifications",
      description: "Review and approve new blood bank registrations",
      icon: icon(ShieldCheck),
      url: "/dashboard/bank-verifications",
    },
    {
      title: "Reports",
      description: "Review accounts reported as fake or abusive",
      icon: icon(Flag),
      url: "/dashboard/reports",
    },
    {
      title: "Users",
      description: "View and manage user accounts",
      icon: icon(Users),
      url: "/dashboard/users",
    },
  ],
};

const baseMenu: MenuItem[] = [
  { title: "Home", url: "/" },
  { title: "Blood Banks", url: "/blood-banks" },
  { title: "Top Donors", url: "/top-donors" },
];

export const navbarBeforeLogin: MenuItem[] = baseMenu;

export const getNavbarAfterLogin = (role?: string | null): MenuItem[] => [
  ...baseMenu,
  {
    title: "Dashboard",
    url: "#",
    // An unknown role falls back to the donor menu instead of an empty dropdown
    items: dashboardItems[role as UserRole] ?? dashboardItems.USER,
  },
];
