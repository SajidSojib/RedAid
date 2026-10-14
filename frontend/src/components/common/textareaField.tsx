import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface TextareaFieldProps {
  field: any;
  label: string;
  placeholder?: string;
  icon?: ReactNode;
  rows?: number;
  maxLength?: number;
  description?: string;
  className?: string;
}

export function TextareaField({
  field,
  label,
  placeholder,
  icon,
  rows = 4,
  maxLength,
  description,
  className,
}: TextareaFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label}
        {description && (
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({description})
          </span>
        )}
      </FieldLabel>

      <div className="relative">
        {icon && <div className="absolute left-3 top-3">{icon}</div>}

        <Textarea
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={cn(icon && "pl-10", "resize-none", className)}
        />

        {maxLength && (
          <div className="absolute right-3 bottom-2 text-xs text-muted-foreground">
            {field.state.value?.length || 0}/{maxLength}
          </div>
        )}
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
