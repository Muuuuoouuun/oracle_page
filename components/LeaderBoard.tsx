"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { MOCK_USERS } from "@/lib/adminData";
import { getGradeByPoints } from "@/lib/grades";
import GradeBadge from "./GradeBadge";
import clsx from "clsx";

export default function LeaderBoard() {
  const sorted = [...MOCK_USERS]
    .filter((u) => !u.isBanned && u.role !== "admin")
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      <div className="px-4 py-3 border-b border-oracle-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">예언왕 리더보드</h2>
      </div>
      <div className="divide-y divide-oracle-border">
        {sorted.map((user, idx) => {
          const grade = getGradeByPoints(user.points);
          return (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-oracle-purple/5 transition-colors group"
            >
              <span className="text-base w-6 text-center shrink-0">
                {idx < 3 ? medals[idx] : <span className="text-slate-600 text-sm font-bold">{idx + 1}</span>}
              </span>
              <span className="text-lg">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm text-white font-medium group-hover:text-oracle-glow transition-colors">{user.name}</p>
                  <GradeBadge gradeId={grade.id} size="xs" isOverride={user.gradeOverride} />
                </div>
                <p className="text-xs text-slate-500">적중률 {user.accuracy}%</p>
              </div>
              <span className="text-xs font-bold text-oracle-glow">{user.points.toLocaleString()}P</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
