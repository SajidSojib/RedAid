import { Router } from "express";
import auth from "../../middlewares/auth";
import { matchesControllers } from "./match.controller";
import { Role } from "../../../generated/prisma/enums";
import requireActiveUser from "../../middlewares/requireActiveUser";

const router = Router();

// Donor routes
router.get("/my-offers", auth(Role.USER), matchesControllers.getMyOffers);

router.patch(
  "/:matchId/accept",
  auth(Role.USER),
  requireActiveUser(),
  matchesControllers.acceptOffer,
);

router.patch(
  "/:matchId/decline",
  auth(Role.USER),
  requireActiveUser(),
  matchesControllers.declineOffer,
);

router.patch(
  "/:matchId/withdraw",
  auth(Role.USER),
  requireActiveUser(),
  matchesControllers.withdrawOffer,
);

// Requester route: cancel an accepted match if the donor did not show up
router.patch(
  "/:matchId/cancel-no-show",
  auth(Role.USER),
  requireActiveUser(),
  matchesControllers.cancelNoShow,
);

router.post(
  "/requests/:requestId/volunteer",
  auth(Role.USER),
  requireActiveUser(),
  matchesControllers.volunteerForRequest,
);

export const matchesRouter: Router = router;
