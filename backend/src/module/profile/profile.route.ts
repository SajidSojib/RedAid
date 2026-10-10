import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { profileControllers } from "./profile.controler";

const router = Router();

router.get(
  "/",
  auth(Role.USER, Role.BANK),
  profileControllers.getMyProfile,
);

router.patch(
  "/",
  auth(Role.USER, Role.BANK),
  profileControllers.updateMyProfile,
);

router.get("/bank", auth(Role.BANK), profileControllers.getMyBank);

router.patch("/bank", auth(Role.BANK), profileControllers.updateMyBank);

export const profileRouter: Router = router;
