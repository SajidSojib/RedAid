import Link from "next/link";
import {
  ArrowRight,
  Award,
  BellRing,
  ClipboardPlus,
  HandHeart,
  HeartHandshake,
  MapPinned,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = { icon: LucideIcon; title: string; text: string };

type Flow = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  steps: Step[];
  cta: { label: string; href: string };
  variant: "default" | "outline";
};

const FLOWS: Flow[] = [
  {
    icon: ClipboardPlus,
    title: "I need blood",
    subtitle: "For a patient, a family member or a friend",
    steps: [
      {
        icon: ClipboardPlus,
        title: "Post a request",
        text: "Choose the blood type, how many bags (up to 15), the hospital and the area. It takes about a minute.",
      },
      {
        icon: BellRing,
        title: "Matching donors are alerted",
        text: "Every eligible donor with a compatible blood type in your union is notified. If nobody is there, we widen it to the whole upazila.",
      },
      {
        icon: HeartHandshake,
        title: "A donor accepts, you confirm",
        text: "Their contact details unlock once they accept. After they donate, you confirm it and the request closes.",
      },
    ],
    cta: { label: "Request blood", href: "/add-request" },
    variant: "default",
  },
  {
    icon: HandHeart,
    title: "I want to donate",
    subtitle: "Register once, help whenever you are needed",
    steps: [
      {
        icon: UserPlus,
        title: "Sign up as a donor",
        text: "Add your blood type and pick up to 5 areas where you can donate, down to the union.",
      },
      {
        icon: MapPinned,
        title: "Get alerted or browse",
        text: "You are notified when someone near you needs your blood type. You can also tap “I can donate” on any open request.",
      },
      {
        icon: Award,
        title: "Donate and earn recognition",
        text: "Each confirmed donation is one point. Collect badges from Bronze to Platinum, and certificates with a QR code from Silver.",
      },
    ],
    cta: { label: "Become a donor", href: "/signup" },
    variant: "outline",
  },
];

function FlowCard({ flow }: { flow: Flow }) {
  const Icon = flow.icon;

  return (
    <Card className="group/card relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 size-56 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover/card:opacity-100 sm:opacity-60"
      />

      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Icon className="size-5" />
          </span>
          <div>
            <CardTitle className="text-lg">{flow.title}</CardTitle>
            <CardDescription>{flow.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-8">
        <ol>
          {flow.steps.map((step, i) => {
            const StepIcon = step.icon;
            const last = i === flow.steps.length - 1;

            return (
              <li key={step.title} className="group flex gap-4">
                {/* number + connecting line */}
                <div className="flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-semibold tabular-nums transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/30">
                    {i + 1}
                  </span>
                  {!last && (
                    <span
                      aria-hidden
                      className="my-1 w-px flex-1 border-l border-dashed border-primary/30"
                    />
                  )}
                </div>

                <div className={cn("min-w-0 space-y-1 pt-1", !last && "pb-6")}>
                  <h3 className="flex items-center gap-2 font-semibold">
                    {step.title}
                    <StepIcon className="size-4 text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </h3>
                  <p className="text-sm text-pretty text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <Button
          variant={flow.variant}
          className="w-full sm:w-auto"
          render={<Link href={flow.cta.href} />}
          nativeButton={false}
        >
          {flow.cta.label}
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function HowItWorks() {
  return (
    <section className="relative isolate overflow-hidden border-y bg-muted/30">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="text-sm font-medium tracking-wider text-primary uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            From a request to a donor,{" "}
            <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
              in three steps
            </span>
          </h2>
          <p className="text-muted-foreground">
            Whether you are looking for blood or ready to give it, RedAid keeps
            it local and simple.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {FLOWS.map((flow) => (
            <FlowCard key={flow.title} flow={flow} />
          ))}
        </div>
      </div>
    </section>
  );
}
