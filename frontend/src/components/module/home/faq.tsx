import Link from "next/link";
import { ArrowRight, CalendarClock, MapPinned, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Every answer comes from your actual rules. If you change a rule in the backend, update it here.
const FAQS = [
  {
    q: "Who can donate through RedAid?",
    a: "Anyone with an account who has a blood type on their profile and is eligible. You are eligible if you have never donated, or your last donation was at least 90 days ago.",
  },
  {
    q: "How often can I donate?",
    a: "Once every 90 days. RedAid tracks this for you: during the rest period you will not be notified, and you cannot accept requests. Your dashboard shows the date you can donate again.",
  },
  {
    q: "How does RedAid decide who gets notified?",
    a: "Matching is by area, not distance. When a request is created, every eligible donor with a compatible blood type who chose that union is notified, along with donors who chose the whole upazila. If nobody eligible is in the union, it widens to the whole upazila.",
  },
  {
    q: "Is my phone number public?",
    a: "No. A requester's contact number is shown to a donor only after that donor accepts the request. Donors' numbers are shown to the requester only while the donor is active on that request.",
  },
  {
    q: "What if I accept and then cannot make it?",
    a: "You can withdraw. The slot opens again and the requester is notified so they can find someone else. Please do it as early as you can. If a donor simply does not show up, the requester can mark them as a no-show.",
  },
  {
    q: "How many areas can I choose, and can I change them?",
    a: "Up to 5 areas, each down to the union. Choosing a whole upazila covers every union in it, so you do not need to add its unions too. You can edit your areas any time from your profile.",
  },
  {
    q: "How do certificates and badges work?",
    a: "Every confirmed donation is one point. Bronze comes at 1 donation, then Silver at 3, Gold at 5, Diamond at 10 and Platinum at 15. From Silver upward you also get a certificate with a QR code, and anyone who scans it can verify it is genuine.",
  },
  {
    q: "Are the blood banks checked?",
    a: "Yes. A blood bank registers first, and it only appears publicly after an admin verifies it. If a bank changes its name, address, license or area, it is reviewed again.",
  },
];

const FACTS = [
  {
    icon: CalendarClock,
    value: "90",
    label: "days between donations",
    delay: 0,
  },
  { icon: MapPinned, value: "5", label: "areas you can serve", delay: 700 },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "verified public blood banks",
    delay: 1400,
  },
];

export function Faq() {
  return (
    <section className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        {/* left: heading + facts (not sticky) */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-wider text-primary uppercase">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Questions people{" "}
              <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
                ask first
              </span>
            </h2>
            <p className="text-muted-foreground">
              Short answers about eligibility, privacy and how matching works.
            </p>
          </div>

          <div className="relative isolate overflow-hidden rounded-2xl border bg-card p-4">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-60 mask-[radial-gradient(ellipse_at_top_right,black,transparent_75%)]"
            />
            <div
              aria-hidden
              className="absolute -top-16 -right-16 -z-10 size-48 rounded-full bg-primary/20 blur-3xl"
            />

            <ul className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {FACTS.map(({ icon: Icon, value, label, delay }) => (
                <li
                  key={label}
                  style={{ animationDelay: `${delay}ms` }}
                  className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 backdrop-blur transition-colors hover:border-primary/30 lg:flex-row lg:items-center lg:gap-4 motion-safe:animate-float"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-xl leading-none font-bold tabular-nums">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="outline"
            render={<Link href="/signup" />}
            nativeButton={false}
          >
            Become a donor
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* right: questions */}
        <Accordion className="flex w-full flex-col gap-3 lg:self-start">
          {FAQS.map((item) => (
            <AccordionItem
              key={item.q}
              value={item.q}
              className="rounded-xl border bg-card px-4 transition-colors duration-200 hover:border-primary/30 data-open:border-primary/40 data-open:shadow-sm data-open:shadow-primary/10"
            >
              <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-pretty text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
