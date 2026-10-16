import { BLOOD_TYPE_OPTIONS } from "@/lib/validations/signup";

export const bloodLabel = (value: string) =>
  BLOOD_TYPE_OPTIONS.find((type) => type.value === value)?.label ?? value;
