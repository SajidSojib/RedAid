import type { Request, Response } from "express";
import {
  leaderboardServices,
  type GetTopDonorsFilters,
} from "./leaderboard.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getTopDonors = asyncHandler(async (req: Request, res: Response) => {
  const result = await leaderboardServices.getTopDonors(
    req.query as unknown as GetTopDonorsFilters,
  );

  return new ApiResponse(200, result, "Top donors retrieved successfully").send(
    res,
  );
});

export const leaderboardControllers = { getTopDonors };
