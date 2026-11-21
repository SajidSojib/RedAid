import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { VerificationStatus } from "../../generated/prisma/enums";

const requireActiveBank = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const bank = await prisma.bloodBank.findUnique({
        where: { ownerId: req.user!.id },
        select: {
          verificationStatus: true,
          suspensionReason: true,
        },
      });

      if (!bank) {
        throw new ApiError(404, "Blood bank not found");
      }

      if (bank.verificationStatus === VerificationStatus.SUSPENDED) {
        throw new ApiError(
          403,
          `Your bank is suspended${bank.suspensionReason ? `: ${bank.suspensionReason}` : ""}. You can view your data but not change it.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireActiveBank;
