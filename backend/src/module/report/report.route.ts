import { Router } from "express";
import auth from "../../middlewares/auth";
import requireActiveUser from "../../middlewares/requireActiveUser";
import { reportControllers } from "./report.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Donors, requesters and bank owners
router.get(
  "/eligibility",
  auth(Role.USER, Role.BANK),
  reportControllers.getEligibility,
);
router.post(
  "/",
  auth(Role.USER, Role.BANK),
  requireActiveUser(),
  reportControllers.createReport,
);

// Admin
router.get("/", auth(Role.ADMIN), reportControllers.getReports);
router.patch(
  "/:reportId/dismiss",
  auth(Role.ADMIN),
  reportControllers.dismissReport,
);

export const reportRouter: Router = router;
