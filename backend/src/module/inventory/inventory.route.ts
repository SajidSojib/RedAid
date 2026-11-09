import { Router } from "express";
import auth from "../../middlewares/auth";
import { inventoryControllers } from "./inventory.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Bank owner routes
router.get("/my", auth(Role.BANK), inventoryControllers.getMyInventory);
router.patch("/my", auth(Role.BANK), inventoryControllers.updateMyInventory);

export const inventoryRouter: Router = router;
