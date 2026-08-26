"use client";

import { Gift, LifeBuoy, Check } from "lucide-react";
import { useGrades, useUser } from "@/lib/context";
import clsx from "clsx";

/**
 * 일일 보너스와 재기 지원금.
 *
 * 이 앱은 포인트를 얻는 유일한 경로가 적중이라 연패하면 0P에서 끝나버렸다.
 * 매일 올 이유와 복구 수단을 동시에 만드는 자리.
 */
export default function DailyBonusCard() {
  const {
    me, dailyBonusReady, dailyBonusAmount, claimDailyBonus,
    reliefAvailable, claimRelief,
  } = useUser();
  const { gradeByPoints } = useGrades();
  const grade = gradeByPoints(me.points);

  // 받을 것도, 도움이 필요한 것도 없으면 자리를 차지하지 않는다.
  if (!dailyBonusReady && !reliefAvailable) return null;

  return (
    <div className="space-y-2">
      {dailyBonusReady && (
        <button
          onClick={claimDailyBonus}
          className="w-full rounded-2xl border border-oracle-trending/40 bg-gradient-to-r from-oracle-trending/15 to-oracle-glow/10 p-4 flex items-center gap-3 text-left hover:border-oracle-trending/70 active:scale-[0.99] transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-oracle-trending/20 border border-oracle-trending/40 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-oracle-trending" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">오늘의 출석 보너스</p>
            <p className="text-xs text-slate-400">
              {grade.emoji} {grade.name} 등급 · 하루 한 번
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-oracle-trending">
              +{dailyBonusAmount.toLocaleString()}P
            </p>
            <p className="text-[10px] text-slate-500">받기</p>
          </div>
        </button>
      )}

      {reliefAvailable && (
        <button
          onClick={claimRelief}
          className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center gap-3 text-left hover:border-emerald-500/70 active:scale-[0.99] transition-all"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">재기 지원금</p>
            <p className="text-xs text-slate-400">
              포인트가 부족해도 예언은 계속됩니다
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-emerald-400">100P로</p>
            <p className="text-[10px] text-slate-500">채우기</p>
          </div>
        </button>
      )}
    </div>
  );
}

/** 프로필 등에서 "오늘 이미 받음"을 보여줄 때 쓰는 작은 표시 */
export function DailyBonusClaimed({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs text-emerald-400", className)}>
      <Check className="w-3.5 h-3.5" /> 오늘 보너스 수령 완료
    </span>
  );
}
