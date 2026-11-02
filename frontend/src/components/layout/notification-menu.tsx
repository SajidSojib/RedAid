"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type AppNotification } from "@/service/notification.service";
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/action/notification.action";
import { toast } from "sonner";

const POLL_MS = 60_000;

type View = { notifications: AppNotification[]; unreadCount: number };
type ReadAction = { type: "one"; id: string } | { type: "all" };

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = (date.getTime() - Date.now()) / 1000; // negative for the past

  if (Math.abs(seconds) >= 7 * 86_400) return date.toLocaleDateString();

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function NotificationMenu({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  // Updates the screen instantly, then settles to the server values after refresh()
  const [view, applyRead] = useOptimistic<View, ReadAction>(
    { notifications, unreadCount },
    (state, action) => {
      if (action.type === "all") {
        return {
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        };
      }

      const target = state.notifications.find((n) => n.id === action.id);
      if (!target || target.isRead) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    },
  );

  const countRef = useRef(unreadCount);
  useEffect(() => {
    countRef.current = unreadCount;
  }, [unreadCount]);

  // Cheap check of the unread count. The page data is only reloaded when it changed.
  const refreshIfChanged = useCallback(async () => {
    if (document.visibilityState !== "visible") return;

    try {
      const { data, error } = await getUnreadNotificationCount(countRef.current);

      if (error || !data) return;
    } catch {
      // offline or backend down, try again on the next tick
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(refreshIfChanged, POLL_MS);
    document.addEventListener("visibilitychange", refreshIfChanged);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfChanged);
    };
  }, [refreshIfChanged]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void refreshIfChanged(); // get the latest list when the bell is opened
  };

  const openNotification = (n: AppNotification) => {
    setOpen(false);
    if (n.isRead) return;

    startTransition(async () => {
      applyRead({ type: "one", id: n.id });
      const { error } = await markNotificationRead(n.id);
      if (error) toast.error(error.message);
    });
  };

  const markAll = () => {
    startTransition(async () => {
      applyRead({ type: "all" });
      const { error } = await markAllNotificationsRead();
      if (error) toast.error(error.message);
    });
  };

  const { notifications: items, unreadCount: count } = view;

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              className="relative cursor-pointer"
              aria-label={
                count > 0 ? `Notifications, ${count} unread` : "Notifications"
              }
            />
          }
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-96 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">Notifications</h2>
              {count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {count} unread
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="-mr-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAll}
              disabled={count === 0}
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="size-4" />
              </div>
              <p className="text-sm font-semibold">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                Updates about your requests and offers will show up here.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "#"}
                    onClick={() => openNotification(n)}
                    className={cn(
                      "relative flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted/60",
                      !n.isRead &&
                        "bg-primary/5 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary",
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "text-sm leading-snug",
                          n.isRead
                            ? "font-medium text-foreground/80"
                            : "font-semibold",
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">
                      {n.message}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    );
}
