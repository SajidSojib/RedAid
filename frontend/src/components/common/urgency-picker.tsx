"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { URGENCY_OPTIONS } from "@/lib/validations/request";

export function UrgencyPicker({ field }: { field: AnyFieldApi }) {
  return (
    <Field>
      <FieldLabel>How urgent is it?</FieldLabel>
      <div
        role="radiogroup"
        aria-label="Urgency"
        className="grid gap-2 sm:grid-cols-3"
      >
        {URGENCY_OPTIONS.map((option) => {
          const active = field.state.value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => field.handleChange(option.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted/50",
              )}
            >
              <span className="block text-sm font-semibold">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}