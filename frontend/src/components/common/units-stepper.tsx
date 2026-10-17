"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { MAX_UNITS_PER_REQUEST } from "@/lib/validations/request";

export function UnitsStepper({
  field,
  label = "Blood bags needed",
  min = 1,
  max = MAX_UNITS_PER_REQUEST,
  hint,
}: {
  field: AnyFieldApi;
  label?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  const units = field.state.value as number;
  const invalid = field.state.meta.errors.length > 0;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease bags"
          disabled={units <= min}
          onClick={() => field.handleChange(units - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums">
          {units}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase bags"
          disabled={units >= max}
          onClick={() => field.handleChange(units + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {invalid ? (
        <FieldError errors={field.state.meta.errors} />
      ) : (
        hint && <FieldDescription>{hint}</FieldDescription>
      )}
    </Field>
  );
}
