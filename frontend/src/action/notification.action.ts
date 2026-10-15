"use server";

import { refresh } from "next/cache";
import { notificationServices } from "@/service/notification.service";

// refresh() re-renders the uncached server components on the current page,
// so the navbar re-reads the database right after the change.
export const markNotificationRead = async (id: string) => {
  const result = await notificationServices.markAsRead(id);
  refresh();
  return result;
};

export const markAllNotificationsRead = async () => {
  const result = await notificationServices.markAllAsRead();
  refresh();
  return result;
};

export const getUnreadNotificationCount = async () => {
  return notificationServices.getUnreadCount();
};