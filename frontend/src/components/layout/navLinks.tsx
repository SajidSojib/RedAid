"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/layout/navigation-menu";
import { cn } from "cn";
import { MenuItem } from "./navbar";

interface NavbarLinksProps {
  menu: MenuItem[];
}

const isActiveRoute = (pathname: string, url: string) =>
  url !== "#" &&
  (pathname === url || (url !== "/" && pathname.startsWith(`${url}/`)));

const underlineClass = (active: boolean) =>
  cn(
    "relative bg-transparent hover:bg-transparent",
    "after:absolute after:bottom-0 after:left-1/2",
    "after:h-0.5 after:w-full after:-translate-x-1/2",
    "after:origin-center after:scale-x-0",
    "after:bg-primary after:transition-transform after:duration-300",
    "hover:after:scale-x-100",
    active && "after:scale-x-100",
  );

export function NavbarLinks({ menu }: NavbarLinksProps) {
  const pathname = usePathname();

  return (
    <NavigationMenu className="justify-self-center">
      <NavigationMenuList>
        {menu.map((item) => {
          const active =
            isActiveRoute(pathname, item.url) ||
            Boolean(
              item.items?.some((subItem) =>
                isActiveRoute(pathname, subItem.url),
              ),
            );

          if (item.items) {
            return (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger className={underlineClass(active)}>
                  {item.title}
                </NavigationMenuTrigger>

                <NavigationMenuContent className="bg-popover text-popover-foreground">
                  {item.items.map((subItem) => (
                    <NavigationMenuLink
                      key={subItem.title}
                      className="w-80"
                      render={
                        <Link
                          href={subItem.url}
                          className={cn(
                            "flex min-w-80 gap-4 rounded-md p-3",
                            "transition-colors hover:bg-muted",
                            isActiveRoute(pathname, subItem.url) && "bg-muted",
                          )}
                        >
                          <span className="text-foreground">
                            {subItem.icon}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {subItem.title}
                            </span>
                            {subItem.description && (
                              <span className="block text-sm text-muted-foreground">
                                {subItem.description}
                              </span>
                            )}
                          </span>
                        </Link>
                      }
                    />
                  ))}
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink
                href={item.url}
                className={underlineClass(isActiveRoute(pathname, item.url))}
              >
                {item.title}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
