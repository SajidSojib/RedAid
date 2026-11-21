import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { UserStatus } from "../../generated/prisma/enums";

// Blocks writes while the account is suspended. Reads stay open.
// It reads the database, so a suspension applies immediately
const requireActiveUser = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { status: true, suspensionReason: true },
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(
          403,
          `Your account is suspended${user.suspensionReason ? `: ${user.suspensionReason}` : ""}. You can view your data but not make changes.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireActiveUser;
