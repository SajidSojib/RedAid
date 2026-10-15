"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Loader } from "lucide-react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { loginUser } from "@/action/user.action";
import { InputField } from "@/components/common/inputField";
import { toast } from "sonner";


const loginSchema = z.object({
  email: z.email({
    message: "Enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

// Only allow redirects to pages inside this site
const getSafeNext = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export function LoginForm() {
  const router = useRouter();
  const next = getSafeNext(useSearchParams().get("next"));

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },

    onSubmit: async ({ value }) => {
      const toastId = toast.loading("Logging you in...");
      setFormError(null);

      try {
        const { error } = await loginUser(value.email, value.password);

        if (error) {
          const message = error.message || "Login failed";

          setFormError(message);
          toast.error(message, { id: toastId });
          return;
        }

        toast.success("Logged in successfully", {
          id: toastId,
        });

        router.replace(next);
        router.refresh();
      } catch {
        const message = "Something went wrong. Please try again.";

        setFormError(message);
        toast.error(message, { id: toastId });
      }
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Log in to your RedAid account.</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-5">
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

          <form.Field name="password">
            {(field) => (
              <InputField
                field={field}
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((s) => !s)}
              />
            )}
          </form.Field>
        </FieldGroup>

        {formError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader className="animate-spin" />}
              Log in
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
