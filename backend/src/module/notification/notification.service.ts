import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { parsePagination } from "../../utils/parsePagination";

type GetMyNotificationsFilters = {
  page?: number | string;
  limit?: number | string;
  isRead?: boolean | string; // arrives as "true" / "false" from the query string
};

// undefined / "" = no filter, otherwise it must be true or false
const parseIsRead = (value: boolean | string | undefined) => {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  throw new ApiError(400, "isRead must be true or false");
};

const getMyNotifications = async (
  userId: string,
  filters: GetMyNotificationsFilters = {},
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const isRead = parseIsRead(filters.isRead);

  const where = {
    userId,
    ...(isRead !== undefined && { isRead }),
  };

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// For the navbar badge
const getUnreadCount = async (userId: string) => {
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount };
};

const markAsRead = async (userId: string, notificationId: string) => {
  // userId is in the where clause, so nobody can mark someone else's notification
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Notification not found");
  }

  return prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
  });
};

const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
};

export const notificationServices = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
