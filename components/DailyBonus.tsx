"use client";

import { useState } from "react";
import { Gift, X, Zap, Calendar } from "lucide-react";
import { useUser } from "@/lib/context";
import { getNextGradeProgress } from "@/lib/grades";
import clsx from "clsx";

interface Props { onClose: () => void }

const BONUS_BY_GRADE: Record<string, number> = {
  magikarp: 30,
  bulbasaur: 50,
  pikachu: 80,
  growlithe: 120,
  mew: 200,
  mewtwo: 300,
  arceus: 500,
};

const STREAK_MULTIPLIERS = [1, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0];

export default function DailyBonus({ onClose }: Props) {
  const { me, adjustPoints } = useUser();
  const { current: grade } = getNextGradeProgress(me.points);

  const streak = 3; // 시뮬레이션: 3일 연속
  const baseBonus = BONUS_BY_GRADE[me.gradeId] ?? 30;
  const multiplier = STREAK_MULTIPLIERS[Math.min(streak - 1, 6)];
  const totalBonus = Math.floor(baseBonus * multiplier);

  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    adjustPoints(totalBonus);
    setClaimed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-3xl bg-oracle-card border border-oracle-border shadow-2xl overflow-hidden">
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-oracle-purple/20 to-transparent pointer-events-none" />

        <div className="relative px-6 py-6 space-y-5 text-center">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-oracle-purple to-oracle-glow flex items-center justify-center shadow-lg shadow-oracle-purple/40">
              <Gift className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-oracle-purple uppercase tracking-wider">일일 출석 보너스</p>
            <h2 className="text-xl font-black text-white">오늘도 오셨군요!</h2>
          </div>

          {/* Streak */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-all",
                  i < streak
                    ? "bg-oracle-purple border-oracle-purple text-white"
                    : i === streak
                    ? "bg-oracle-purple/20 border-oracle-purple/50 text-oracle-purple animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-600"
                )}
              >
                {i < streak ? "✓" : i + 1}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            <span className="text-oracle-trending font-bold">{streak}일</span> 연속 출석 중 ·{" "}
            <span className="text-white font-bold">x{multiplier}</span> 보너스 적용
          </p>

          {/* Bonus amount */}
          <div className="rounded-2xl bg-gradient-to-r from-oracle-purple/20 to-oracle-glow/20 border border-oracle-purple/30 p-4 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{grade.emoji}</span>
              <span className="text-3xl font-black text-white">+{totalBonus.toLocaleString()}P</span>
            </div>
            <p className="text-xs text-slate-400">
              {grade.name} 기본 {baseBonus}P × {multiplier} 연속 보너스
            </p>
          </div>

          {/* Claim button */}
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-black text-base hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> 보너스 받기!
            </button>
          ) : (
            <div className="space-y-2">
              <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                ✓ +{totalBonus.toLocaleString()}P 획득 완료!
              </div>
              <p className="text-xs text-slate-500">현재 포인트: {(me.points + totalBonus).toLocaleString()}P</p>
            </div>
          )}

          {/* Next reward hint */}
          {!claimed && (
            <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              내일 출석하면 x{STREAK_MULTIPLIERS[Math.min(streak, 6)]} 보너스!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
