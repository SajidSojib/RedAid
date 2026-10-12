import type { Request, Response } from "express";
import { achievementServices } from "./achievement.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getMyAchievements = asyncHandler(async (req: Request, res: Response) => {
  const result = await achievementServices.getMyAchievements(req.user!.id);

  const response = new ApiResponse(
    200,
    result,
    "Achievements retrieved successfully",
  );

  return response.send(res);
});

const getCertificate = asyncHandler(async (req: Request, res: Response) => {
  const certificate = await achievementServices.getCertificate(
    req.user!.id,
    req.user!.role,
    req.params.achievementId as string,
  );

  const response = new ApiResponse(
    200,
    certificate,
    "Certificate retrieved successfully",
  );

  return response.send(res);
});

// Public: no login needed
const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const result = await achievementServices.verifyCertificate(
    req.params.code as string,
  );

  const response = new ApiResponse(200, result, "Certificate is valid");

  return response.send(res);
});

export const achievementControllers = {
  getMyAchievements,
  getCertificate,
  verifyCertificate,
};
