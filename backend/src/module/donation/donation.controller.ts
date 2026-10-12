import type { Request, Response } from "express";
import {
  donationServices,
} from "./donation.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

// Requester confirms that an accepted donor has actually donated
const confirmDonation = asyncHandler(async (req: Request, res: Response) => {
  const result = await donationServices.confirmDonation(
    req.user!.id,
    req.params.matchId as string,
  );

  const response = new ApiResponse(
    200,
    result,
    result.earned.length > 0
      ? "Donation confirmed successfully. The donor unlocked a new badge."
      : "Donation confirmed successfully",
  );

  return response.send(res);
});

const getMyDonations = asyncHandler(async (req: Request, res: Response) => {
  const result = await donationServices.getMyDonations(
    req.user!.id,
    req.query,
  );

  const response = new ApiResponse(
    200,
    result,
    "Donation history retrieved successfully",
  );

  return response.send(res);
});

export const donationControllers = {
  confirmDonation,
  getMyDonations,
};
