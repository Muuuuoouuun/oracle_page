"use client";

import { Flame, Trophy } from "lucide-react";
import { streakBonusRate } from "@/lib/grades";
import clsx from "clsx";

interface Props {
  current: number;
  best: number;
  compact?: boolean;
}

/** 다음 보너스 구간까지 얼마나 남았는지 */
function nextTier(current: number): { at: number; rate: number } | null {
  if (current < 3) return { at: 3, rate: 5 };
  if (current < 5) return { at: 5, rate: 10 };
  if (current < 7) return { at: 7, rate: 15 };
  return null;
}

/**
 * 연승 표시. 3연승부터 배당 보너스가 붙기 때문에
 * "끊기 아까운 숫자"를 눈에 보이게 만드는 것이 목적.
 */
export default function StreakBadge({ current, best, compact = false }: Props) {
  const rate = streakBonusRate(current);
  const next = nextTier(current);
  const active = current >= 3;

  if (compact) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border",
          active
            ? "bg-oracle-hot/15 border-oracle-hot/40 text-oracle-hot"
            : "bg-slate-800 border-slate-700 text-slate-500"
        )}
        title={`현재 ${current}연승 · 최고 ${best}연승`}
      >
        <Flame className="w-3 h-3" />
        {current}연승
      </span>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 space-y-2.5",
        active ? "border-oracle-hot/40 bg-oracle-hot/5" : "border-oracle-border bg-oracle-card"
      )}
    >
      <div className="flex items-center gap-2">
        <Flame className={clsx("w-4 h-4", active ? "text-oracle-hot" : "text-slate-500")} />
        <h3 className="text-sm font-bold text-white">연승 기록</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <Trophy className="w-3.5 h-3.5" /> 최고 {best}연승
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span
          className={clsx(
            "text-4xl font-black leading-none tabular-nums",
            active ? "text-oracle-hot" : "text-slate-400"
          )}
        >
          {current}
        </span>
        <span className="text-sm text-slate-500 pb-1">연승 중</span>
        {rate > 0 && (
          <span className="ml-auto text-sm font-bold text-oracle-trending pb-1">
            배당 +{Math.round(rate * 100)}%
          </span>
        )}
      </div>

      {/* 다음 보너스 구간까지의 진행도 */}
      {next ? (
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-oracle-hot to-oracle-trending transition-all duration-500"
              style={{ width: `${Math.min(100, (current / next.at) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-bold text-white">{next.at - current}번</span> 더 적중하면 배당 +{next.rate}%
          </p>
        </div>
      ) : (
        <p className="text-xs text-oracle-trending">최고 구간 도달 — 배당 +15% 적용 중 🔥</p>
      )}
    </div>
  );
}
