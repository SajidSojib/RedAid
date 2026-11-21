import type { Request, Response } from "express";
import { overviewServices } from "./overview.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getBankOverview = asyncHandler(async (req: Request, res: Response) => {
  const result = await overviewServices.getBankOverview(req.user!.id);

  return new ApiResponse(
    200,
    result,
    "Bank overview retrieved successfully",
  ).send(res);
});

const getAdminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const result = await overviewServices.getAdminOverview();

  return new ApiResponse(
    200,
    result,
    "Admin overview retrieved successfully",
  ).send(res);
});

export const overviewControllers = { getBankOverview, getAdminOverview };
