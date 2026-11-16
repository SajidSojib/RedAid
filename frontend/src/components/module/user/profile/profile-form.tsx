"use client";

import { useForm } from "@tanstack/react-form";
import { Loader, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { BloodTypePicker } from "@/components/common/blood-type-picker";
import { ImageUploadField } from "@/components/module/auth/image-upload-field";
import { updateMyProfile } from "@/action/profile.action";
import { useImageUpload } from "@/hooks/use-image-upload";
import { bloodLabel } from "@/lib/blood";
import type { Profile } from "@/service/profile.service";

const schema = z.object({
  image: z.any(),
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  bloodType: z.string(),
  lastDonationDate: z
    .string()
    .refine(
      (v) => !v || new Date(v) <= new Date(),
      "Date can't be in the future",
    ),
});

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

const isEligible = (last: string | null) =>
  !last || Date.now() - new Date(last).getTime() >= 90 * 86_400_000;

export function ProfileForm({ profile }: { profile: Profile }) {
  const upload = useImageUpload();
  // After a confirmed donation the system owns these two fields
  const hasDonated = profile.donationCount > 0;
  const eligible = isEligible(profile?.lastDonationDate);
  const bloodTypeLocked = hasDonated;
  const dateLocked = hasDonated && !eligible;

  const form = useForm({
    defaultValues: {
      image: null as File | null,
      name: profile.name,
      phone: profile.phone,
      bloodType: profile.bloodType ?? "",
      lastDonationDate: profile.lastDonationDate?.slice(0, 10) ?? "",
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading(
        value.image ? "Uploading your photo..." : "Saving your profile...",
      );

      // Only a newly picked photo is uploaded; otherwise the stored image is kept
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

      toast.loading("Saving your profile...", { id: toastId });

      try {
        const { error } = await updateMyProfile({
          name: value.name.trim(),
          phone: value.phone.trim(),
          ...(imageUrl && { image: imageUrl }),
          // locked fields are not sent, so the backend never rejects the save
          ...(!bloodTypeLocked && { bloodType: value.bloodType || undefined }),
          ...(!dateLocked && {
            // after a confirmed donation the date can't be cleared, only moved forward
            lastDonationDate:
              value.lastDonationDate || (hasDonated ? undefined : null),
          }),
        });

        if (error) {
          toast.error(error.message, { id: toastId });
          return;
        }

        toast.success("Profile updated", { id: toastId });
        form.reset({ ...value, image: null }); // the saved values become the new baseline
      } catch {
        toast.error("Something went wrong. Please try again.", { id: toastId });
      }
    },
  });

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
        <div className="flex items-center gap-4">
          <Avatar className="size-16 ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
            <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
            <AvatarFallback className="text-lg">
              {initials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            Current photo. Pick a new one below to replace it.
          </p>
        </div>

        <form.Field name="image">
          {(field) => (
            <ImageUploadField
              field={field}
              label="New profile photo (optional)"
            />
          )}
        </form.Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="name">
            {(field) => <InputField field={field} label="Full name" />}
          </form.Field>
          <form.Field name="phone">
            {(field) => (
              <InputField
                field={field}
                label="Phone number"
                type="tel"
                placeholder="01XXXXXXXXX"
              />
            )}
          </form.Field>
        </div>

        {bloodTypeLocked && dateLocked ? (
          // Locked: your original box
          <div className="grid gap-3 rounded-lg border border-dashed bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Blood type</p>
              <p className="font-semibold">
                {profile.bloodType ? bloodLabel(profile.bloodType) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last donation</p>
              <p className="font-semibold">
                {profile.lastDonationDate
                  ? new Date(profile.lastDonationDate).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : "—"}
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
              <Lock className="size-3" />
              These are managed by RedAid after your first confirmed donation.
              Contact an admin if something is wrong.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 rounded-lg border border-dashed bg-muted/30 p-4 text-sm sm:grid-cols-2">
            {bloodTypeLocked ? (
              <div>
                <p className="text-xs text-muted-foreground">Blood type</p>
                <p className="font-semibold">
                  {profile.bloodType ? bloodLabel(profile.bloodType) : "—"}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3" />
                  Managed by RedAid.
                </p>
              </div>
            ) : (
              <form.Field name="bloodType">
                {(field) => (
                  <BloodTypePicker field={field} label="Blood type" />
                )}
              </form.Field>
            )}

            <form.Field name="lastDonationDate">
              {(field) => (
                <InputField
                  field={field}
                  label="Last donation date (optional)"
                  type="date"
                  min={
                    hasDonated
                      ? profile.lastDonationDate?.slice(0, 10)
                      : undefined
                  }
                  max={new Date().toISOString().slice(0, 10)}
                  description={
                    hasDonated
                      ? "Donated elsewhere since?"
                      : "Leave empty if you have never donated."
                  }
                />
              )}
            </form.Field>
          </div>
        )}
      </FieldGroup>

      <form.Subscribe selector={(s) => [s.isSubmitting, s.isDirty] as const}>
        {([isSubmitting, isDirty]) => (
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader className="animate-spin" />}
            Save changes
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
