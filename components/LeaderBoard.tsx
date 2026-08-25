"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { ME_ID, useGrades, useUser } from "@/lib/context";
import GradeBadge from "./GradeBadge";
import clsx from "clsx";

const TOP_N = 5;

export default function LeaderBoard() {
  const { users } = useUser();
  const { gradeByPoints } = useGrades();

  const ranked = [...users]
    .filter((u) => !u.isBanned && u.role !== "admin")
    .sort((a, b) => b.points - a.points);

  const top = ranked.slice(0, TOP_N);
  const myIndex = ranked.findIndex((u) => u.id === ME_ID);
  const me = myIndex >= 0 ? ranked[myIndex] : null;
  // 내가 TOP_N 밖이면 리더보드 하단에 내 순위를 따로 붙인다.
  const showMyRankSeparately = me !== null && myIndex >= TOP_N;

  const medals = ["🥇", "🥈", "🥉"];

  const renderRow = (
    user: (typeof ranked)[number],
    rankIndex: number,
    highlight: boolean
  ) => {
    const grade = gradeByPoints(user.points);
    return (
      <Link
        key={user.id}
        href={`/profile/${user.id}`}
        className={clsx(
          "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-oracle-purple/5",
          highlight && "bg-oracle-purple/10"
        )}
      >
        <span className="text-base w-6 text-center shrink-0">
          {rankIndex < 3 ? (
            medals[rankIndex]
          ) : (
            <span className="text-slate-600 text-sm font-bold">{rankIndex + 1}</span>
          )}
        </span>
        <span className="text-lg">{user.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm text-white font-medium">{user.name}</p>
            {user.id === ME_ID && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-oracle-purple/20 text-oracle-purple border border-oracle-purple/30">
                나
              </span>
            )}
            <GradeBadge gradeId={grade.id} size="xs" isOverride={user.gradeOverride} />
          </div>
          <p className="text-xs text-slate-500">
            {user.accuracy > 0 ? `적중률 ${user.accuracy}%` : "아직 적중 기록 없음"}
          </p>
        </div>
        <span className="text-xs font-bold text-oracle-glow shrink-0">
          {user.points.toLocaleString()}P
        </span>
      </Link>
    );
  };

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      <div className="px-4 py-3 border-b border-oracle-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">예언왕 리더보드</h2>
      </div>
      <div className="divide-y divide-oracle-border">
        {top.map((user, idx) => renderRow(user, idx, user.id === ME_ID))}
      </div>

      {showMyRankSeparately && me && (
        <div className="border-t-2 border-dashed border-oracle-border divide-y divide-oracle-border">
          {renderRow(me, myIndex, true)}
        </div>
      )}
    </div>
  );
}
