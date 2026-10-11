import { Router } from "express";
import auth from "../../middlewares/auth";
import { matchesControllers } from "./match.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Donor routes
router.get("/my-offers", auth(Role.USER), matchesControllers.getMyOffers);

router.patch(
  "/:matchId/accept",
  auth(Role.USER),
  matchesControllers.acceptOffer,
);

router.patch(
  "/:matchId/decline",
  auth(Role.USER),
  matchesControllers.declineOffer,
);

// Requester route: cancel an accepted match if the donor did not show up
router.patch(
  "/:matchId/cancel-no-show",
  auth(Role.USER),
  matchesControllers.cancelNoShow,
);

export const matchesRouter: Router = router;
