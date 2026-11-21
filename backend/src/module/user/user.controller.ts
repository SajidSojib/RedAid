import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { GetUsersFilters, usersServices } from "./user.service";

const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersServices.getUsers(
    req.query as unknown as GetUsersFilters,
  );

  return new ApiResponse(200, result, "Users retrieved successfully").send(res);
});

const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersServices.suspendUser(
    req.user!.id,
    req.params.userId as string,
    req.body?.note,
  );

  return new ApiResponse(200, user, "User suspended successfully").send(res);
});

const reactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersServices.reactivateUser(req.params.userId as string);

  return new ApiResponse(200, user, "User reactivated successfully").send(res);
});

export const usersControllers = { getUsers, suspendUser, reactivateUser };
