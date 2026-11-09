import type { Request, Response } from "express";
import { inventoryServices } from "./inventory.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getMyInventory = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryServices.getMyInventory(req.user!.id);

  return new ApiResponse(200, result, "Inventory retrieved successfully").send(
    res,
  );
});

const updateMyInventory = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryServices.updateMyInventory(
    req.user!.id,
    req.body?.items,
  );

  return new ApiResponse(200, result, "Inventory updated successfully").send(
    res,
  );
});

export const inventoryControllers = { getMyInventory, updateMyInventory };
