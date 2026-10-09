import type { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth";
import { ApiError } from "../utils/apiError";
import type { Role, User } from "../../generated/prisma/client";

const auth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: req.headers as HeadersInit,
      });

      if (!session) {
        throw new ApiError(401, "You are not Authenticated");
      }
      if (!session.user.emailVerified) {
        throw new ApiError(403, "Please verify your email address");
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
