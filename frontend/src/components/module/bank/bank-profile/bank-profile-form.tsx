"use client";

import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Loader, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { TextareaField } from "@/components/common/textareaField";
import { AreaSelector } from "@/components/module/auth/area-selector";
import { BankProfile } from "@/service/bank.service";
import { updateMyBank } from "@/action/bank.action";

const schema = z.object({
  name: z.string().trim().min(1, "Bank name is required"),
  licenseNumber: z.string().trim().min(1, "License number is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  address: z.string().trim().min(1, "Address is required"),
  upazilaId: z.string().min(1, "Choose an upazila"),
});

export function BankProfileForm({ bank }: { bank: BankProfile }) {
  const form = useForm({
    defaultValues: {
      name: bank.name,
      licenseNumber: bank.licenseNumber,
      phone: bank.phone,
      address: bank.address,
      upazilaId: bank.upazilaId,
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading("Saving your bank...");

      try {
        const { error } = await updateMyBank({
          name: value.name.trim(),
          licenseNumber: value.licenseNumber.trim(),
          phone: value.phone.trim(),
          address: value.address.trim(),
          upazilaId: value.upazilaId,
        });

        if (error) {
          toast.error(error.message, { id: toastId });
          return;
        }

        toast.success("Bank details saved", { id: toastId });
        form.reset(value); // the saved values become the new baseline
      } catch {
        toast.error("Something went wrong. Please try again.", { id: toastId });
      }
    },
  });

  // These are what the admin verified. Changing one sends a verified bank back to review.
  const identityChanged = (v: typeof form.state.values) =>
    v.name.trim() !== bank.name ||
    v.licenseNumber.trim() !== bank.licenseNumber ||
    v.address.trim() !== bank.address ||
    v.upazilaId !== bank.upazilaId;

  const anyChanged = (v: typeof form.state.values) =>
    identityChanged(v) || v.phone.trim() !== bank.phone;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="name">
            {(field) => <InputField field={field} label="Blood bank name" />}
          </form.Field>
          <form.Field name="licenseNumber">
            {(field) => <InputField field={field} label="License number" />}
          </form.Field>
        </div>

        <form.Field name="phone">
          {(field) => (
            <InputField
              field={field}
              label="Bank contact phone"
              type="tel"
              description="Shown publicly on your bank's page."
            />
          )}
        </form.Field>

        <form.Field name="address">
          {(field) => (
            <TextareaField
              field={field}
              label="Address"
              rows={2}
              maxLength={200}
            />
          )}
        </form.Field>

        <form.Field name="upazilaId">
          {(field) => (
            <Field>
              <FieldLabel>Location</FieldLabel>
              <p className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 text-primary" />
                {bank.upazila.name}, {bank.upazila.district.name}
                <span className="text-muted-foreground">(current)</span>
              </p>
              <AreaSelector
                mode="single"
                // clearing the selector goes back to the saved upazila
                onSelect={(area) =>
                  field.handleChange(area?.upazilaId ?? bank.upazilaId)
                }
              />
              <FieldDescription>
                Only change this if your bank moved.
              </FieldDescription>
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <form.Subscribe selector={(s) => s.values}>
        {(values) => {
          const rejected = bank.verificationStatus === "REJECTED";
          const verified = bank.verificationStatus === "VERIFIED";
          const warn =
            (rejected && anyChanged(values)) ||
            (verified && identityChanged(values));

          return warn ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription>
                {rejected
                  ? "Saving sends your bank back to the admin for review."
                  : "Changing the name, license, address or location sends your bank back to review, and it is hidden from requesters until it is verified again."}
              </AlertDescription>
            </Alert>
          ) : null;
        }}
      </form.Subscribe>

      <form.Subscribe selector={(s) => [s.isSubmitting, s.isDirty] as const}>
        {([isSubmitting, isDirty]) => (
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader className="animate-spin" />}
            {bank.verificationStatus === "REJECTED"
              ? "Save and resubmit"
              : "Save changes"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
