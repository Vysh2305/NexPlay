import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_COLOR: Record<string, string> = {
  match_scheduled: "text-blue-400",
  match_cancelled: "text-red-400",
  match_updated: "text-amber-400",
  match_completed: "text-emerald-400",
  auction_started: "text-primary",
  auction_closed: "text-secondary",
  bid_placed: "text-primary",
  team_joined: "text-emerald-400",
  general: "text-muted-foreground",
};

function apiRequest(url: string, opts?: RequestInit) {
  const token = localStorage.getItem("league_token");
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const fetchUnread = () => {
    apiRequest("/api/notifications/unread-count")
      .then(r => r.json())
      .then(data => setUnreadCount(data.count ?? 0))
      .catch(() => {});
  };

  const fetchNotifications = () => {
    setLoading(true);
    apiRequest("/api/notifications")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: number) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const deleteNotification = async (id: number) => {
    const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
    await apiRequest(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await apiRequest("/api/notifications/mark-all-read", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
          "hover:bg-white/8 border border-transparent hover:border-white/10",
          open && "bg-white/8 border-white/10"
        )}
        aria-label="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-primary" : "text-muted-foreground"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-primary text-black leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-96 max-h-[520px] flex flex-col rounded-2xl glass border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ background: "rgba(12,12,18,0.97)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={22} className="animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                  <Bell size={22} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-white mb-1">All caught up!</p>
                <p className="text-xs text-muted-foreground">No notifications yet. We'll alert you about matches, auctions, and bids.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative px-4 py-3 flex gap-3 transition-colors cursor-pointer",
                      !n.isRead ? "bg-primary/4 hover:bg-primary/8" : "hover:bg-white/4"
                    )}
                    onClick={() => !n.isRead && markRead(n.id)}
                  >
                    {!n.isRead && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 ml-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-xs font-bold leading-tight", TYPE_COLOR[n.type] ?? "text-white")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead(n.id); }}
                          className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-1 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
