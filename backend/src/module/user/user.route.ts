import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { usersControllers } from "./user.controller";

const router = Router();

router.get("/", auth(Role.ADMIN), usersControllers.getUsers);
router.patch(
  "/:userId/suspend",
  auth(Role.ADMIN),
  usersControllers.suspendUser,
);
router.patch(
  "/:userId/reactivate",
  auth(Role.ADMIN),
  usersControllers.reactivateUser,
);

export const usersRouter: Router = router;
