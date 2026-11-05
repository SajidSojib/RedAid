import { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { adminServices, bankServices, GetBanksFilters } from "./bank.service";

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

const getBanks = asyncHandler(async (req: Request, res: Response) => {
  const result = await bankServices.getBanks(
    req.query as unknown as GetBanksFilters,
    req.user ? { role: req.user.role ?? null } : undefined,
  );

  return new ApiResponse(
    200,
    result,
    "Blood banks retrieved successfully",
  ).send(res);
});

const verifyBank = asyncHandler(async (req, res) => {
  const bank = await adminServices.verifyBank(req.params.bankId as string);
  new ApiResponse(200, bank, "Blood bank verified").send(res);
});

const rejectBank = asyncHandler(async (req, res) => {
  const bank = await adminServices.rejectBank(
    req.params.bankId as string,
    req.body?.note,
  );
  new ApiResponse(200, bank, "Blood bank rejected").send(res);
});


export const bankControllers = {
  getBanks,
  verifyBank,
  rejectBank,
};