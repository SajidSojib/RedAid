import { Router } from "express";
import auth from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { notificationControllers } from "./notification.controller";

const router = Router();



router.get("/", auth(Role.USER, Role.BANK, Role.ADMIN), notificationControllers.getMyNotifications);
router.get("/unread-count", auth(Role.USER, Role.BANK, Role.ADMIN), notificationControllers.getUnreadCount);
router.patch("/read-all", auth(Role.USER, Role.BANK, Role.ADMIN), notificationControllers.markAllAsRead);
router.patch(
  "/:notificationId/read",
  auth(Role.USER, Role.BANK, Role.ADMIN),
  notificationControllers.markAsRead,
);

export const notificationRouter: Router = router;
