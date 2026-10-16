import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ROLE } from "@/constants/roles";
import { isKnownRole } from "@/routes/dashboardRoutes";
import { userServices } from "@/service/user.service";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({
  admin,
  bank,
  user,
}: {
  admin: ReactNode;
  bank: ReactNode;
  user: ReactNode;
}) {
  const { data: session } = await userServices.getSessionServer();
  const account = session?.user;

  // The proxy already blocks these, but a layout doesn't re-run on client-side navigation
  if (!account || (account.status && account.status !== "ACTIVE")) {
    redirect("/login?next=/dashboard");
  }

  // Same fallback as the proxy and navbar: a missing or unknown role is treated as USER
  const role = isKnownRole(account.role) ? account.role : ROLE.USER;

  return (
    <SidebarProvider className="min-h-[calc(100svh-var(--header-height))]">
      <AppSidebar
        role={role}
        account={{
          name: account.name,
          email: account.email,
          image: account.image ?? null,
        }}
      />

      <SidebarInset>
        <DashboardHeader role={role} />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {role === ROLE.ADMIN && admin}
          {role === ROLE.BANK && bank}
          {role === ROLE.USER && user}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
