"use client";

import Link from "next/link";
import { Timer, ChevronRight } from "lucide-react";
import type { Oracle } from "@/lib/types";
import { useUser } from "@/lib/context";
import { useNow } from "@/lib/useNow";
import clsx from "clsx";

interface Props {
  oracles: Oracle[];
}

/** 마감까지 남은 시간을 초 단위까지 보여준다. */
function countdown(ms: number): string {
  if (ms <= 0) return "정산 중";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 ${s % 60}초`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 ${m % 60}분`;
  return `${Math.floor(h / 24)}일`;
}

/** 곧 마감되는 예언 — 앉은 자리에서 결과를 볼 수 있는 것들을 앞에 세운다. */
export default function ClosingSoonStrip({ oracles }: Props) {
  const { myBets } = useUser();
  // 초 단위 카운트다운 — 마운트 이후에만 돈다
  const now = useNow(1000);

  const soon = oracles
    .filter((o) => o.status === "live")
    .map((o) => ({ oracle: o, endsAt: new Date(o.endsAt).getTime() }))
    .filter(({ endsAt }) => now !== null && endsAt - now < 2 * 60 * 60 * 1000)
    .sort((a, b) => a.endsAt - b.endsAt)
    .slice(0, 5);

  if (soon.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-oracle-hot" />
        <h2 className="text-sm font-bold text-white">곧 결과가 나옵니다</h2>
        <span className="text-xs text-slate-500">2시간 이내 마감</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {soon.map(({ oracle, endsAt }) => {
          const left = endsAt - (now ?? 0);
          const urgent = left < 10 * 60 * 1000;
          const mine = myBets.find((b) => b.oracleId === oracle.id);

          return (
            <Link
              key={oracle.id}
              href={`/oracle/${oracle.id}`}
              className={clsx(
                "snap-start shrink-0 w-56 rounded-xl border p-3 space-y-2 transition-colors",
                urgent
                  ? "border-oracle-hot/50 bg-oracle-hot/5 hover:border-oracle-hot"
                  : "border-oracle-border bg-oracle-card hover:border-oracle-purple/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "text-xs font-black tabular-nums",
                    urgent ? "text-oracle-hot" : "text-oracle-trending"
                  )}
                >
                  {now === null ? "—" : countdown(left)}
                </span>
                {mine && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    참여함
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                {oracle.title}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{oracle.totalParticipants.toLocaleString()}명</span>
                <span className="flex items-center gap-0.5 text-oracle-purple">
                  {mine ? "결과 보기" : "참여하기"} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
