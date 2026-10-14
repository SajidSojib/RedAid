import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    FRONTEND_URL: z.url(),
    BACKEND_URL: z.url(),
    API_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_FRONTEND_URL: z.string(),
    NEXT_PUBLIC_BACKEND_URL: z.string(),
    NEXT_PUBLIC_API_URL: z.string(),
    NEXT_PUBLIC_IMGBB_KEY: z.string(),
    NEXT_PUBLIC_IMG_UPLOAD_URL: z.string(),
  },
  runtimeEnv: {
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_IMGBB_KEY: process.env.NEXT_PUBLIC_IMGBB_KEY,
    NEXT_PUBLIC_IMG_UPLOAD_URL: process.env.NEXT_PUBLIC_IMG_UPLOAD_URL,
  },
});
