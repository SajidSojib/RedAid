import type { Request, Response } from "express";
import { bankRequestServices } from "./bank-request.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

// ---------- Requester ----------

const createBankRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await bankRequestServices.createBankRequest(
    req.user!.id,
    req.body,
  );

  return new ApiResponse(201, request, "Request sent to the blood bank").send(
    res,
  );
});

const getMyBankRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await bankRequestServices.getMyBankRequests(
    req.user!.id,
    req.query as unknown as {
      scope?: string;
      page?: number | string;
      limit?: number | string;
    },
  );

  return new ApiResponse(
    200,
    result,
    "My bank requests retrieved successfully",
  ).send(res);
});

const withdrawBankRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await bankRequestServices.withdrawBankRequest(
      req.user!.id,
      req.params.id as string,
    );

    return new ApiResponse(200, request, "Request withdrawn successfully").send(
      res,
    );
  },
);

// ---------- Bank owner ----------

const approveBankRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await bankRequestServices.approveBankRequest(
    req.user!.id,
    req.params.id as string,
  );

  return new ApiResponse(200, request, "Request approved successfully").send(
    res,
  );
});

const rejectBankRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await bankRequestServices.rejectBankRequest(
    req.user!.id,
    req.params.id as string,
  );

  return new ApiResponse(200, request, "Request rejected successfully").send(
    res,
  );
});

const completeBankRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await bankRequestServices.completeBankRequest(
      req.user!.id,
      req.params.id as string,
    );

    return new ApiResponse(200, request, "Request completed successfully").send(
      res,
    );
  },
);

const markBankRequestNoShow = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await bankRequestServices.markBankRequestNoShow(
      req.user!.id,
      req.params.id as string,
    );

    return new ApiResponse(
      200,
      request,
      "Request marked as a no-show successfully",
    ).send(res);
  },
);

const getIncomingBankRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await bankRequestServices.getIncomingBankRequests(
      req.user!.id,
      req.query as unknown as {
        scope?: string;
        page?: number | string;
        limit?: number | string;
      },
    );

    return new ApiResponse(
      200,
      result,
      "Incoming bank requests retrieved successfully",
    ).send(res);
  },
);

export const bankRequestControllers = {
  createBankRequest,
  getMyBankRequests,
  withdrawBankRequest,
  approveBankRequest,
  rejectBankRequest,
  completeBankRequest,
  markBankRequestNoShow,
  getIncomingBankRequests,
};
