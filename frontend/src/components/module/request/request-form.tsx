"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { Loader, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { TextareaField } from "@/components/common/textareaField"; // adjust to where yours lives
import { BloodTypePicker } from "@/components/common/blood-type-picker";
import { createRequest } from "@/action/request.action";
import type { CreateRequestResult } from "@/service/request.service";
import { cn } from "@/lib/utils";
import {
  MAX_UNITS_PER_REQUEST,
  URGENCY_OPTIONS,
  requestSchema,
  type UrgencyValue,
} from "@/lib/validations/request";
import { AreaSelector, SelectedArea } from "../auth/area-selector";
import { FormSection } from "../auth/form-section";

type Outcome = { result: CreateRequestResult; unionSelected: boolean };

function describeOutcome({ result, unionSelected }: Outcome) {
  const count = result.notifiedDonors;

  if (count === 0) {
    return "No eligible donors were found in this area right now. Donors are only notified when a request is created, so please also contact blood banks nearby.";
  }

  const people = `${count} eligible donor${count === 1 ? "" : "s"}`;

  if (unionSelected && result.searchScope === "UPAZILA") {
    return `Nobody eligible was found in that union, so ${people} across the upazila ${count === 1 ? "was" : "were"} notified.`;
  }

  return `${people} in your area ${count === 1 ? "has" : "have"} been notified.`;
}

export function RequestForm({ ownPhone }: { ownPhone?: string | null }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const form = useForm({
    defaultValues: {
      bloodType: "",
      unitsNeeded: 1,
      urgency: "NORMAL" as UrgencyValue,
      area: null as SelectedArea | null,
      hospitalName: "",
      patientName: "",
      contactPhone: "",
      note: "",
    },
    validators: { onSubmit: requestSchema },
    onSubmit: async ({ value }) => {
      if (!value.area) return;

      const toastId = toast.loading("Sending your request...");

      try {
        const { data, error } = await createRequest({
          bloodType: value.bloodType,
          unitsNeeded: value.unitsNeeded,
          urgency: value.urgency,
          upazilaId: value.area.upazilaId,
          unionId: value.area.unionId,
          hospitalName: value.hospitalName.trim(),
          patientName: value.patientName.trim() || null,
          contactPhone: value.contactPhone.trim() || null,
          note: value.note.trim() || null,
        });
        if (error || !data) {
          toast.error(error?.message ?? "Request failed", { id: toastId });
          return;
        }

        toast.success("Request created", { id: toastId });
        setOutcome({
          result: data,
          unionSelected: value.area.unionId !== null,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";

        toast.error(message, { id: toastId });
      }
    },
  });

  if (outcome) {
    return (
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Request sent
          </h1>
          <p className="text-muted-foreground">{describeOutcome(outcome)}</p>
          {outcome.result.notifiedDonors > 0 && (
            <p className="text-sm text-muted-foreground">
              You will get a notification when a donor accepts.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/all-requests/${outcome.result.request.id}`}
            className={buttonVariants()}
          >
            View request
          </Link>
          <Link
            href="/blood-banks"
            className={buttonVariants({ variant: "outline" })}
          >
            Find blood banks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-9"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FormSection title="What's needed">
        <FieldGroup className="gap-6">
          <form.Field name="bloodType">
            {(field) => (
              <BloodTypePicker field={field} label="Blood type needed" />
            )}
          </form.Field>

          <form.Field name="unitsNeeded">
            {(field) => {
              const units = field.state.value;
              return (
                <Field>
                  <FieldLabel>Blood bags needed</FieldLabel>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Decrease bags"
                      disabled={units <= 1}
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
                      disabled={units >= MAX_UNITS_PER_REQUEST}
                      onClick={() => field.handleChange(units + 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <FieldDescription>
                    One donor gives one bag, so this is also how many donors you
                    need.
                  </FieldDescription>
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="urgency">
            {(field) => (
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
                          "rounded-lg border p-3 text-left transition-all hover:shadow-sm hover:shadow-primary duration-300 ease-in-out hover:-translate-y-0.5 hover:scale-102",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-secondary/30",
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
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Where"
        description="Donors who registered this area, or the whole upazila, are notified."
      >
        <FieldGroup className="gap-5">
          <form.Field name="hospitalName">
            {(field) => (
              <InputField
                field={field}
                label="Hospital or place"
                placeholder="e.g. Rajshahi Medical College Hospital"
              />
            )}
          </form.Field>

          <form.Field name="area">
            {(field) => {
              const invalid = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={invalid}>
                  <AreaSelector
                    mode="single"
                    withUnion
                    wholeLabel="Whole upazila (all unions)"
                    onSelect={(area) => field.handleChange(area)}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </FormSection>

      <FormSection title="Patient and contact">
        <FieldGroup className="gap-5">
          <form.Field name="patientName">
            {(field) => (
              <InputField
                field={field}
                label="Patient name (optional)"
                placeholder="Who needs the blood"
                description="Shown to people browsing requests. Leave empty if you'd rather not share it."
              />
            )}
          </form.Field>

          <form.Field name="contactPhone">
            {(field) => (
              <InputField
                field={field}
                label="Contact number (optional)"
                type="tel"
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
                description={
                  ownPhone
                    ? `Donors see it only after they accept. Leave empty to use ${ownPhone}.`
                    : "Donors see it only after they accept. Leave empty to use your account number."
                }
              />
            )}
          </form.Field>

          <form.Field name="note">
            {(field) => (
              <TextareaField
                field={field}
                label="Note (optional)"
                placeholder="Ward, bed number, anything a donor should know"
                rows={3}
                maxLength={500}
                description="shown on the public list, so don't put phone numbers here"
              />
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader className="animate-spin" />}
            Send request
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
