"use client";

import { useState } from "react";
import { Gift, X, Zap, Calendar, Star } from "lucide-react";
import { useUser } from "@/lib/context";
import { getNextGradeProgress } from "@/lib/grades";
import clsx from "clsx";

interface Props { onClose: () => void }

const BONUS_BY_GRADE: Record<string, number> = {
  magikarp: 30, bulbasaur: 50, pikachu: 80, growlithe: 120, mew: 200, mewtwo: 300, arceus: 500,
};

const STREAK_MULTIPLIERS = [1, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0];

const CONFETTI = [
  { emoji: "✨", dx: "-60px", dy: "-70px", delay: "0s" },
  { emoji: "🌟", dx: "60px",  dy: "-70px", delay: "0.05s" },
  { emoji: "🎉", dx: "-80px", dy: "-20px", delay: "0.08s" },
  { emoji: "💫", dx: "80px",  dy: "-20px", delay: "0.1s" },
  { emoji: "⭐", dx: "-50px", dy: "50px",  delay: "0.06s" },
  { emoji: "🎊", dx: "50px",  dy: "50px",  delay: "0.09s" },
  { emoji: "✨", dx: "0px",   dy: "-80px", delay: "0.03s" },
  { emoji: "💥", dx: "0px",   dy: "60px",  delay: "0.07s" },
];

export default function DailyBonus({ onClose }: Props) {
  const { me, adjustPoints } = useUser();
  const { current: grade } = getNextGradeProgress(me.points);

  const streak = 3;
  const baseBonus = BONUS_BY_GRADE[me.gradeId] ?? 30;
  const multiplier = STREAK_MULTIPLIERS[Math.min(streak - 1, 6)];
  const totalBonus = Math.floor(baseBonus * multiplier);

  const [claimed, setClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClaim = () => {
    adjustPoints(totalBonus);
    setClaimed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-3xl bg-oracle-card border border-oracle-border shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up">
        {/* Gradient header */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-oracle-purple/25 via-oracle-glow/10 to-transparent pointer-events-none" />
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-oracle-purple/20 blur-2xl pointer-events-none" />

        <div className="relative px-6 py-6 space-y-5 text-center">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Icon with confetti */}
          <div className="flex justify-center relative">
            {showConfetti && CONFETTI.map((p, i) => (
              <span
                key={i}
                className="confetti-particle text-base"
                style={{
                  "--cdx": p.dx,
                  "--cdy": p.dy,
                  "--crot": "120deg",
                  animationDelay: p.delay,
                } as React.CSSProperties}
              >
                {p.emoji}
              </span>
            ))}
            <div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-oracle-purple to-oracle-glow flex items-center justify-center shadow-oracle-lg animate-float"
              style={{ boxShadow: "0 8px 32px rgba(124, 58, 237, 0.5)" }}
            >
              <Gift className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-black text-oracle-purple uppercase tracking-widest">일일 출석 보너스</p>
            <h2 className="text-xl font-black text-white">오늘도 오셨군요! 🎉</h2>
          </div>

          {/* Streak tracker */}
          <div className="flex items-center justify-center gap-1.5">
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
                {i < streak ? "✓" : <span className="text-[10px]">{i + 1}</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            <span className="text-oracle-trending font-bold">{streak}일</span> 연속 출석 ·{" "}
            <span className="text-white font-bold">×{multiplier}</span> 보너스
          </p>

          {/* Bonus display */}
          <div className="rounded-2xl bg-gradient-to-r from-oracle-purple/20 to-oracle-glow/15 border border-oracle-purple/30 p-4 space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl animate-bounce-soft">{grade.emoji}</span>
              <span className="text-3xl font-black gradient-text">+{totalBonus.toLocaleString()}P</span>
            </div>
            <p className="text-xs text-slate-400">
              {grade.name} 기본 {baseBonus}P × {multiplier} 연속 보너스
            </p>
          </div>

          {/* CTA */}
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 rounded-xl btn-oracle text-white font-black text-base flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <Zap className="w-5 h-5 relative z-10" />
              <span className="relative z-10">보너스 받기!</span>
            </button>
          ) : (
            <div className="space-y-2 animate-scale-in">
              <div className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                +{totalBonus.toLocaleString()}P 획득!
              </div>
              <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                닫기
              </button>
            </div>
          )}

          {/* Next hint */}
          {!claimed && (
            <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              내일 출석 시 ×{STREAK_MULTIPLIERS[Math.min(streak, 6)]} 보너스!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
