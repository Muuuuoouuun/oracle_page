"use client";

import { Trophy } from "lucide-react";
import { LEADERBOARD } from "@/lib/mockData";
import clsx from "clsx";

export default function LeaderBoard() {
  const medalColors = ["text-oracle-trending", "text-slate-300", "text-amber-600"];

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      <div className="px-4 py-3 border-b border-oracle-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">예언왕 리더보드</h2>
      </div>
      <div className="divide-y divide-oracle-border">
        {LEADERBOARD.map((user) => (
          <div key={user.rank} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={clsx(
                "text-sm font-black w-5 text-center",
                medalColors[user.rank - 1] ?? "text-slate-600"
              )}
            >
              {user.rank <= 3 ? ["🥇","🥈","🥉"][user.rank - 1] : user.rank}
            </span>
            <span className="text-lg">{user.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{user.name}</p>
              <p className="text-xs text-slate-500">적중률 {user.accuracy}%</p>
            </div>
            <span className="text-xs font-bold text-oracle-glow">{user.points.toLocaleString()}P</span>
          </div>
        ))}
      </div>
    </div>
  );
}
