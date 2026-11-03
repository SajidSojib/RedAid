import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations/signup";

// Same rules as the backend COMPATIBLE_Donors: recipient -> donor types allowed.
const ALL = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
];

const DONORS_FOR: Record<string, string[]> = {
  O_NEGATIVE: ["O_NEGATIVE"],
  O_POSITIVE: ["O_POSITIVE", "O_NEGATIVE"],
  A_NEGATIVE: ["A_NEGATIVE", "O_NEGATIVE"],
  A_POSITIVE: ["A_POSITIVE", "A_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"],
  B_NEGATIVE: ["B_NEGATIVE", "O_NEGATIVE"],
  B_POSITIVE: ["B_POSITIVE", "B_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"],
  AB_NEGATIVE: ["AB_NEGATIVE", "A_NEGATIVE", "B_NEGATIVE", "O_NEGATIVE"],
  AB_POSITIVE: ALL,
};

const label = (value: string) =>
  BLOOD_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;

type Mode = "need" | "give";

const MODES: { value: Mode; title: string }[] = [
  { value: "need", title: "I need blood" },
  { value: "give", title: "I can donate" },
];

const href = (mode: Mode, type: string) =>
  `/?compatibility_mode=${mode}&compatibility_type=${type}`;

export function CompatibilityChecker({
  mode: modeParam,
  type,
}: {
  mode?: string;
  type?: string;
}) {
  // Anything unknown in the URL falls back to the defaults
  const mode: Mode = modeParam === "give" ? "give" : "need";
  const selected = type && ALL.includes(type) ? type : "A_POSITIVE";

  const matches =
    mode === "need"
      ? DONORS_FOR[selected]
      : ALL.filter((recipient) => DONORS_FOR[recipient].includes(selected));

  const mine = label(selected);
  const universal =
    mode === "need" && selected === "AB_POSITIVE"
      ? "AB+ is the universal recipient: every blood type can donate to you."
      : mode === "give" && selected === "O_NEGATIVE"
        ? "O− is the universal donor: you can donate to every blood type."
        : null;

  return (
    <section className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
        <p className="text-sm font-medium tracking-wider text-primary uppercase">
          Compatibility
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Who can give to{" "}
          <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
            whom?
          </span>
        </h2>
        <p className="text-muted-foreground">
          Pick a blood type and see the matches. This is the same rule RedAid
          uses when it alerts donors.
        </p>
      </div>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-64 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative space-y-8">
          {/* mode toggle */}
          <nav
            aria-label="Mode"
            className="mx-auto grid w-full max-w-xs grid-cols-2 rounded-lg border bg-muted/50 p-1"
          >
            {MODES.map((m) => (
              <Link
                key={m.value}
                href={href(m.value, selected)}
                scroll={false}
                replace
                aria-current={mode === m.value ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all",
                  mode === m.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.title}
              </Link>
            ))}
          </nav>

          {/* my blood type */}
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              {mode === "need" ? "Blood type needed" : "Your blood type"}
            </p>
            <nav
              aria-label="Blood type"
              className="grid grid-cols-4 gap-2 sm:gap-3"
            >
              {BLOOD_TYPE_OPTIONS.map((option) => {
                const active = selected === option.value;
                return (
                  <Link
                    key={option.value}
                    href={href(mode, option.value)}
                    scroll={false}
                    replace
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-xl border text-lg font-bold transition-all duration-200 hover:-translate-y-0.5",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                        : "bg-background hover:border-primary/50 hover:text-primary",
                    )}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* result */}
          <div className="space-y-4 rounded-xl border bg-muted/40 p-4 sm:p-5">
            <p
              key={`${mode}-${selected}`}
              className="text-center text-sm motion-safe:animate-fade-up"
            >
              {mode === "need" ? (
                <>
                  <span className="font-semibold">{mine}</span> can receive
                  blood from{" "}
                  <span className="font-semibold text-primary">
                    {matches.length} type{matches.length === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{mine}</span> donors can give
                  to{" "}
                  <span className="font-semibold text-primary">
                    {matches.length} type{matches.length === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </p>

            <ul className="grid grid-cols-4 gap-2 sm:gap-3">
              {ALL.map((t) => {
                const on = matches.includes(t);
                return (
                  <li
                    key={t}
                    className={cn(
                      "relative flex h-12 items-center justify-center rounded-xl border text-base font-bold transition-all duration-300",
                      on
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                        : "border-dashed text-muted-foreground/40",
                    )}
                  >
                    {label(t)}
                    {on && (
                      <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {universal && (
              <p className="text-center text-xs text-muted-foreground">
                {universal}
              </p>
            )}
          </div>

          {/* next step */}
          <div className="flex justify-center">
            {mode === "need" ? (
              <Button
                render={<Link href="/add-request" />}
                nativeButton={false}
              >
                Request {mine} blood
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                render={
                  <Link href={`/all-requests?bloodType=${matches.join(",")}`} />
                }
                nativeButton={false}
              >
                See who needs your blood
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
