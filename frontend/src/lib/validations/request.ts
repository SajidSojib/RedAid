import * as z from "zod";
import { BLOOD_TYPE_OPTIONS } from "./signup";

export const MAX_UNITS_PER_REQUEST = 15; // keep in sync with the backend constant

// The hints match the backend expiry times (36h / 72h / 168h)
export const URGENCY_OPTIONS = [
  { value: "NORMAL", label: "Normal", hint: "Open for 7 days" },
  { value: "URGENT", label: "Urgent", hint: "Open for 3 days" },
  { value: "CRITICAL", label: "Critical", hint: "Open for 36 hours" },
] as const;

export type UrgencyValue = (typeof URGENCY_OPTIONS)[number]["value"];

export const requestSchema = z.object({
  bloodType: z
    .string()
    .refine((v) => BLOOD_TYPE_OPTIONS.some((t) => t.value === v), {
      message: "Select the blood type needed",
    }),
  unitsNeeded: z
    .number()
    .int()
    .min(1, { message: "At least 1 bag is needed" })
    .max(MAX_UNITS_PER_REQUEST, {
      message: `You can request up to ${MAX_UNITS_PER_REQUEST} bags`,
    }),
  urgency: z.enum(["NORMAL", "URGENT", "CRITICAL"]),
  area: z
    .object({
      upazilaId: z.string().min(1),
      unionId: z.string().nullable(),
      label: z.string(),
    })
    .nullable()
    .refine((v) => v !== null, { message: "Select where the blood is needed" }),
  hospitalName: z
    .string()
    .trim()
    .min(2, { message: "Enter the hospital or place where blood is needed" })
    .max(150, { message: "Name is too long" }),
  patientName: z.string().trim().max(100, { message: "Name is too long" }),
  contactPhone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^(?:\+?88)?01[3-9]\d{8}$/.test(v), {
      message: "Enter a valid Bangladeshi mobile number",
    }),
  note: z
    .string()
    .trim()
    .max(500, { message: "Note must be at most 500 characters" }),
});
