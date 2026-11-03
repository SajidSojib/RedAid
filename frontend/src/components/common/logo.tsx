import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const id = useId();

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={cn("size-9", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`${id}-fill`}
          x1="10"
          y1="6"
          x2="38"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            style={{
              stopColor:
                "color-mix(in oklab, var(--primary) 55%, var(--destructive))",
            }}
          />
          <stop offset="1" style={{ stopColor: "var(--primary)" }} />
        </linearGradient>
      </defs>

      {/* drop */}
      <path
        d="M24 3C24 3 8 20 8 30a16 16 0 0 0 32 0C40 20 24 3 24 3Z"
        fill={inverted ? "white" : `url(#${id}-fill)`}
      />

      {/* soft highlight (normal version only) */}
      {!inverted && (
        <path
          d="M14.5 31a9.5 9.5 0 0 1 4.5-8"
          fill="none"
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}

      {/* plus */}
      <g style={{ fill: inverted ? "var(--primary)" : "white" }}>
        <rect x="22" y="24" width="4" height="14" rx="2" />
        <rect x="17" y="29" width="14" height="4" rx="2" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center ", className)}>
      <LogoMark className={markClassName} />
      <span className="text-xl xl:text-2xl leading-none tracking-tight">
        <span className="font-bold text-foreground">Red</span>
        <span className="font-bold text-primary">Aid</span>
      </span>
    </span>
  );
}
