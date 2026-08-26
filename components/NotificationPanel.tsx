"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Trophy, Clock, MessageCircle, Zap } from "lucide-react";
import { useUser } from "@/lib/context";
import { useNow } from "@/lib/useNow";
import clsx from "clsx";

const TYPE_CONFIG = {
  bet_result: { icon: <Trophy className="w-4 h-4" />, color: "text-oracle-trending", bg: "bg-oracle-trending/10" },
  grade_up:   { icon: <Zap className="w-4 h-4" />,    color: "text-oracle-glow",     bg: "bg-oracle-glow/10" },
  deadline:   { icon: <Clock className="w-4 h-4" />,   color: "text-oracle-hot",      bg: "bg-oracle-hot/10" },
  comment:    { icon: <MessageCircle className="w-4 h-4" />, color: "text-blue-400",  bg: "bg-blue-500/10" },
  system:     { icon: <Bell className="w-4 h-4" />,    color: "text-slate-400",       bg: "bg-slate-500/10" },
};

function timeAgo(date: Date, now: number): string {
  const diff = now - date.getTime();
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
  const now = useNow();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
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
      className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-oracle-border bg-oracle-card shadow-2xl shadow-black/50 z-50"
    >
      {/* Header */}
      <div className="sticky top-0 bg-oracle-card/95 backdrop-blur-sm border-b border-oracle-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-oracle-purple" />
          <span className="text-sm font-bold text-white">알림</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold bg-oracle-hot text-white px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> 모두 읽음
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <BellOff className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-500">알림이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-oracle-border">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            const rowClass = clsx(
              "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
              n.isRead ? "opacity-60 hover:opacity-80" : "hover:bg-oracle-purple/5",
              !n.isRead && "bg-oracle-purple/3"
            );

            const inner = (
              <>
                {/* Unread dot */}
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-oracle-purple shrink-0 mt-1.5" />
                )}

                {/* Icon */}
                <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", cfg.bg, cfg.color, n.isRead && "ml-2")}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-slate-600">{now === null ? "" : timeAgo(new Date(n.createdAt), now)}</p>
                </div>
              </>
            );

            // 예언과 연결된 알림은 눌렀을 때 그 예언으로 이동해야 한다.
            return n.oracleId ? (
              <Link
                key={n.id}
                href={`/oracle/${n.oracleId}`}
                onClick={() => {
                  markNotificationRead(n.id);
                  onClose();
                }}
                className={rowClass}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={n.id}
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className={rowClass}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
