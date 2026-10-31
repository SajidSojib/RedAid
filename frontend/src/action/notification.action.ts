"use server";

import { updateTag } from "next/cache";
import { notificationServices } from "@/service/notification.service";

// refresh() re-renders the uncached server components on the current page,
// so the navbar re-reads the database right after the change.
export const markNotificationRead = async (id: string) => {
  const result = await notificationServices.markAsRead(id);
  if (!result.error) {
    updateTag("notifications");
  }
  return result;
};

export const markAllNotificationsRead = async () => {
  const result = await notificationServices.markAllAsRead();
  if (!result.error) {
    updateTag("notifications");
  }
  return result;
};

export const getUnreadNotificationCount = async (knownCount: number) => {
  const result = await notificationServices.getUnreadCount();

  if (result.data && result.data.unreadCount !== knownCount) {
    updateTag("notifications");
  }

  return result;
};