import { Book, Menu, Sunset, Trees, Zap } from "lucide-react";
import { cn } from "cn";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { env } from "../env";
import { navbarAfterLogin } from "@/routes/navRoutes";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar35Props {
  className?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title: string;
    className?: string;
  };
  menu: MenuItem[];
  auth: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const defaultProps: Navbar35Props = {
  logo: {
    url: env.NEXT_PUBLIC_FRONTEND_URL,
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg",
    alt: "logo",
    title: "RedAid",
  },
  menu: navbarAfterLogin,
  auth: {
    login: { title: "Login", url: "/login" },
    signup: { title: "Sign up", url: "/signup" },
  },
};

const Navbar35 = async ({ className, ...props }: Partial<Navbar35Props>) => {
  const { logo, menu, auth } = {
    ...defaultProps,
    ...props,
  };

  const {data: session} = await authClient.getSession();

  return (
    <section className={cn("py-4 border-b-2 border-primary", className)}>
      <div className="container mx-auto">
        {/* desktop view */}
        <nav className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid">
          <Link
            href={logo.url}
            className="flex items-center gap-2 justify-self-start"
          >
            <Image
              src={logo.src}
              className="max-h-8 dark:invert"
              alt={logo.alt}
              width={20}
              height={20}
            />
            <span className="text-xl lg:text-2xl font-semibold tracking-tighter text-primary">
              {logo.title}
            </span>
          </Link>
          <NavigationMenu className="justify-self-center">
            <NavigationMenuList>
              {menu.map((item) => renderMenuItem(item))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex gap-2 justify-self-end">
            <Button
              variant="outline"
              size="sm"
              render={<a href={auth.login.url} />}
              nativeButton={false}
            >
              {auth.login.title}
            </Button>
            <Button
              size="sm"
              render={<a href={auth.signup.url} />}
              nativeButton={false}
            >
              {auth.signup.title}
            </Button>
          </div>
        </nav>

        {/* mobile view */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image
                src={logo.src}
                className="max-h-8 dark:invert"
                alt={logo.alt}
                width={20}
                height={20}
              />
              <span className="text-lg font-semibold tracking-tighter text-primary">
                {logo.title}
              </span>
            </Link>
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" />}>
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className="flex items-center gap-2">
                      <Image
                        src={logo.src}
                        className="max-h-8 dark:invert"
                        alt={logo.alt}
                        width={20}
                        height={20}
                      />
                      <span className="text-xl font-semibold tracking-tighter text-primary">
                        {logo.title}
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  <div className="flex flex-col gap-3">
                    <Link href={auth.login.url} passHref>
                      <Button variant="outline" className="w-full">
                        {auth.login.title}
                      </Button>
                    </Link>
                    <Link href={auth.signup.url} passHref>
                      <Button className="w-full">{auth.signup.title}</Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) => (
            <NavigationMenuLink key={subItem.title} className="w-80" render={<SubMenuLink item={subItem} />}></NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a key={item.title} href={item.url} className="text-md font-semibold">
      {item.title}
    </a>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <a
      className="flex min-w-80 flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </a>
  );
};

export { Navbar35 };
