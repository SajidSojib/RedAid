"use client";

import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { InputField } from "@/components/common/inputField";
import { TextareaField } from "@/components/common/textareaField"; // adjust to where yours lives
import { UnitsStepper } from "@/components/common/units-stepper";
import { UrgencyPicker } from "@/components/common/urgency-picker";
import { updateMyRequest } from "@/action/request.action";
import { bloodLabel } from "@/lib/blood";
import { cn } from "@/lib/utils";
import {
  buildEditRequestSchema,
  type UrgencyValue,
} from "@/lib/validations/request";
import type { MyRequestDetails } from "@/service/request.service";
import { DIALOG_BASE } from "./dialog-params";
import { DialogError, DialogLoading } from "./dialog-states";
import { useRequestDetails } from "./user-request-details";

function EditForm({
  request,
  onDone,
}: {
  request: MyRequestDetails;
  onDone: () => void;
}) {
  const minUnits = Math.max(1, request.unitsAccepted);
  const schema = useMemo(() => buildEditRequestSchema(minUnits), [minUnits]);

  const location = request.union
    ? `${request.union.name}, ${request.upazila.name}`
    : `${request.upazila.name} (whole upazila)`;

  const form = useForm({
    defaultValues: {
      unitsNeeded: request.unitsNeeded,
      urgency: request.urgency as UrgencyValue,
      hospitalName: request.hospitalName ?? "",
      patientName: request.patientName ?? "",
      contactPhone: request.contactPhone ?? "",
      note: request.note ?? "",
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading("Saving changes...");

      try {
        const { error } = await updateMyRequest(request.id, {
          unitsNeeded: value.unitsNeeded,
          urgency: value.urgency,
          hospitalName: value.hospitalName.trim(),
          patientName: value.patientName.trim() || null,
          ...(value.contactPhone.trim() && {
            contactPhone: value.contactPhone.trim(),
          }),
          note: value.note.trim() || null,
        });

        if (error) {
          toast.error(error.message, { id: toastId });
          return;
        }

        toast.success("Request updated", { id: toastId });
        onDone();
      } catch {
        toast.error("Something went wrong. Please try again.", { id: toastId });
      }
    },
  });

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <DialogHeader className="border-b p-4 pr-12 text-left">
        <DialogTitle>Edit request</DialogTitle>
      </DialogHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Blood type:</span>{" "}
            <span className="font-medium">{bloodLabel(request.bloodType)}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">Location:</span>{" "}
            <span className="font-medium">{location}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Donors were already notified for this blood type and place. To
            change them, cancel this request and create a new one.
          </p>
        </div>

        <FieldGroup className="gap-5">
          <form.Field name="unitsNeeded">
            {(field) => (
              <UnitsStepper
                field={field}
                min={minUnits}
                hint={
                  request.unitsAccepted > 0
                    ? `${request.unitsAccepted} donor${request.unitsAccepted === 1 ? " has" : "s have"} already accepted.`
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name="urgency">
            {(field) => <UrgencyPicker field={field} />}
          </form.Field>

          <form.Field name="hospitalName">
            {(field) => (
              <InputField
                field={field}
                label="Hospital or place"
                description="Donors who already accepted are notified if you change this."
              />
            )}
          </form.Field>

          <form.Field name="patientName">
            {(field) => (
              <InputField field={field} label="Patient name (optional)" />
            )}
          </form.Field>

          <form.Field name="contactPhone">
            {(field) => (
              <InputField
                field={field}
                label="Contact number"
                type="tel"
                description="Donors who already accepted are notified if you change this."
              />
            )}
          </form.Field>

          <form.Field name="note">
            {(field) => (
              <TextareaField
                field={field}
                label="Note (optional)"
                rows={3}
                maxLength={500}
                description="shown on the public list, so don't put phone numbers here"
              />
            )}
          </form.Field>
        </FieldGroup>
      </div>

      <DialogFooter className="border-t p-4">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader className="animate-spin" />}
              Save changes
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}

export function EditRequestDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, error, loading } = useRequestDetails(id);

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(DIALOG_BASE, "sm:max-w-lg")}>
        {data ? (
          data.actions.canEdit ? (
            <EditForm key={data.id} request={data} onDone={onClose} />
          ) : (
            <DialogError message="This request is closed, so it can no longer be edited." />
          )
        ) : error ? (
          <DialogError message={error} />
        ) : loading ? (
          <DialogLoading />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
