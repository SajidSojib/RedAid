"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BankSignupForm } from "./bank-signup-form";
import { DonorSignupForm } from "./donor-signup-form";

type Role = "donor" | "bank";

const ROLES: { value: Role; title: string; description: string }[] = [
  {
    value: "donor",
    title: "Donor or requester",
    description: "Donate blood, or ask for it when someone needs it.",
  },
  {
    value: "bank",
    title: "Blood bank",
    description: "Manage your stock and respond to requests.",
  },
];

export function SignupView() {
  const [role, setRole] = useState<Role>("donor");
  const [done, setDone] = useState<{ email: string; role: Role } | null>(null);

  if (done) {
    return (
      <div className="space-y-6 pt-8">
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
          <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Your blood bank is pending review. It becomes visible to requesters
            after an admin verifies your details.
          </p>
        )}

        <Link href="/login" className={buttonVariants()}>
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          Create your account
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
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(item.value)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50",
              )}
            >
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {item.description}
              </span>
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
