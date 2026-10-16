import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import {
  getDashboardHome,
  getPathOwners,
  isKnownRole,
  type UserRole,
} from "@/routes/dashboardRoutes";

type SessionUser = { role?: string | null; status?: string | null };

// Matches both "better-auth.session_token" and the "__Secure-" version used on https
const hasSessionCookie = (request: NextRequest) =>
  request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("session_token"));

const getSessionUser = async (
  request: NextRequest,
): Promise<SessionUser | null> => {
  try {
    const res = await fetch(`${env.API_URL}/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const session = await res.json();
    return session?.user ?? null;
  } catch {
    return null;
  }
};

const toLogin = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const url = new URL("/login", request.url);
  url.searchParams.set("next", `${pathname}${search}`); // the login form sends them back here
  return NextResponse.redirect(url);
};

export async function proxy(request: NextRequest) {
  // No session cookie at all: skip the backend call
  if (!hasSessionCookie(request)) return toLogin(request);

  const user = await getSessionUser(request);

  if (!user || (user.status && user.status !== "ACTIVE")) {
    return toLogin(request);
  }

  const role: UserRole = isKnownRole(user.role) ? user.role : "USER";
  const home = getDashboardHome(role);
  const { pathname } = request.nextUrl;

  // /dashboard on its own forwards to the role's landing page
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Pages nobody lists fall through to a normal 404
  const owners = getPathOwners(pathname);

  if (owners.length > 0 && !owners.includes(role)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
