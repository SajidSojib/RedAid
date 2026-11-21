import { request, response, Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { requestControllers } from "./request.controller";
import optionalAuth from "../../middlewares/optionalAuth";
import requireActiveUser from "../../middlewares/requireActiveUser";

const router = Router();

router.post("/", auth(Role.USER), requireActiveUser(), requestControllers.createDonationRequest);

router.get("/", optionalAuth, requestControllers.getAllDonationRequests);

router.get("/my", auth(Role.USER), requestControllers.getMyDonationRequests);

router.get(
  "/my/:requestId",
  auth(Role.USER),
  requestControllers.getMyDonationRequestById,
);

router.patch(
  "/:requestId/complete",
  auth(Role.USER),
  requireActiveUser(),
  requestControllers.completeMyDonationRequest,
);

router.get(
  "/:requestId",
  auth(Role.USER),
  requestControllers.getDonationRequestById,
);

router.patch(
  "/:requestId",
  auth(Role.USER),
  requireActiveUser(),
  requestControllers.updateMyDonationRequest,
);

router.patch(
  "/:requestId/cancel",
  auth(Role.USER),
  requireActiveUser(),
  requestControllers.cancelMyDonationRequest,
);

export const requestRouter: Router = router;
