import { Router } from "express";
import { leaderboardControllers } from "./leaderboard.controller";

const router = Router();

router.get("/", leaderboardControllers.getTopDonors);

export const leaderboardRouter: Router = router;
