import { cookies } from "next/headers";
import { env } from "@/env";

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; status?: number } };

export const authedRequest = async <T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<Result<T>> => {
  try {
    const cookieStore = await cookies();
    const hasBody = options.body !== undefined;

    const res = await fetch(`${env.API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        cookie: cookieStore.toString(),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      return {
        data: null,
        error: {
          message: result?.message ?? "Request failed",
          status: res.status,
        },
      };
    }

    return { data: result.data as T, error: null };
  } catch {
    return { data: null, error: { message: "Something went wrong" } };
  }
};
