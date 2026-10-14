import { env } from "@/env";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// Returns an error message, or null if the file is fine
export const getImageError = (file: File): string | null => {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG or WebP image";
  if (file.size > MAX_IMAGE_SIZE) return "Image must be 5 MB or smaller";
  return null;
};

export const uploadImage = async (file: File): Promise<string> => {
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(
    `${env.NEXT_PUBLIC_IMG_UPLOAD_URL}?key=${env.NEXT_PUBLIC_IMGBB_KEY}`,
    { method: "POST", body },
  );

  const result = await res.json().catch(() => null);

  if (!res.ok || !result?.success || !result?.data?.url) {
    throw new Error(
      result?.error?.message ?? "Photo upload failed. Please try again.",
    );
  }

  return result.data.url as string;
};
