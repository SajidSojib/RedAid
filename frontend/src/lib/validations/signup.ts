import * as z from "zod";
import { getImageError } from "../upload-image";

// Positive on the top row, negative on the bottom row (shown in a 4-column grid)
export const BLOOD_TYPE_OPTIONS = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_NEGATIVE", label: "O-" },
] as const;

export const MAX_SERVICE_AREAS = 5;

const accountFields = {
  image: z
    .custom<File | null>()
    .refine((file) => !file || getImageError(file) === null, {
      message: "Use a JPG, PNG or WebP image up to 5 MB",
    }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Enter your full name" })
    .max(80, { message: "Name is too long" }),
  email: z.email({ message: "Enter a valid email address" }),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?88)?01[3-9]\d{8}$/, {
      message: "Enter a valid Bangladeshi mobile number",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password is too long" })
    .regex(/[A-Z]/, { message: "Include at least one uppercase letter (A-Z)" })
    .regex(/[a-z]/, { message: "Include at least one lowercase letter (a-z)" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Include at least one special character",
    }),
  confirmPassword: z.string().min(1, { message: "Confirm your password" }),
};

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  options: { message: "Passwords don't match", path: ["confirmPassword"] },
};

const serviceAreaSchema = z.object({
  upazilaId: z.string().min(1),
  unionId: z.string().nullable(),
  label: z.string(), // only used to show the chip, never sent to the API
});

export type ServiceAreaValue = z.infer<typeof serviceAreaSchema>;

export const donorSignupSchema = z
  .object({
    ...accountFields,
    bloodType: z
      .string()
      .refine((v) => BLOOD_TYPE_OPTIONS.some((t) => t.value === v), {
        message: "Select your blood type",
      }),
    // Empty means "never donated", which is allowed
    lastDonationDate: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()),
        { message: "Last donation date can't be in the future" },
      ),
    serviceAreas: z
      .array(serviceAreaSchema)
      .min(1, { message: "Add at least one area where you can donate" })
      .max(MAX_SERVICE_AREAS, {
        message: `You can add up to ${MAX_SERVICE_AREAS} areas`,
      }),
  })
  .refine(passwordsMatch.check, passwordsMatch.options);

export const bankSignupSchema = z
  .object({
    ...accountFields,
    bankName: z
      .string()
      .trim()
      .min(2, { message: "Enter the blood bank's name" })
      .max(100, { message: "Name is too long" }),
    licenseNumber: z
      .string()
      .trim()
      .min(3, { message: "Enter the license number" })
      .max(50, { message: "License number is too long" }),
    bankPhone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{5,19}$/, { message: "Enter a valid phone number" }),
    address: z
      .string()
      .trim()
      .min(5, { message: "Enter the full address" })
      .max(200, { message: "Address is too long" }),
    upazilaId: z
      .string()
      .min(1, { message: "Select where the bank is located" }),
  })
  .refine(passwordsMatch.check, passwordsMatch.options);
