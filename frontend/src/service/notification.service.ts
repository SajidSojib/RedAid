import { cookies } from "next/headers";
import { env } from "@/env";
import { authedRequest } from "@/lib/server-api";

export type NotificationType =
  | "NEW_REQUEST"
  | "REQUEST_FILLED"
  | "REQUEST_CANCELLED"
  | "REQUEST_EXPIRED"
  | "REQUEST_UPDATED"
  | "REQUEST_CLOSED"
  | "DONOR_ACCEPTED"
  | "DONATION_CONFIRMED"
  | "ELIGIBLE_AGAIN"
  | "BANK_REQUEST_UPDATE"
  | "BANK_VERIFICATION"
  | "ACHIEVEMENT"
  | "ACCOUNT";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsPayload = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } };

type ListQuery = { page?: number; limit?: number; isRead?: boolean };

// Notifications are personal and change all the time, so nothing here is cached
const request = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<Result<T>> => {
  try {
    const cookieStore = await cookies();

    const res = await fetch(`${env.API_URL}${path}`, {
      ...init,
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      return {
        data: null,
        error: { message: result?.message ?? "Request failed" },
      };
    }

    return { data: result.data as T, error: null };
  } catch {
    return { data: null, error: { message: "Something went wrong" } };
  }
};

const getMyNotifications = (query: ListQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.isRead !== undefined) params.set("isRead", String(query.isRead));

  const qs = params.toString();
  return authedRequest<NotificationsPayload>(
    `/notifications${qs ? `?${qs}` : ""}`,
    { cache: { revalidate: 10, tags: ["notifications"] } },
  );
};

const getUnreadCount = () =>
  authedRequest<{ unreadCount: number }>("/notifications/unread-count");

const markAsRead = (id: string) =>
  authedRequest<AppNotification>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );

const markAllAsRead = () =>
  authedRequest<{ updatedCount: number }>("/notifications/read-all", {
    method: "PATCH",
  });

export const notificationServices = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
