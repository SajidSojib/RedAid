import Link from "next/link";
import type { ReactNode } from "react";
import { Award, BellRing, MapPinned, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/common/logo";

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: MapPinned,
    title: "Choose your areas",
    text: "Create an account and pick where you can donate.",
  },
  {
    icon: BellRing,
    title: "Get alerted nearby",
    text: "We notify you when your blood type is needed close by.",
  },
  {
    icon: Award,
    title: "Earn recognition",
    text: "Confirmed donations give you points, badges and certificates.",
  },
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
      <aside className="sticky top-0 isolate hidden h-svh flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        {/* grid + glows */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-foreground)_10%,transparent)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
        />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />

        <Link
          href="/"
          aria-label="RedAid home"
          className="flex w-fit items-center gap-2"
        >
          <LogoMark inverted className="size-9" />
          <span className="text-xl font-bold tracking-tight">RedAid</span>
        </Link>

        <div className="max-w-md space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl leading-tight font-bold tracking-tight text-balance">
              Reach donors in your area in minutes, not hours.
            </h2>
            <p className="text-primary-foreground/75">
              RedAid connects people who need blood with eligible donors and
              verified blood banks nearby.
            </p>
          </div>

          <ol className="space-y-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                style={{ animationDelay: `${i * 120}ms` }}
                className="flex gap-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 backdrop-blur-sm transition-colors hover:bg-primary-foreground/10 motion-safe:animate-fade-up"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-5" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-primary-foreground/70">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-primary-foreground/60">
          Made to connect donors and save lives across Bangladesh.
        </p>
      </aside>

      <section className="relative isolate flex flex-col overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-primary/10 blur-3xl"
        />

        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" aria-label="RedAid home" className="lg:hidden">
            <Logo markClassName="size-8" />
          </Link>
          <p className="ml-auto text-sm text-muted-foreground">{topRight}</p>
        </header>

        <div
          className={cn(
            "mx-auto w-full flex-1 px-6 pt-4 pb-16 sm:px-10",
            contentClassName,
          )}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
