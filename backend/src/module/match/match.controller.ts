import type { Request, Response } from "express";
import { GetMyOffersFilters, matchesServices } from "./match.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getMyOffers = asyncHandler(async (req: Request, res: Response) => {
  const result = await matchesServices.getMyOffers(
    req.user!.id,
    req.query as unknown as GetMyOffersFilters,
  );

  return new ApiResponse(
    200,
    result,
    "My donation offers retrieved successfully",
  ).send(res);
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


const volunteerForRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const match = await matchesServices.volunteerForRequest(
      req.user!.id,
      req.params.requestId as string,
    );

    const response = new ApiResponse(
      200,
      match,
      "You accepted this request. The requester has been notified.",
    );

    return response.send(res);
  },
);

const withdrawOffer = asyncHandler(async (req: Request, res: Response) => {
  const match = await matchesServices.withdrawOffer(
    req.user!.id,
    req.params.matchId as string,
  );

  return new ApiResponse(200, match, "You withdrew from this request").send(
    res,
  );
});

export const matchesControllers = {
  getMyOffers,
  acceptOffer,
  declineOffer,
  cancelNoShow,
  volunteerForRequest,
  withdrawOffer,
};
