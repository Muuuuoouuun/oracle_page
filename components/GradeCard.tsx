"use client";

import { Grade, GRADES, getNextGradeProgress } from "@/lib/grades";
import clsx from "clsx";
import { Shield, Star, ChevronRight, Trophy, Zap, Flame } from "lucide-react";

interface Props {
  points: number;
  showAll?: boolean;
}

export default function GradeCard({ points, showAll = false }: Props) {
  const { current, next, progress, pointsNeeded } = getNextGradeProgress(points);

  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 space-y-4 relative overflow-hidden",
        current.bgColor,
        current.borderColor
      )}
      style={{ boxShadow: `0 0 28px ${current.glowColor}30, 0 4px 20px rgba(0,0,0,0.3)` }}
    >
      {/* Background decorative glow */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: current.glowColor }}
      />
      <div
        className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
        style={{ background: current.glowColor }}
      />

      {/* Current grade row */}
      <div className="relative flex items-center gap-4">
        {/* Emoji icon with glow ring */}
        <div className="relative shrink-0">
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2",
              current.bgColor, current.borderColor
            )}
            style={{ boxShadow: `0 0 16px ${current.glowColor}60` }}
          >
            {current.emoji}
          </div>
          {/* Animated glow ring */}
          <div
            className="absolute inset-0 rounded-2xl animate-ping-slow opacity-30"
            style={{ boxShadow: `0 0 0 3px ${current.glowColor}` }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("text-xl font-black", current.color)}>{current.name}</span>
            <span className={clsx("text-[11px] font-bold px-2 py-0.5 rounded-full border", current.bgColor, current.color, current.borderColor)}>
              Lv.{current.rank}
            </span>
          </div>
          <p className={clsx("text-sm font-semibold mt-0.5", current.color, "opacity-85")}>{current.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{current.description}</p>
        </div>
      </div>

      {/* Progress to next grade */}
      {next ? (
        <div className="relative space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              다음: <span className="font-bold text-white">{next.emoji} {next.name}</span>
            </span>
            <span className={clsx("font-black text-sm", current.color)}>{progress}%</span>
          </div>
          <div className="h-2.5 bg-slate-900/60 rounded-full overflow-hidden progress-bar">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative progress-reveal"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${current.glowColor}, ${next.glowColor ?? current.glowColor})`,
              }}
            />
          </div>
          <p className="text-xs text-slate-400">
            <span className="font-bold text-white">{pointsNeeded.toLocaleString()}P</span>{" "}
            더 모으면 <span className={clsx("font-semibold", current.color)}>승급!</span>
          </p>
          {progress >= 80 && (
            <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-oracle-hot/10 border border-oracle-hot/25 text-xs font-bold text-oracle-hot w-fit animate-pulse-slow">
              <Flame className="w-3.5 h-3.5" />
              승급 {100 - progress}% 남았어요! 파이팅!
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex items-center justify-center gap-2 py-2">
          <Trophy className="w-4 h-4 text-oracle-trending" />
          <span className="text-sm font-bold gradient-text-gold">최고 등급 달성! 당신이 바로 신의 예언가</span>
        </div>
      )}

      {/* Perks */}
      <div className="relative space-y-2 pt-1 border-t border-slate-700/50">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> 현재 등급 혜택
        </p>
        <ul className="space-y-1">
          {current.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-xs text-slate-300">
              <Zap className={clsx("w-3 h-3 shrink-0", current.color)} />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GradeGrid({ currentPoints }: { currentPoints: number }) {
  const { current } = getNextGradeProgress(currentPoints);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Star className="w-4 h-4 text-oracle-trending" />
        전체 등급 로드맵
      </h3>
      <div className="space-y-2">
        {GRADES.map((grade) => {
          const isCurrentGrade = grade.id === current.id;
          const isUnlocked = currentPoints >= grade.minPoints;

          return (
            <div
              key={grade.id}
              className={clsx(
                "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300",
                isCurrentGrade
                  ? [grade.bgColor, grade.borderColor, "scale-[1.01]"]
                  : isUnlocked
                  ? "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                  : "bg-slate-900/30 border-slate-800/30 opacity-40"
              )}
              style={isCurrentGrade ? { boxShadow: `0 0 16px ${grade.glowColor}40` } : {}}
            >
              <span className={clsx("text-2xl transition-all", !isUnlocked && "grayscale opacity-50", isCurrentGrade && "animate-bounce-soft")}>
                {grade.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-sm font-bold", isUnlocked ? grade.color : "text-slate-600")}>
                    {grade.name}
                  </span>
                  <span className="text-xs text-slate-600">Lv.{grade.rank}</span>
                  {isCurrentGrade && (
                    <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full", grade.bgColor, grade.color, "border", grade.borderColor)}>
                      현재
                    </span>
                  )}
                </div>
                <p className={clsx("text-xs mt-0.5", isUnlocked ? "text-slate-400" : "text-slate-700")}>
                  {grade.minPoints.toLocaleString()}P{grade.maxPoints !== null ? ` ~ ${grade.maxPoints.toLocaleString()}P` : "+"}
                </p>
              </div>
              <ChevronRight className={clsx("w-4 h-4 shrink-0 transition-colors", isUnlocked ? grade.color : "text-slate-700")} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
