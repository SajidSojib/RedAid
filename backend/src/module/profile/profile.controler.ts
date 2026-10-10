import type { Request, Response } from "express";
import { profileServices } from "./profile.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileServices.getMyProfile(req.user!.id);

  const response = new ApiResponse(200, user, "Profile retrieved successfully");

  return response.send(res);
});

const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileServices.updateMyProfile(req.user!.id, req.body);

  const response = new ApiResponse(200, user, "Profile updated successfully");

  return response.send(res);
});

const getMyBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await profileServices.getMyBank(req.user!.id);

  const response = new ApiResponse(
    200,
    bank,
    "Blood bank information retrieved successfully",
  );

  return response.send(res);
});

const updateMyBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await profileServices.updateMyBank(req.user!.id, req.body);

  const response = new ApiResponse(
    200,
    bank,
    "Blood bank information updated successfully",
  );

  return response.send(res);
});

export const profileControllers = {
  getMyProfile,
  updateMyProfile,
  getMyBank,
  updateMyBank,
};
