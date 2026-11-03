import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CursorGlow } from "./cursor-glow";
import { HeroOrbit } from "./hero-orbit";

const FACTS = [
  { value: "8", label: "blood types matched" },
  { value: "90 days", label: "safe donation gap" },
  { value: "5", label: "badge levels" },
];

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export function Hero() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden xl:min-h-[calc(100svh-var(--header-height))]">
      {/* background: faded grid + soft glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-10 size-120 -translate-x-1/2 rounded-full bg-primary/22 blur-3xl"
      />
      <CursorGlow />

      <div className="container mx-auto grid flex-1 items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-8 lg:py-28">
        {/* left: copy */}
        <div className="space-y-8">
          <Badge
            variant="outline"
            className="motion-safe:animate-fade-up gap-2 py-1.5 pr-3 pl-2"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Requests are being answered right now
          </Badge>

          <h1
            style={delay(100)}
            className="motion-safe:animate-fade-up text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Blood when it matters, from{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              people close by
            </span>
          </h1>

          <p
            style={delay(200)}
            className="motion-safe:animate-fade-up max-w-xl text-lg text-pretty text-muted-foreground"
          >
            RedAid connects patients with eligible donors in their own union and
            upazila, and with verified blood banks, so help reaches the hospital
            in hours, not days.
          </p>

          <div
            style={delay(300)}
            className="motion-safe:animate-fade-up flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              render={<Link href="/add-request" />}
              nativeButton={false}
            >
              Request blood
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/signup" />}
              nativeButton={false}
            >
              Become a donor
            </Button>
            <Button
              size="lg"
              variant="link"
              render={<Link href="/all-requests" />}
              nativeButton={false}
            >
              Browse requests
            </Button>
          </div>

          <dl
            style={delay(400)}
            className="motion-safe:animate-fade-up grid max-w-md grid-cols-3 gap-6 border-t pt-6"
          >
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-2xl font-semibold tracking-tight">
                  {fact.value}
                </dt>
                <dd className="text-xs text-muted-foreground">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* right: sample request card */}
        <HeroOrbit />
      </div>
    </section>
  );
}
