import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth as betterAuth } from "../lib/auth";
import { ApiError } from "../utils/apiError";
import { Role, UserStatus } from "../../generated/prisma/enums";
import type { User } from "../../generated/prisma/client";

const auth = (...roles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        throw new ApiError(401, "You are not authenticated");
      }
      if (!session.user.emailVerified) {
        throw new ApiError(403, "Please verify your email address");
      }
      if (session.user.status !== UserStatus.ACTIVE) {
        throw new ApiError(403, "This account is not active");
      }
      if (roles.length && !roles.includes(session.user.role as Role)) {
        throw new ApiError(403, "You are not authorized");
      }

      req.user = session.user as User;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
