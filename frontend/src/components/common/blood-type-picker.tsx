"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations/signup";
import { cn } from "@/lib/utils";

export function BloodTypePicker({
  field,
  label = "Blood type",
}: {
  field: AnyFieldApi;
  label?: string;
}) {
  const invalid = field.state.meta.errors.length > 0;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel>{label}</FieldLabel>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-4 gap-2"
      >
        {BLOOD_TYPE_OPTIONS.map((type) => {
          const active = field.state.value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => field.handleChange(type.value)}
              className={cn(
                "h-11 rounded-md border text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted",
              )}
            >
              {type.label}
            </button>
          );
        })}
      </div>
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
