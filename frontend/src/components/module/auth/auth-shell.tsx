import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const steps = [
  "Create an account and choose the areas where you can donate.",
  "Get notified when someone nearby needs your blood type.",
  "Confirm your donation and earn points, badges, and certificates.",
];

export function AuthShell({
  topRight,
  contentClassName,
  children,
}: {
  topRight: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[5fr_7fr]">
      <aside className="sticky top-0 hidden h-svh flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          RedAid
        </Link>

        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Reach donors in your area in minutes, not hours.
            </h2>
            <p className="text-primary-foreground/80">
              RedAid connects people who need blood with eligible donors and
              verified blood banks nearby.
            </p>
          </div>

          <ol className="space-y-4 border-t border-primary-foreground/20 pt-6">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 text-sm text-primary-foreground/90"
              >
                <span className="font-medium tabular-nums text-primary-foreground/60">
                  0{index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-primary-foreground/60">
          Northern University Bangladesh · CSE2291
        </p>
      </aside>

      <section className="flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight lg:invisible"
          >
            RedAid
          </Link>
          <p className="text-sm text-muted-foreground">{topRight}</p>
        </header>

        <div
          className={cn(
            "mx-auto w-full flex-1 px-6 pb-16 pt-4 sm:px-10",
            contentClassName,
          )}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
