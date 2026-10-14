import { useCallback, useRef } from "react";
import { uploadImage } from "@/lib/upload-image";

export function useImageUpload() {
  const cache = useRef<{ file: File; url: string } | null>(null);

  return useCallback(async (file: File | null) => {
    if (!file) return null;
    if (cache.current?.file === file) return cache.current.url;

    const url = await uploadImage(file);
    cache.current = { file, url };
    return url;
  }, []);
}
