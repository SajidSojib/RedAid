import type { Request, Response } from "express";
import { notificationServices } from "./notification.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";


const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationServices.getMyNotifications(
    req.user!.id,
    req.query,
  );

  const response = new ApiResponse(
    200,
    result,
    "Notifications retrieved successfully",
  );

  return response.send(res);
});

const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationServices.getUnreadCount(req.user!.id);

  const response = new ApiResponse(
    200,
    result,
    "Unread notification count retrieved successfully",
  );

  return response.send(res);
});

const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationServices.markAsRead(
    req.user!.id,
    req.params.notificationId as string,
  );

  const response = new ApiResponse(
    200,
    notification,
    "Notification marked as read",
  );

  return response.send(res);
});

const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationServices.markAllAsRead(req.user!.id);

  const response = new ApiResponse(
    200,
    result,
    "All notifications marked as read",
  );

  return response.send(res);
});

export const notificationControllers = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
