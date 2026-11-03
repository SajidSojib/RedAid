import { LogoMark } from "@/components/common/logo";
import {
  Award,
  BellRing,
  CalendarCheck,
  Droplet,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  label: string;
  position: string; // where the chip sits inside the square
  delay: number; // float delay in ms, so chips don't move together
};

const FEATURES: Feature[] = [
  {
    icon: MapPin,
    label: "Area-based matching",
    position: "top-[4%] left-0",
    delay: 0,
  },
  {
    icon: BellRing,
    label: "Instant donor alerts",
    position: "top-[20%] right-0",
    delay: 800,
  },
  {
    icon: ShieldCheck,
    label: "Verified blood banks",
    position: "top-[48%] left-[-2%]",
    delay: 1600,
  },
  {
    icon: Award,
    label: "Badges & certificates",
    position: "bottom-[16%] right-[2%]",
    delay: 2400,
  },
  {
    icon: CalendarCheck,
    label: "90-day safe gap",
    position: "bottom-0 left-[18%]",
    delay: 3200,
  },
];

export function HeroOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:ml-auto">
      {/* soft glow behind everything */}
      <div
        aria-hidden
        className="absolute inset-[15%] -z-10 rounded-full bg-linear-to-br from-primary/30 via-transparent to-destructive/20 blur-3xl"
      />

      {/* rings: the outer one rotates slowly */}
      <div
        aria-hidden
        className="absolute inset-[6%] rounded-full border border-dashed border-primary/30 motion-safe:animate-[spin_60s_linear_infinite]"
      >
        <span className="absolute top-1/2 -left-1 size-2 rounded-full bg-primary" />
        <span className="absolute -right-1 bottom-1/3 size-2 rounded-full bg-destructive/70" />
      </div>
      <div
        aria-hidden
        className="absolute inset-[24%] rounded-full border border-primary/20"
      />

      {/* center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping"
        />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30 sm:size-28">
          <LogoMark inverted className="size-14 sm:size-16" />
        </div>
      </div>

      {/* floating features */}
      {FEATURES.map(({ icon: Icon, label, position, delay }) => (
        <div key={label} className={`absolute ${position}`}>
          <div
            style={{ animationDelay: `${delay}ms` }}
            className="flex items-center gap-2 rounded-xl border bg-card/80 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur sm:px-3 sm:py-2 sm:text-sm motion-safe:animate-float"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary sm:size-7">
              <Icon className="size-3.5 sm:size-4" />
            </span>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
