import { Router } from "express";
import optionalAuth from "../../middlewares/optionalAuth";
import { bankControllers } from "./bank.controller";
import { Role } from "../../../generated/prisma/enums";
import auth from "../../middlewares/auth";

const router = Router();

// Public. Admins who are logged in get the full data.
router.get("/", optionalAuth, bankControllers.getBanks);
router.patch(
  "/:bankId/verify",
  auth(Role.ADMIN),
  bankControllers.verifyBank,
);

router.patch(
  "/:bankId/reject",
  auth(Role.ADMIN),
  bankControllers.rejectBank,
);

router.patch("/:bankId/suspend", auth(Role.ADMIN), bankControllers.suspendBank);
router.patch(
  "/:bankId/reinstate",
  auth(Role.ADMIN),
  bankControllers.reinstateBank,
);

export const bankRouter: Router = router;
