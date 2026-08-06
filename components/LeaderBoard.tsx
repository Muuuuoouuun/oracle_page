"use client";

import Link from "next/link";
import { Trophy, TrendingUp } from "lucide-react";
import { MOCK_USERS } from "@/lib/adminData";
import { getGradeByPoints } from "@/lib/grades";
import GradeBadge from "./GradeBadge";
import clsx from "clsx";

const TOP3_STYLES = [
  {
    bg: "bg-gradient-to-r from-yellow-500/10 to-amber-500/5",
    border: "border-yellow-500/30",
    medal: "🥇",
    glow: "shadow-[0_0_12px_rgba(234,179,8,0.2)]",
    rank: "text-yellow-400 text-glow-gold",
  },
  {
    bg: "bg-gradient-to-r from-slate-400/10 to-slate-300/5",
    border: "border-slate-400/25",
    medal: "🥈",
    glow: "shadow-[0_0_8px_rgba(148,163,184,0.15)]",
    rank: "text-slate-300",
  },
  {
    bg: "bg-gradient-to-r from-orange-600/10 to-amber-700/5",
    border: "border-orange-600/25",
    medal: "🥉",
    glow: "shadow-[0_0_8px_rgba(234,88,12,0.15)]",
    rank: "text-orange-400",
  },
];

export default function LeaderBoard() {
  const sorted = [...MOCK_USERS]
    .filter((u) => !u.isBanned && u.role !== "admin")
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      <div className="px-4 py-3.5 border-b border-oracle-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-oracle-trending animate-bounce-soft" />
          <h2 className="text-sm font-bold text-white">예언왕 리더보드</h2>
        </div>
        <span className="text-xs text-slate-500">TOP {sorted.length}</span>
      </div>

      <div className="divide-y divide-oracle-border/40">
        {sorted.map((user, idx) => {
          const grade = getGradeByPoints(user.points);
          const top3 = TOP3_STYLES[idx];
          const isTop3 = idx < 3;

          return (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 transition-all group fade-slide",
                `stagger-${idx + 1}`,
                isTop3
                  ? [top3.bg, "hover:brightness-110", top3.glow]
                  : "hover:bg-oracle-purple/5"
              )}
            >
              {/* Rank */}
              <div className="w-7 text-center shrink-0">
                {isTop3 ? (
                  <span className="text-lg leading-none">{top3.medal}</span>
                ) : (
                  <span className={clsx("text-sm font-black", "text-slate-600")}>{idx + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <span className={clsx("text-xl shrink-0 transition-transform group-hover:scale-110", isTop3 && "drop-shadow-sm")}>
                {user.avatar}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={clsx(
                    "text-sm font-semibold transition-colors group-hover:text-oracle-glow",
                    isTop3 ? "text-white" : "text-slate-200"
                  )}>
                    {user.name}
                  </p>
                  <GradeBadge gradeId={grade.id} size="xs" isOverride={user.gradeOverride} />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-slate-600" />
                  <span className="text-xs text-slate-500">적중률 {user.accuracy}%</span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <span className={clsx(
                  "text-sm font-black",
                  isTop3 ? "text-oracle-glow text-glow" : "text-slate-400"
                )}>
                  {user.points.toLocaleString()}P
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
