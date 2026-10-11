import type { Request, Response } from "express";
import { requestServices } from "./request.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

// Query-string values arrive as strings. The service validates them.
type RequestFilters = Parameters<
  typeof requestServices.getAllDonationRequests
>[0];

const createDonationRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestServices.createDonationRequest(
      req.user!.id,
      req.body,
    );

    const response = new ApiResponse(
      201,
      result,
      result.notifiedDonors > 0
        ? "Donation request created successfully. Matching donors have been notified."
        : "Donation request created successfully. No eligible donors were found yet.",
    );

    return response.send(res);
  },
);

const getDonationRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await requestServices.getDonationRequestById(
      req.params.requestId as string,
      req.user!.id,
    );

    const response = new ApiResponse(
      200,
      request,
      "Donation request retrieved successfully",
    );

    return response.send(res);
  },
);

const getAllDonationRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestServices.getAllDonationRequests(
      req.query as unknown as RequestFilters,
    );

    const response = new ApiResponse(
      200,
      result,
      "Donation requests retrieved successfully",
    );

    return response.send(res);
  },
);

const getMyDonationRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestServices.getMyDonationRequests(
      req.user!.id,
      req.query as unknown as RequestFilters,
    );

    const response = new ApiResponse(
      200,
      result,
      "Your donation requests retrieved successfully",
    );

    return response.send(res);
  },
);

const updateMyDonationRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await requestServices.updateMyDonationRequest(
      req.user!.id,
      req.params.requestId as string,
      req.body,
    );

    const response = new ApiResponse(
      200,
      request,
      "Donation request updated successfully",
    );

    return response.send(res);
  },
);

const cancelMyDonationRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await requestServices.cancelMyDonationRequest(
      req.user!.id,
      req.params.requestId as string,
    );

    const response = new ApiResponse(
      200,
      request,
      "Donation request cancelled successfully",
    );

    return response.send(res);
  },
);

export const requestControllers = {
  createDonationRequest,
  getDonationRequestById,
  getAllDonationRequests,
  getMyDonationRequests,
  updateMyDonationRequest,
  cancelMyDonationRequest,
};
