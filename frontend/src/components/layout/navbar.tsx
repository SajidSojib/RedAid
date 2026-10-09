import { Menu } from "lucide-react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { env } from "@/env";
import { navbarAfterLogin, navbarBeforeLogin } from "@/routes/navRoutes";
import { userServices } from "@/service/user.service";
import { NavbarLinks } from "./navLinks";
import LogoutButton from "../common/LogoutButton";

export interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface NavbarProps {
  className?: string;
}

const logo = {
  url: env.NEXT_PUBLIC_FRONTEND_URL,
  src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
  alt: "RedAid logo",
  title: "RedAid",
};

function SubMenuLink({ item }: { item: MenuItem }) {
  return (
    <Link
      href={item.url}
      className="flex min-w-0 flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none hover:bg-muted hover:text-accent-foreground"
    >
      <div className="text-foreground">{item.icon}</div>

      <div className="min-w-0">
        <div className="text-sm font-semibold">{item.title}</div>

        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function MobileMenuItem({ item }: { item: MenuItem }) {
  if (item.items?.length) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-2 text-base cursor-pointer hover:text-primary hover:bg-muted font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>

        <AccordionContent className="mt-2">
          <div className="flex flex-col gap-1">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      key={item.title}
      href={item.url}
      className="py-2 cursor-pointer text-base font-semibold transition-colors hover:bg-muted hover:text-primary"
    >
      {item.title}
    </Link>
  );
}

export default async function Navbar({ className }: NavbarProps) {
  const { data: session } = await userServices.getSessionServer();
  console.log(session)

  const isLoggedIn = Boolean(session?.user);
  const menu = isLoggedIn ? navbarAfterLogin : navbarBeforeLogin;

  return (
    <section className={cn("border-b-2 border-primary py-4", className)}>
      <div className="container mx-auto">
        {/* Desktop navigation */}
        <nav className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid">
          <Link
            href={logo.url}
            className="flex items-center gap-2 justify-self-start"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={32}
              height={32}
              priority
              className="h-auto w-8 dark:invert"
            />

            <span className="text-xl font-semibold tracking-tighter text-primary lg:text-2xl">
              {logo.title}
            </span>
          </Link>

            {/* Navigation links */}
          <NavbarLinks menu={menu} />

          <div className="flex gap-2 justify-self-end">
            {isLoggedIn ? (
              <Button
                size="sm"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/login" />}
                  nativeButton={false}
                >
                  Login
                </Button>

                <Button
                  size="sm"
                  render={<Link href="/signup" />}
                  nativeButton={false}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile navigation */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={28}
                height={28}
                priority
                className="h-auto w-7 dark:invert"
              />

              <span className="text-lg font-semibold tracking-tighter text-primary">
                {logo.title}
              </span>
            </Link>

            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation menu"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>

              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className="flex items-center gap-2">
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={32}
                        height={32}
                        className="h-auto w-8 dark:invert"
                      />

                      <span className="text-xl font-semibold tracking-tighter text-primary">
                        {logo.title}
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 p-4 pt-0">
                  <Accordion className="flex w-full flex-col">
                    {menu.map((item) => (
                      <MobileMenuItem key={item.title} item={item} />
                    ))}
                  </Accordion>

                  <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                      <LogoutButton></LogoutButton>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          render={<Link href="/login" />}
                          nativeButton={false}
                        >
                          Login
                        </Button>

                        <Button
                          className="w-full"
                          render={<Link href="/signup" />}
                          nativeButton={false}
                        >
                          Sign up
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
