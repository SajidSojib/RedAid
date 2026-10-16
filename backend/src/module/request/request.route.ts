import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { requestControllers } from "./request.controller";
import optionalAuth from "../../middlewares/optionalAuth";

const router = Router();

router.post("/", auth(Role.USER), requestControllers.createDonationRequest);

router.get("/", optionalAuth, requestControllers.getAllDonationRequests);

router.get("/my", auth(Role.USER), requestControllers.getMyDonationRequests);

router.get(
  "/:requestId",
  auth(Role.USER),
  requestControllers.getDonationRequestById,
);

router.patch(
  "/:requestId",
  auth(Role.USER),
  requestControllers.updateMyDonationRequest,
);

router.patch(
  "/:requestId/cancel",
  auth(Role.USER),
  requestControllers.cancelMyDonationRequest,
);

export const requestRouter: Router = router;
