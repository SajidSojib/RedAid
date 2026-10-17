import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationServices } from "@/service/notification.service";
import { NotificationMenu } from "./notification-menu";

// Shown while the notifications load, so the navbar never waits on them
export function NotificationBellFallback() {
  return (
    <Button variant="outline" size="icon-lg" disabled aria-label="Notifications">
      <Bell className="size-4" />
    </Button>
  );
}

export async function NotificationBell() {
  const { data } = await notificationServices.getMyNotifications({ limit: 10 });
  console.log(data)
  return (
    <NotificationMenu
      notifications={data?.notifications ?? []}
      unreadCount={data?.unreadCount ?? 0}
    />
  );
}
