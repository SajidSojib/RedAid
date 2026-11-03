"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BankSignupForm } from "./bank-signup-form";
import { DonorSignupForm } from "./donor-signup-form";
import { Building2, CheckCircle2, HeartHandshake, LucideIcon } from "lucide-react";

type Role = "donor" | "bank";


const ROLES: {
  value: Role;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "donor",
    icon: HeartHandshake,
    title: "Donor or requester",
    description: "Donate blood, or ask for it when someone needs it.",
  },
  {
    value: "bank",
    icon: Building2,
    title: "Blood bank",
    description: "Manage your stock and respond to requests.",
  },
];

export function SignupView() {
  const [role, setRole] = useState<Role>("donor");
  const [done, setDone] = useState<{ email: string; role: Role } | null>(null);

  if (done) {
    return (
      <div className="space-y-6 pt-8 text-center sm:text-left">
        <div className="relative mx-auto size-16 sm:mx-0">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-emerald-500/30 motion-safe:animate-ping [animation-duration:2.5s]"
          />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-8" strokeWidth={1.6} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{done.email}</span>.
            Open it to activate your account, then log in.
          </p>
        </div>

        {done.role === "bank" && (
          <p className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            Your blood bank is pending review. It becomes visible to requesters
            after an admin verifies your details.
          </p>
        )}

        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create your{" "}
          <span className="bg-linear-to-r from-primary via-destructive to-primary bg-size-[200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient">
            account
          </span>
        </h1>
        <p className="text-muted-foreground">Choose how you will use RedAid.</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Account type"
        className="grid gap-3 sm:grid-cols-2"
      >
        {ROLES.map((item) => {
          const active = role === item.value;
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(item.value)}
              className={cn(
                "group relative flex gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md shadow-primary/10"
                  : "hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-primary",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {item.description}
                </span>
              </span>
              {active && (
                <CheckCircle2 className="absolute top-3 right-3 size-4 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {role === "donor" ? (
        <DonorSignupForm
          onSuccess={(email) => setDone({ email, role: "donor" })}
        />
      ) : (
        <BankSignupForm
          onSuccess={(email) => setDone({ email, role: "bank" })}
        />
      )}
    </div>
  );
}
