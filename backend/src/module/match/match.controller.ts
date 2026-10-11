import type { Request, Response } from "express";

import { matchesServices } from "./match.service";

import { ApiResponse } from "../../utils/apiResponse";

import asyncHandler from "../../utils/asyncHandler";
import { MatchStatus } from "../../../generated/prisma/enums";

const getMyOffers = asyncHandler(async (req: Request, res: Response) => {
  const offers = await matchesServices.getMyOffers(req.user!.id, {
    status: req.query.status as MatchStatus,
  });

  const response = new ApiResponse(
    200,
    offers,
    "My donation offers retrieved successfully",
  );

  return response.send(res);
});

const acceptOffer = asyncHandler(async (req: Request, res: Response) => {
  const match = await matchesServices.acceptOffer(
    req.user!.id,
    req.params.matchId as string,
  );

  const response = new ApiResponse(
    200,
    match,
    "Donation offer accepted successfully",
  );

  return response.send(res);
});

const declineOffer = asyncHandler(async (req: Request, res: Response) => {
  const match = await matchesServices.declineOffer(
    req.user!.id,
    req.params.matchId as string,
  );

  const response = new ApiResponse(
    200,
    match,
    "Donation offer declined successfully",
  );

  return response.send(res);
});

const cancelNoShow = asyncHandler(async (req: Request, res: Response) => {
  const match = await matchesServices.cancelNoShow(
    req.user!.id,
    req.params.matchId as string,
  );

  const response = new ApiResponse(
    200,
    match,
    "No-show donation match cancelled successfully",
  );

  return response.send(res);
});

export const matchesControllers = {
  getMyOffers,
  acceptOffer,
  declineOffer,
  cancelNoShow,
};
