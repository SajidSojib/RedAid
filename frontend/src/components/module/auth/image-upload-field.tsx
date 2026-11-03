"use client";

import { useEffect, useRef, useState } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Camera, ImagePlus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { IMAGE_TYPES, getImageError } from "@/lib/upload-image";

export function ImageUploadField({
  field,
  label,
  description = "JPG, PNG or WebP, up to 5 MB.",
}: {
  field: AnyFieldApi;
  label: string;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const file = field.state.value as File | null;
  const invalid = field.state.meta.errors.length > 0;

  const setFile = (next: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = next ? URL.createObjectURL(next) : null;
    previewRef.current = url;
    setPreview(url);
    field.handleChange(next);
  };

  // Free the preview URL when the form unmounts
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  return (
    <Field data-invalid={invalid}>
      <FieldLabel>{label}</FieldLabel>

      <div className="flex items-center gap-5 rounded-xl border border-dashed bg-muted/30 p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={file ? "Change photo" : "Upload photo"}
          className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/50"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected photo preview"
              className="size-full object-cover"
            />
          ) : (
            <User className="size-8 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5 text-background" />
          </span>
        </button>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {file ? "Change photo" : "Upload photo"}
            </Button>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
          </div>
          <FieldDescription>{description}</FieldDescription>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!selected) return;

          const problem = getImageError(selected);
          if (problem) {
            toast.error(problem);
            return;
          }
          setFile(selected);
        }}
      />

      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}