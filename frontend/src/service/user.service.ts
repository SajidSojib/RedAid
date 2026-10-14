import { BLOOD_TYPES } from "@/constants/bloodTypes";
import { env } from "@/env";
import { cookies } from "next/headers";
import { success } from "zod";

  
export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  bloodType: typeof BLOOD_TYPES[keyof typeof BLOOD_TYPES];
  phone: string;
  lastDonationDate: string | null;
  serviceAreas: { upazilaId: string; unionId?: string | null }[];
};

export interface RegisterBankOwnerInput {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  bloodType?: typeof BLOOD_TYPES[keyof typeof BLOOD_TYPES];
  phone: string;
  bank: {
    name: string;
    address: string;
    phone: string;
    licenseNumber: string;
    upazilaId: string;
    latitude?: number;
    longitude?: number;
  };
};

const applySetCookies = async (setCookies: string[]) => {
  const cookieStore = await cookies();

  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");
    if (separator < 1) continue;

    const name = pair.slice(0, separator);
    let value = pair.slice(separator + 1);
    try {
      value = decodeURIComponent(value); // Next encodes it again when it sets the cookie
    } catch {}

    const options: {
      path: string;
      maxAge?: number;
      expires?: Date;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
    } = { path: "/" };

    for (const attribute of attributes) {
      const [key, ...rest] = attribute.split("=");
      const attributeValue = rest.join("=");

      switch (key.toLowerCase()) {
        case "max-age":
          options.maxAge = Number(attributeValue);
          break;
        case "expires":
          options.expires = new Date(attributeValue);
          break;
        case "path":
          options.path = attributeValue || "/";
          break;
        case "httponly":
          options.httpOnly = true;
          break;
        case "secure":
          options.secure = true;
          break;
        case "samesite":
          options.sameSite = attributeValue.toLowerCase() as
            | "lax"
            | "strict"
            | "none";
          break;
      }
    }

    cookieStore.set(name, value, options);
  }
};

const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${env.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        data: null,
        error: { message: result.message ?? "Login failed" },
      };
    }

    await applySetCookies(res.headers.getSetCookie());

    return { data: { user: result.data?.user ?? null }, error: null };
  } catch {
    return { data: null, error: { message: "Something went wrong" } };
  }
};

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
    if (!res.ok) {
      return { data: null, error: { message: "Session not found" } };
    }
    if (!session) {
      return { data: null, error: { message: "Session not found" } };
    }
    return { data: session, error: null };
  } catch (error) {
    return { data: null, error: { message: "Something went wrong" } };
  }
};

const registerUser = async (input: RegisterUserInput) => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${env.API_URL}/auth/register/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieStore.toString(),
      },
      body: JSON.stringify(input),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        data: null,
        error: { message: result.message ?? "Registration failed" },
      };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: { message: "Something went wrong" } };
  }
};

const registerBank = async (input: RegisterBankOwnerInput) => {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${env.API_URL}/auth/register/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieStore.toString(),
      },
      body: JSON.stringify(input),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        data: null,
        error: { message: result.message ?? "Registration failed" },
      };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: { message: "Something went wrong" } };
  }
};


export const userServices = {
  getSessionServer,
  registerUser,
  registerBank,
  loginUser,
};


