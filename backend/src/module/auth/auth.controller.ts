import type { Request, Response } from "express";
import { authServices } from "./auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { result, cookies } = await authServices.loginUser(req.body);
  res.setHeader("Set-Cookie", cookies);
  return new ApiResponse(200, result, "Login successful").send(res);
});


const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authServices.registerUser(req.body);

  const response = new ApiResponse(
    201,
    user,
    "User registered successfully. Please verify your email.",
  );

  return response.send(res);
});


const registerBankOwner = asyncHandler(async (req: Request, res: Response) => {
  const user = await authServices.registerBankOwner(req.body);

  const response = new ApiResponse(
    201,
    user,
    "Bank registration submitted successfully. Await admin verification.",
  );

  return response.send(res);
});

export const authControllers = {
  registerUser,
  registerBankOwner,
  loginUser,
};