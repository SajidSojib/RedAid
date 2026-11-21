import { Router } from "express";
import auth from "../../middlewares/auth";
import { overviewControllers } from "./overview.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/bank", auth(Role.BANK), overviewControllers.getBankOverview);
router.get("/admin", auth(Role.ADMIN), overviewControllers.getAdminOverview);

export const overviewRouter: Router = router;
