import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { achievementControllers } from "./achievement.controller";

const router = Router();

// Public: anyone who scans the QR code can verify a certificate (no auth on purpose)
router.get("/verify/:code", achievementControllers.verifyCertificate);

router.get("/my", auth(Role.USER), achievementControllers.getMyAchievements);

// The owner can open their own certificate, and an admin can open any
router.get(
  "/:achievementId/certificate",
  auth(Role.USER, Role.ADMIN),
  achievementControllers.getCertificate,
);

export const achievementRouter: Router = router;
