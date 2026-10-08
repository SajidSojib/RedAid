import { env } from "@/env";
import { cookies } from "next/headers";

const getSessionServer = async () => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${env.API_URL}/auth/get-session`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    const session = await res.json();
    if (!session) {
      return { data: null, error: { message: "Session not found" } };
    }
    return { data: session, error: null };
  } catch (error) {
    return { data: null, error: { message: "Something went wrong" } };
  }
};

export const userServices = {
  getSessionServer,
};
