"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, Users } from "lucide-react";
import { ME_ID, useUser } from "@/lib/context";
import { useNow } from "@/lib/useNow";
import clsx from "clsx";

function timeAgo(d: Date, now: number) {
  const s = Math.floor((now - d.getTime()) / 1000);
  if (s < 60) return "방금";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  return `${Math.floor(m / 60)}시간 전`;
}

/**
 * 지금 다른 사람들이 뭘 하고 있는지 보여주는 티커.
 * 백엔드가 없어 다른 유저의 활동은 시뮬레이션이지만, 내 배팅은 실제로 여기 올라온다.
 */
export default function ActivityTicker() {
  const { activity, following, isFollowing } = useUser();
  const now = useNow(15_000);
  const [scope, setScope] = useState<"all" | "following">("all");

  const shown =
    scope === "following"
      ? activity.filter((a) => isFollowing(a.userId) || a.userId === ME_ID)
      : activity;

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      <div className="px-4 py-3 border-b border-oracle-border flex items-center gap-2">
        <Radio className="w-4 h-4 text-oracle-hot animate-pulse" />
        <h2 className="text-sm font-bold text-white">실시간 예언 현황</h2>
        <div className="ml-auto flex gap-1">
          {([
            { key: "all", label: "전체" },
            { key: "following", label: `팔로잉 ${following.length}` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setScope(t.key)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-lg border transition-all",
                scope === t.key
                  ? "bg-oracle-purple/20 border-oracle-purple/50 text-oracle-purple"
                  : "border-slate-700 text-slate-500 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-8 text-center space-y-1.5">
          <Users className="w-7 h-7 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-500">
            {scope === "following"
              ? "팔로우한 예언가의 활동이 아직 없어요"
              : "곧 다른 예언가들의 배팅이 올라옵니다"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-oracle-border max-h-64 overflow-y-auto scrollbar-hide">
          {shown.slice(0, 12).map((a) => (
            <Link
              key={a.id}
              href={`/oracle/${a.oracleId}`}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-oracle-purple/5 transition-colors ticker-in"
            >
              <span className="text-base shrink-0">{a.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-snug">
                  <span className={clsx("font-bold", a.userId === ME_ID ? "text-oracle-glow" : "text-white")}>
                    {a.userId === ME_ID ? "나" : a.userName}
                  </span>
                  <span className="text-slate-500">님이 </span>
                  <span className="text-oracle-purple font-medium">{a.optionLabel}</span>
                  <span className="text-slate-500">에 </span>
                  <span className="text-oracle-trending font-bold">{a.amount.toLocaleString()}P</span>
                </p>
                <p className="text-[11px] text-slate-600 line-clamp-1">{a.oracleTitle}</p>
              </div>
              <span className="text-[10px] text-slate-600 shrink-0">
                {now === null ? "" : timeAgo(new Date(a.createdAt), now)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
