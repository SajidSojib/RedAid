"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { registerUser } from "@/action/user.action";
import type { RegisterUserInput } from "@/service/user.service";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import {
  BLOOD_TYPE_OPTIONS,
  MAX_SERVICE_AREAS,
  donorSignupSchema,
  type ServiceAreaValue,
} from "@/lib/validations/signup";
import { AreaSelector } from "./area-selector";
import { FormSection } from "./form-section";
import { ImageUploadField } from "./image-upload-field";

export function DonorSignupForm({
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
      bloodType: "",
      lastDonationDate: "",
      serviceAreas: [] as ServiceAreaValue[],
    },
    validators: { onSubmit: donorSignupSchema },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading(
        value.image ? "Uploading your photo..." : "Creating your account...",
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

      toast.loading("Creating your account...", { id: toastId });

      try {
        const { error } = await registerUser({
          name: value.name.trim(),
          email: value.email.trim(),
          phone: value.phone.trim(),
          password: value.password,
          image: imageUrl,
          bloodType: value.bloodType as RegisterUserInput["bloodType"],
          lastDonationDate: value.lastDonationDate || null,
          serviceAreas: value.serviceAreas.map(({ upazilaId, unionId }) => ({
            upazilaId,
            unionId,
          })),
        });

        if (error) {
          toast.error(error.message, { id: toastId });
          return;
        }

        toast.success("Account created", { id: toastId });
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
      <FormSection title="Account">
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
                  label="Mobile number"
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
                placeholder="you@example.com"
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
        title="Donor details"
        description="Your blood type is used to match you with people who need it."
      >
        <FieldGroup className="gap-5">
          <form.Field name="bloodType">
            {(field) => {
              const invalid = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel>Blood type</FieldLabel>
                  <div
                    role="radiogroup"
                    aria-label="Blood type"
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
            }}
          </form.Field>

          <form.Field name="lastDonationDate">
            {(field) => (
              <InputField
                field={field}
                label="Last donation date (optional)"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                description="Leave empty if you've never donated. We use it to work out when you can donate again."
              />
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>

      <FormSection
        title="Where you can donate"
        description="You'll be notified when someone in these areas needs your blood type."
      >
        <form.Field name="serviceAreas" mode="array">
          {(field) => {
            const areas = field.state.value;
            const full = areas.length >= MAX_SERVICE_AREAS;

            return (
              <div className="space-y-4">
                {areas.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {areas.map((area, index) => (
                      <li
                        key={`${area.upazilaId}-${area.unionId ?? "all"}`}
                        className="flex items-center gap-1 rounded-md border bg-muted/50 py-1 pl-3 pr-1 text-sm"
                      >
                        <span>{area.label}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${area.label}`}
                          onClick={() => field.removeValue(index)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {full ? (
                  <p className="text-sm text-muted-foreground">
                    You have added the maximum of {MAX_SERVICE_AREAS} areas.
                  </p>
                ) : (
                  <AreaSelector
                    mode="add"
                    withUnion
                    onSelect={(area) => {
                      if (!area) return;
                      const exists = areas.some(
                        (a) =>
                          a.upazilaId === area.upazilaId &&
                          a.unionId === area.unionId,
                      );
                      if (exists) {
                        toast.error("You've already added this area");
                        return;
                      }
                      field.pushValue(area);
                    }}
                  />
                )}

                {field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </div>
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
            Create donor account
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
