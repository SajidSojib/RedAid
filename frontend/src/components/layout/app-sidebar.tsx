"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Loader, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { DASHBOARD_ICONS } from "@/routes/dashboardIcons";
import {
  getSidebarRoutes,
  isKnownRole,
  matchesPath,
  type UserRole,
} from "@/routes/dashboardRoutes";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Logo, LogoMark } from "../common/logo";

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Donor & requester",
  BANK: "Blood bank",
  ADMIN: "Administrator",
};

type Account = { name: string; email: string; image: string | null };

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

export function AppSidebar({
  role,
  account,
}: {
  role?: string | null;
  account: Account;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const routes = getSidebarRoutes(role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Close the mobile drawer after choosing a page
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const handleLogout = async () => {
    const toastId = toast.loading("Logging you out...");
    setIsSubmitting(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
          },
        },
      });
      toast.success("Logged out successfully", { id: toastId });
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Something went wrong", { id: toastId });
    }
  };

  return (
    <Sidebar collapsible="icon" className="top-0 h-full">
      <SidebarMenuItem>
        <Link
          href="/"
          aria-label="RedAid"
          className="flex items-center justify-center gap-2 border-b-2 border-primary py-2.5"
        >
          <LogoMark className="size-8 shrink-0" />
          <span className="text-xl leading-none tracking-tight group-data-[collapsible=icon]:hidden xl:text-2xl">
            <span className="font-bold text-foreground">Red</span>
            <span className="font-bold text-primary">Aid</span>
          </span>
        </Link>
      </SidebarMenuItem>

      <SidebarContent>
        <SidebarGroup>
          {isKnownRole(role) && (
            <SidebarGroupLabel>{ROLE_LABEL[role]}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {routes.map((route) => {
                const Icon = DASHBOARD_ICONS[route.icon];

                return (
                  <SidebarMenuItem key={route.url}>
                    <SidebarMenuButton
                      isActive={matchesPath(pathname, route.url)}
                      tooltip={route.title}
                      render={<Link href={route.url} />}
                    >
                      <Icon />
                      <span>{route.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Go to Homepage"
              className="justify-center bg-secondary group-data-[collapsible=icon]:justify-center"
              render={<Link href="/" />}
            >
              <Home />
              <span>Go to Homepage</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="justify-center bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground group-data-[collapsible=icon]:justify-center"
            >
              {isSubmitting ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator />

        <div className="flex items-center gap-3 p-1 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8">
            <AvatarImage src={account.image ?? undefined} alt={account.name} />
            <AvatarFallback className="text-xs">
              {initials(account.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{account.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {account.email}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
