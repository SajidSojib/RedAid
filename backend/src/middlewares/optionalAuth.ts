import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth as betterAuth } from "../lib/auth";
import { UserStatus } from "../../generated/prisma/enums";
import type { User } from "../../generated/prisma/client";

// Sets req.user when there's a valid session, and never blocks the request
const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const session = await betterAuth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (
      session?.user.emailVerified &&
      session.user.status === UserStatus.ACTIVE
    ) {
      req.user = session.user as User;
    }
  } catch {
    // a broken session is treated as logged out
  }

  next();
};

export default optionalAuth;
