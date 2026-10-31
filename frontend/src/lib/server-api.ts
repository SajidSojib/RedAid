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
    // GET only. Leave it out for data that must always be fresh.
    cache?: { revalidate: number; tags: string[] };
  } = {},
): Promise<Result<T>> => {
  try {
    const cookieStore = await cookies();
    const method = options.method ?? "GET";
    const hasBody = options.body !== undefined;

    const res = await fetch(`${env.API_URL}${path}`, {
      method,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        cookie: cookieStore.toString(),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      ...(options.cache && method === "GET"
        ? { next: options.cache }
        : { cache: "no-store" }),
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
