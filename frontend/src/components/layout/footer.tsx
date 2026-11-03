import Link from "next/link";
import { ArrowRight, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ROLE } from "@/constants/roles";
import { getSidebarRoutes } from "@/routes/dashboardRoutes";
import { navbarBeforeLogin } from "@/routes/navRoutes";
import { userServices } from "@/service/user.service";
import { Logo } from "../common/logo";

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="-ml-3 w-2 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100">
        <ArrowRight className="size-3 text-primary" />
      </span>
      {label}
    </Link>
  );
}

export async function Footer() {
  const { data: session } = await userServices.getSessionServer();
  const user = session?.user;
  const isDonor = user?.role === ROLE.USER;

  const platformLinks = [
    ...navbarBeforeLogin.map((item) => ({ label: item.title, href: item.url })),
    ...(isDonor ? [{ label: "Add Request", href: "/add-request" }] : []),
  ];

  const accountTitle = user ? "Dashboard" : "Account";
  const accountLinks = user
    ? getSidebarRoutes(user.role).map((route) => ({
        label: route.title,
        href: route.url,
      }))
    : [
        { label: "Log in", href: "/login" },
        { label: "Sign up", href: "/signup" },
      ];

  const columns = [
    { title: "Platform", links: platformLinks },
    { title: accountTitle, links: accountLinks },
  ];

  return (
    <footer className="relative isolate mt-30 sm:mt-35 pb-15 border-t bg-muted/30">
      {/* decorations live in their own clipped layer, so the CTA can overlap the top edge */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
        <div className="absolute -bottom-40 left-1/2 size-160 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* call to action */}
        <div className="relative -mt-20 overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:p-10 max-w-4xl mx-auto">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 size-64 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Someone near you needs blood{" "}
                <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                  today
                </span>
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                {user
                  ? "Check who needs your blood type right now."
                  : "Sign up once as a donor and get alerted when your area needs your blood type."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                render={<Link href={user ? "/all-requests" : "/signup"} />}
                nativeButton={false}
              >
                {user ? "Browse requests" : "Become a donor"}
                <ArrowRight className="size-4" />
              </Button>
              {(!user || isDonor) && (
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/add-request" />}
                  nativeButton={false}
                >
                  Request blood
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* links */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-xs space-y-4">
            <Link href="/" aria-label="RedAid home" className="inline-flex">
              <Logo markClassName="size-9" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting patients with eligible donors and verified blood banks
              across Bangladesh, union by union.
            </p>
          </div>

          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RedAid. All rights reserved.</p>
          <p>Made to connect donors and save lives across Bangladesh.</p>
        </div>
      </div>

      {/* oversized wordmark, clipped by its own wrapper instead of the footer */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden text-center text-[22vw] leading-none font-bold tracking-tighter text-transparent select-none lg:text-[13rem]"
      >
        <span className="mb-[-0.18em] block bg-linear-to-b from-primary/25 to-transparent bg-clip-text">
          RedAid
        </span>
      </div>
    </footer>
  );
}
