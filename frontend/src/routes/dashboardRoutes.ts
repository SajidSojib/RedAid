export type UserRole = "USER" | "BANK" | "ADMIN";

export type IconKey =
  | "droplet"
  | "clipboard"
  | "inbox"
  | "user"
  | "package"
  | "building"
  | "shield"
  | "flag"
  | "users";

export type DashboardRoute = {
  title: string;
  description: string;
  url: string;
  icon: IconKey;
  hidden?: boolean; // still protected by the proxy, but not shown in the navbar dropdown
};

// The first entry of each role is that role's landing page (/dashboard redirects there)
export const DASHBOARD_ROUTES: Record<UserRole, DashboardRoute[]> = {
  USER: [
    {
      title: "My Donations",
      description: "Your donation history, points, badges and certificates",
      url: "/dashboard/my-donations",
      icon: "droplet",
    },
    {
      title: "My Requests",
      description: "Blood requests you created and the donors who accepted",
      url: "/dashboard/my-requests",
      icon: "clipboard",
    },
    {
      title: "My Offers",
      description: "Requests sent to you as a donor",
      url: "/dashboard/my-offers",
      icon: "inbox",
    },
    {
      title: "Profile & Areas",
      description: "Edit your details and the areas where you can donate",
      url: "/dashboard/profile",
      icon: "user",
    },
  ],
  BANK: [
    {
      title: "Inventory",
      description: "Update your blood stock by blood type",
      url: "/dashboard/inventory",
      icon: "package",
    },
    {
      title: "Incoming Requests",
      description: "Approve, reject or fulfill requests sent to your bank",
      url: "/dashboard/bank-requests",
      icon: "inbox",
    },
    {
      title: "Bank Profile",
      description: "Bank details and verification status",
      url: "/dashboard/bank-profile",
      icon: "building",
    },
  ],
  ADMIN: [
    {
      title: "Bank Verifications",
      description: "Review and approve new blood bank registrations",
      url: "/dashboard/bank-verifications",
      icon: "shield",
    },
    {
      title: "Reports",
      description: "Review accounts reported as fake or abusive",
      url: "/dashboard/reports",
      icon: "flag",
    },
    {
      title: "Users",
      description: "View and manage user accounts",
      url: "/dashboard/users",
      icon: "users",
    },
  ],
};

export const isKnownRole = (role: unknown): role is UserRole =>
  typeof role === "string" && Object.hasOwn(DASHBOARD_ROUTES, role);

export const getDashboardHome = (role: UserRole) =>
  DASHBOARD_ROUTES[role][0].url;

const matchesPath = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// The roles that may open this path. Empty means it isn't a listed dashboard page.
export const getPathOwners = (pathname: string): UserRole[] =>
  (Object.keys(DASHBOARD_ROUTES) as UserRole[]).filter((role) =>
    DASHBOARD_ROUTES[role].some((route) => matchesPath(pathname, route.url)),
  );
