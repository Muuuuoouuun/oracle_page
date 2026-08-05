"use client";

import { useEffect, useRef } from "react";
import { Bell, BellOff, CheckCheck, Trophy, TrendingUp, Clock, MessageCircle, Zap } from "lucide-react";
import { useUser } from "@/lib/context";
import clsx from "clsx";

const TYPE_CONFIG = {
  bet_result: {
    icon: <Trophy className="w-4 h-4" />,
    color: "text-oracle-trending",
    bg: "bg-oracle-trending/15",
    border: "border-oracle-trending/25",
  },
  grade_up: {
    icon: <Zap className="w-4 h-4" />,
    color: "text-oracle-glow",
    bg: "bg-oracle-glow/15",
    border: "border-oracle-glow/25",
  },
  deadline: {
    icon: <Clock className="w-4 h-4" />,
    color: "text-oracle-hot",
    bg: "bg-oracle-hot/15",
    border: "border-oracle-hot/25",
  },
  comment: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
  },
  system: {
    icon: <Bell className="w-4 h-4" />,
    color: "text-slate-400",
    bg: "bg-slate-500/15",
    border: "border-slate-500/25",
  },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

interface Props { onClose: () => void }

export default function NotificationPanel({ onClose }: Props) {
  const { notifications, markNotificationRead, markAllRead } = useUser();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2.5 w-80 max-h-[420px] overflow-y-auto rounded-2xl border border-oracle-border bg-oracle-card shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 animate-scale-in"
    >
      {/* Header */}
      <div className="sticky top-0 bg-oracle-card/95 backdrop-blur-xl border-b border-oracle-border/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-oracle-purple" />
          <span className="text-sm font-bold text-white">알림</span>
          {unread > 0 && (
            <span className="text-[10px] font-black bg-oracle-hot text-white px-1.5 py-0.5 rounded-full shadow-hot-sm">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-oracle-purple transition-colors font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            모두 읽음
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
            <BellOff className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">알림이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-oracle-border/40">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={clsx(
                  "w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all duration-200",
                  n.isRead
                    ? "opacity-50 hover:opacity-70"
                    : "hover:bg-oracle-purple/8 bg-oracle-purple/3"
                )}
              >
                {/* Unread indicator */}
                {!n.isRead && (
                  <span className="w-1.5 h-1.5 rounded-full bg-oracle-purple shrink-0 mt-2" />
                )}

                {/* Type icon */}
                <div
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                    cfg.bg, cfg.color, cfg.border,
                    n.isRead && "ml-3.5"
                  )}
                >
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-600 font-medium">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
