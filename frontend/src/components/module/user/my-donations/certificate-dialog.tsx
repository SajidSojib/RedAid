"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Award, Droplet, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

type Props = {
  donorName: string;
  badge: string;
  donations: number;
  awardedAt: string;
  certificateId: string;
  verifyUrl: string;
  demo?: boolean; // for homepage demo, not a real certificate
};

type Tier = {
  word: string; // "Certificate of ___"
  stars: number;
  band: boolean; // engraved crosshatch band in the border
  lines: number; // thin inner border lines
  ink: string;
  accent: string;
  paper: string;
};

// A certificate is paper, so these are fixed colors on purpose (same in dark mode and in print)
const TIERS: Record<string, Tier> = {
  SILVER: {
    word: "Appreciation",
    stars: 1,
    band: false,
    lines: 1,
    ink: "#3f4a56",
    accent: "#8a96a3",
    paper: "#fbfcfd",
  },
  GOLD: {
    word: "Merit",
    stars: 2,
    band: false,
    lines: 2,
    ink: "#6b4c0e",
    accent: "#b8902f",
    paper: "#fffcf2",
  },
  DIAMOND: {
    word: "Distinction",
    stars: 3,
    band: true,
    lines: 1,
    ink: "#0f4c6e",
    accent: "#2f86b3",
    paper: "#f6fbff",
  },
  PLATINUM: {
    word: "Honor",
    stars: 4,
    band: true,
    lines: 2,
    ink: "#3b2f6b",
    accent: "#6f5bb5",
    paper: "#faf8ff",
  },
};

const BRAND = "#8A1C1C";
const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const getTier = (badge: string) => TIERS[badge] ?? TIERS.SILVER;
const cssVars = (t: Tier) =>
  ({
    "--ink": t.ink,
    "--accent": t.accent,
    "--paper": t.paper,
  }) as CSSProperties;

// Scalloped seal edge and ribbon tail shapes
const BURST = `polygon(${Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * 2 * Math.PI;
  const r = i % 2 ? 45 : 50;
  return `${50 + r * Math.cos(a)}% ${50 + r * Math.sin(a)}%`;
}).join(",")})`;
const TAIL = "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)";

const hatch = (color: string) =>
  `repeating-linear-gradient(45deg, ${color} 0 0.07cqw, transparent 0.07cqw 0.45cqw), repeating-linear-gradient(-45deg, ${color} 0 0.07cqw, transparent 0.07cqw 0.45cqw)`;

function Corner({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`absolute size-[6cqw] ${className}`}
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1.2"
    >
      <path d="M2 2H30M2 2V30M7 7H20M7 7V20M2 15C11 15 15 11 15 2" />
      <circle cx="24" cy="24" r="1.6" fill="var(--accent)" stroke="none" />
      <path d="M2 2l3-3 3 3-3 3z" fill="var(--accent)" stroke="none" />
    </svg>
  );
}

function Certificate({
  donorName,
  badge,
  donations,
  awardedAt,
  certificateId,
  verifyUrl,
  demo = false,
}: Props) {
  const tier = getTier(badge);
  const awarded = new Date(awardedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Border geometry, in cqw
  const start = tier.band ? 2.8 : 1.6;
  const inner = start + (tier.lines - 1) * 0.6 + 0.4;

  return (
    <div
      style={cssVars(tier)}
      className="relative isolate aspect-297/210 w-full overflow-hidden bg-(color:--paper) font-serif text-(color:--ink)"
    >
      {/* outer frame */}
      <div
        aria-hidden="true"
        className="absolute inset-[1cqw] border-[0.4cqw] border-(color:--accent)"
      />

      {/* engraved band (Diamond and Platinum) */}
      {tier.band && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-[1.6cqw] opacity-60"
            style={{ backgroundImage: hatch(tier.accent) }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-[2.8cqw] bg-(color:--paper)"
          />
        </>
      )}

      {/* thin inner lines */}
      {Array.from({ length: tier.lines }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="absolute border-[0.1cqw] border-(color:--accent)"
          style={{ inset: `${start + i * 0.6}cqw` }}
        />
      ))}

      {/* corners */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{ inset: `${inner}cqw` }}
      >
        <Corner className="top-0 left-0" />
        <Corner className="top-0 right-0 -scale-x-100" />
        <Corner className="bottom-0 left-0 -scale-y-100" />
        <Corner className="right-0 bottom-0 -scale-100" />
      </div>

      {/* watermark */}
      <Droplet
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 size-[34cqw] -translate-x-1/2 -translate-y-1/2 fill-current text-(color:--accent) opacity-[0.06]"
      />

      {demo && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="-rotate-20 text-[12cqw] font-bold tracking-[0.3em] uppercase opacity-[0.07]">
            Sample
          </span>
        </div>
      )}

      {/* content */}
      <div
        className="absolute flex flex-col items-center justify-between px-[6cqw] text-center"
        style={{ inset: `${inner + 1.4}cqw` }}
      >
        {/* brand */}
        <div className="flex flex-col items-center gap-[0.3cqw]">
          <div className="flex items-center gap-[1cqw]">
            <span className="h-px w-[5cqw] bg-(color:--accent)" />
            <Droplet
              className="size-[2cqw]"
              style={{ color: BRAND, fill: BRAND }}
            />
            <span
              className="text-[2.3cqw] font-bold tracking-[0.15em]"
              style={{ color: BRAND }}
            >
              RedAid
            </span>
            <span className="h-px w-[5cqw] bg-(color:--accent)" />
          </div>
          <p className="text-[0.8cqw] font-medium tracking-[0.35em] uppercase opacity-60">
            Blood Donation Platform
          </p>
        </div>

        {/* title */}
        <div className="flex flex-col items-center">
          <p className="text-[0.95cqw] font-semibold tracking-[0.3em] text-(color:--accent) uppercase">
            {title(badge)} Milestone
          </p>
          <h3 className="text-[4.4cqw] leading-none font-semibold tracking-[0.16em] uppercase">
            Certificate
          </h3>
          <p className="text-[2.6cqw] leading-tight text-(color:--accent) italic">
            of {tier.word}
          </p>
        </div>

        {/* recipient */}
        <div className="flex w-full flex-col items-center gap-[0.6cqw]">
          <p className="text-[1.2cqw] italic opacity-70">
            This certificate is proudly presented to
          </p>
          <div className="w-full max-w-[80%] border-b border-(color:--accent) pb-[0.4cqw]">
            <p className="text-[3.2cqw] leading-tight font-medium break-words italic">
              {donorName}
            </p>
          </div>
          <p className="max-w-[82%] text-[1.15cqw] leading-[1.55] opacity-80">
            in grateful recognition of{" "}
            <strong className="font-semibold">
              {donations} voluntary blood donation{donations === 1 ? "" : "s"}
            </strong>{" "}
            through RedAid, and for reaching the{" "}
            <strong className="font-semibold" style={{ color: BRAND }}>
              {title(badge)}
            </strong>{" "}
            milestone. Your generosity has helped save lives.
          </p>
        </div>

        {/* footer */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[2cqw] text-left">
          <div className="space-y-[0.3cqw]">
            <p
              className="text-[1.9cqw] leading-none italic"
              style={{ color: BRAND }}
            >
              RedAid
            </p>
            <div className="w-[13cqw] border-t border-(color:--accent)" />
            <p className="text-[0.8cqw] tracking-widest uppercase opacity-60">
              Authorized by RedAid
            </p>
            <p className="pt-[0.5cqw] text-[0.9cqw] opacity-70">
              Awarded {awarded}
              <br />
              ID {certificateId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* seal */}
          <div className="relative mb-[1.5cqw] flex size-[10.5cqw] items-center justify-center">
            <span
              className="absolute top-[62%] left-[16%] h-[7cqw] w-[2.8cqw] rotate-[14deg] bg-(color:--accent)"
              style={{ clipPath: TAIL }}
            />
            <span
              className="absolute top-[62%] right-[16%] h-[7cqw] w-[2.8cqw] -rotate-[14deg] bg-(color:--accent) brightness-90"
              style={{ clipPath: TAIL }}
            />
            <div
              className="absolute inset-0"
              style={{
                clipPath: BURST,
                background:
                  "radial-gradient(circle at 35% 30%, var(--accent), var(--ink))",
              }}
            />
            <div className="relative flex size-[8cqw] flex-col items-center justify-center rounded-full border-[0.15cqw] border-white/70 text-white">
              <span className="text-[0.9cqw] leading-none tracking-[0.2em]">
                {"★".repeat(tier.stars)}
              </span>
              <span className="text-[3cqw] leading-none font-bold">
                {donations}
              </span>
              <span className="text-[0.6cqw] tracking-[0.2em] uppercase">
                Donations
              </span>
            </div>
          </div>

          <div className="flex items-end justify-end gap-[1cqw]">
            <p className="max-w-[7cqw] text-right text-[0.85cqw] leading-relaxed opacity-70">
              Scan to verify this certificate
            </p>
            <div className="size-[8.5cqw] shrink-0 border border-(color:--accent) bg-white p-[0.5cqw]">
              <QRCodeSVG
                value={verifyUrl}
                size={128}
                level="M"
                className="block size-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificateDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const {demo} = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          demo ? (
            <button
              type="button"
              className="relative inline-flex cursor-pointer items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
            />
          ) : (
            <Button variant="outline" size="sm" />
          )
        }
      >
        <Award className={demo ? "size-3 text-primary" : "size-4"} />
        {demo ? "View sample" : "Certificate"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {title(props.badge)} certificate{demo && " (sample)"}
          </DialogTitle>
          <DialogDescription>
            {demo
              ? "This is how the certificate looks at this milestone. Yours will carry your own name, date and QR code."
              : "Preview it exactly as it will print. Choose Save as PDF in the print window to keep a digital copy."}
          </DialogDescription>
        </DialogHeader>

        <div className="@container max-h-[65vh] overflow-y-auto rounded-lg border bg-muted/40 p-2 sm:p-4">
          <div className="group relative overflow-hidden shadow-xl ring-1 ring-border">
            <Certificate {...props} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full motion-reduce:hidden"
            />
          </div>
        </div>

        <DialogFooter>
          {demo ? (
            <Button render={<Link href="/all-requests" />} nativeButton={false}>
              Start earning yours
            </Button>
          ) : (
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              Print or save as PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Print version: same component at real A4 size */}
      {open &&
        createPortal(
          <>
            <style>
              {`
                @media print {
                  @page { size: A4 landscape; margin: 0; }
                  html, body { width: 297mm; height: 210mm; margin: 0 !important; padding: 0 !important; }
                  body > *:not(#print-certificate) { display: none !important; }
                  #print-certificate {
                    display: block !important;
                    position: fixed !important;
                    inset: 0 !important;
                    width: 297mm !important;
                    height: 210mm !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
              `}
            </style>
            <div
              id="print-certificate"
              className="@container hidden print:fixed print:inset-0 print:block print:h-[210mm] print:w-[297mm]"
            >
              <Certificate {...props} />
            </div>
          </>,
          document.body,
        )}
    </Dialog>
  );
}
