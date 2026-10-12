import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { donationControllers } from "./donation.controller";

const router = Router();

// Donor: my donation history
router.get("/my", auth(Role.USER), donationControllers.getMyDonations);

// Requester: confirm that an accepted donor has donated
router.patch(
  "/matches/:matchId/confirm",
  auth(Role.USER),
  donationControllers.confirmDonation,
);

export const donationRouter: Router = router;
