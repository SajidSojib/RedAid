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
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/service/notification.service";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/action/notification.action";

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
  const router = useRouter();
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
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      if (!res.ok) return;

      const { unreadCount: latest } = (await res.json()) as {
        unreadCount: number;
      };
      if (latest !== countRef.current) router.refresh();
    } catch {
      // offline or backend down, try again on the next tick
    }
  }, [router]);

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
      await markNotificationRead(n.id);
    });
  };

  const markAll = () => {
    startTransition(async () => {
      applyRead({ type: "all" });
      await markAllNotificationsRead();
    });
  };

  const { notifications: items, unreadCount: count } = view;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              count > 0 ? `Notifications, ${count} unread` : "Notifications"
            }
          />
        }
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAll}
            disabled={count === 0}
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            You are all caught up.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "#"}
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.isRead ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-medium leading-snug">
                      {n.title}
                    </span>
                    <span className="line-clamp-2 block text-sm text-muted-foreground">
                      {n.message}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
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
