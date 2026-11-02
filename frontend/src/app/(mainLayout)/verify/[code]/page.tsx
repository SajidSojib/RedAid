import Link from "next/link";
import type { ReactNode } from "react";
import { Medal, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { achievementServices } from "@/service/achivement.service";

export const metadata = { title: "Verify certificate · RedAid" };

const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

// Same colors as the certificate levels, with dark mode handled
const BADGE_CHIP: Record<string, string> = {
  BRONZE:
    "bg-orange-500/10 text-orange-600 ring-orange-500/30 dark:text-orange-400",
  SILVER:
    "bg-slate-500/10 text-slate-600 ring-slate-500/30 dark:text-slate-300",
  GOLD: "bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  DIAMOND: "bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-400",
  PLATINUM:
    "bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-400",
};

const TONES = {
  ok: {
    icon: ShieldCheck,
    text: "text-emerald-600 dark:text-emerald-400",
    soft: "bg-emerald-500/10",
    ping: "bg-emerald-500/30",
    glow: "bg-emerald-500/15",
    card: "border-emerald-500/30",
  },
  bad: {
    icon: ShieldX,
    text: "text-destructive",
    soft: "bg-destructive/10",
    ping: "bg-destructive/25",
    glow: "bg-destructive/10",
    card: "border-destructive/30",
  },
  warn: {
    icon: ShieldAlert,
    text: "text-amber-600 dark:text-amber-400",
    soft: "bg-amber-500/10",
    ping: "bg-amber-500/25",
    glow: "bg-amber-500/10",
    card: "border-amber-500/30",
  },
} as const;

function Shell({
  tone,
  heading,
  text,
  children,
  footer,
}: {
  tone: keyof typeof TONES;
  heading: string;
  text: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const t = TONES[tone];
  const Icon = t.icon;

  return (
    <main className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className={cn(
          "absolute -top-20 left-1/2 -z-10 size-112 -translate-x-1/2 rounded-full blur-3xl",
          t.glow,
        )}
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
        <Card
          className={cn(
            "mx-auto max-w-md shadow-xl motion-safe:animate-fade-up",
            t.card,
          )}
        >
          <CardContent className="space-y-6 pt-2">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 rounded-full motion-safe:animate-ping animation-duration-[2.5s]",
                    t.ping,
                  )}
                />
                <div
                  className={cn(
                    "relative flex size-20 items-center justify-center rounded-full",
                    t.soft,
                    t.text,
                  )}
                >
                  <Icon className="size-9" strokeWidth={1.6} />
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {heading}
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  {text}
                </p>
              </div>
            </div>

            {children}
          </CardContent>

          {footer && (
            <CardFooter className="justify-center border-t">
              {footer}
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  );
}

const HomeButton = (
  <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
    Go to RedAid
  </Button>
);

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { data, error } = await achievementServices.verifyCertificate(code);

  if (!data) {
    const missing = error?.status === 404;

    return (
      <Shell
        tone={missing ? "bad" : "warn"}
        heading={
          missing ? "Certificate not found" : "Couldn't verify right now"
        }
        text={
          missing
            ? "No RedAid certificate matches this code. It may be forged, or the link may be wrong."
            : "Something went wrong on our side. Please try again in a moment."
        }
        footer={HomeButton}
      />
    );
  }

  const awarded = new Date(data.awardedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rows = [
    {
      label: "Donations",
      value: `${data.donations ?? "Multiple"} blood donation${data.donations === 1 ? "" : "s"}`,
    },
    { label: "Awarded on", value: awarded },
    {
      label: "Certificate ID",
      value: code.slice(0, 8).toUpperCase(),
      mono: true,
    },
  ];

  return (
    <Shell
      tone="ok"
      heading="Certificate verified"
      text={`This is a genuine certificate issued by ${data.issuedBy}.`}
      footer={HomeButton}
    >
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/40 p-4 text-center">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">
            Awarded to
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {data.donorName}
          </p>
          {data.badge && (
            <Badge
              variant="outline"
              className={cn(
                "mt-3 gap-1.5 border-transparent ring-1",
                BADGE_CHIP[data.badge],
              )}
            >
              <Medal className="size-3.5" />
              {title(data.badge)} milestone
            </Badge>
          )}
        </div>

        <dl className="text-sm">
          {rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd
                  className={cn(
                    "font-medium",
                    row.mono && "font-mono tracking-wider",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <p className="text-center text-xs text-muted-foreground">
          Check that the name, date and certificate ID match the certificate you
          were shown.
        </p>
      </div>
    </Shell>
  );
}
