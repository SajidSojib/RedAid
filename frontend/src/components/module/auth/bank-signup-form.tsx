"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { TextareaField } from "@/components/common/textareaField"; // adjust to where yours lives
import { registerBank } from "@/action/user.action";
import { useImageUpload } from "@/hooks/use-image-upload";
import { bankSignupSchema } from "@/lib/validations/signup";
import { AreaSelector } from "./area-selector";
import { FormSection } from "./form-section";
import { ImageUploadField } from "./image-upload-field";

export function BankSignupForm({
  onSuccess,
}: {
  onSuccess: (email: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const upload = useImageUpload();

  const form = useForm({
    defaultValues: {
      image: null as File | null,
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      bankName: "",
      licenseNumber: "",
      bankPhone: "",
      address: "",
      upazilaId: "",
    },
    validators: { onSubmit: bankSignupSchema },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading(
        value.image
          ? "Uploading your photo..."
          : "Submitting your registration...",
      );

      let imageUrl: string | null = null;
      try {
        imageUrl = await upload(value.image);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Photo upload failed",
          {
            id: toastId,
          },
        );
        return;
      }

      toast.loading("Submitting your registration...", { id: toastId });

      try {
        const { error } = await registerBank({
          name: value.name.trim(),
          email: value.email.trim(),
          phone: value.phone.trim(),
          password: value.password,
          image: imageUrl,
          bank: {
            name: value.bankName.trim(),
            address: value.address.trim(),
            phone: value.bankPhone.trim(),
            licenseNumber: value.licenseNumber.trim(),
            upazilaId: value.upazilaId,
          },
        });

        if (error) {
          toast.error(error.message, { id: toastId });
          return;
        }

        toast.success("Registration submitted", { id: toastId });
        onSuccess(value.email);
      } catch {
        toast.error("Something went wrong. Please try again.", { id: toastId });
      }
    },
  });

  return (
    <form
      className="space-y-9"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FormSection
        title="Account owner"
        description="The person who will manage this blood bank on RedAid."
      >
        <FieldGroup className="gap-5">
          <form.Field name="image">
            {(field) => (
              <ImageUploadField
                field={field}
                label="Profile photo (optional)"
              />
            )}
          </form.Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="name">
              {(field) => (
                <InputField
                  field={field}
                  label="Full name"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              )}
            </form.Field>
            <form.Field name="phone">
              {(field) => (
                <InputField
                  field={field}
                  label="Your mobile number"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="email">
            {(field) => (
              <InputField
                field={field}
                label="Email address"
                type="email"
                placeholder="bank@example.com"
                autoComplete="email"
              />
            )}
          </form.Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="password">
              {(field) => (
                <InputField
                  field={field}
                  label="Password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  description="8+ characters with upper and lower case letters and a symbol."
                  showPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((s) => !s)}
                />
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <InputField
                  field={field}
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              )}
            </form.Field>
          </div>
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Blood bank details"
        description="An admin checks these before your bank appears in search."
      >
        <FieldGroup className="gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field name="bankName">
              {(field) => (
                <InputField
                  field={field}
                  label="Blood bank name"
                  placeholder="e.g. City Hospital Blood Bank"
                />
              )}
            </form.Field>
            <form.Field name="licenseNumber">
              {(field) => (
                <InputField
                  field={field}
                  label="License number"
                  placeholder="Registration / license no."
                />
              )}
            </form.Field>
          </div>

          <form.Field name="bankPhone">
            {(field) => (
              <InputField
                field={field}
                label="Bank contact phone"
                type="tel"
                placeholder="Number requesters can call"
                description="Shown publicly on your bank's page."
              />
            )}
          </form.Field>

          <form.Field name="address">
            {(field) => (
              <TextareaField
                field={field}
                label="Address"
                placeholder="Street, area, landmark"
                rows={2}
                maxLength={200}
              />
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Location"
        description="Choose the upazila your bank is in."
      >
        <form.Field name="upazilaId">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid}>
                <AreaSelector
                  mode="single"
                  onSelect={(area) => field.handleChange(area?.upazilaId ?? "")}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
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
            Register blood bank
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
