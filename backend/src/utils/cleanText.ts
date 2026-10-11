import { ApiError } from "./apiError";

// undefined = not sent, null/"" = clear it, otherwise trimmed text
export const cleanText = (
  value: string | null | undefined,
  label: string,
  max: number,
) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ApiError(400, `${label} must be text`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ApiError(400, `${label} must be at most ${max} characters`);
  }
  return trimmed === "" ? null : trimmed;
};
