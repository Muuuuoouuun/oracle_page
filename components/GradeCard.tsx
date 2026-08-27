"use client";

import { useGrades } from "@/lib/context";
import clsx from "clsx";
import { Shield, Star, ChevronRight } from "lucide-react";

interface Props {
  points: number;
}

export default function GradeCard({ points }: Props) {
  const { nextGradeProgress } = useGrades();
  const { current, next, progress, pointsNeeded } = nextGradeProgress(points);

  return (
    <div
      className={clsx(
        "rounded-2xl border p-4 space-y-3",
        current.bgColor,
        current.borderColor
      )}
      style={{ boxShadow: `0 0 20px ${current.glowColor}` }}
    >
      {/* Current grade */}
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2",
            current.bgColor,
            current.borderColor
          )}
        >
          {current.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={clsx("text-lg font-black", current.color)}>{current.name}</span>
            <span className="text-xs text-slate-500">Lv.{current.rank}</span>
          </div>
          <p className={clsx("text-xs font-medium", current.color, "opacity-80")}>{current.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{current.description}</p>
        </div>
      </div>

      {/* Progress to next */}
      {next ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              다음 등급: <span className="font-bold text-white">{next.emoji} {next.name}</span>
            </span>
            <span className={clsx("font-bold", current.color)}>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${current.glowColor}, ${next.glowColor ?? current.glowColor})`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-bold text-white">{pointsNeeded.toLocaleString()}P</span> 더 모으면 승급!
          </p>
        </div>
      ) : (
        <div className="text-xs text-center text-slate-400 py-1">
          ✨ 최고 등급 달성! 당신이 바로 신의 예언가입니다
        </div>
      )}

      {/* Perks */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Shield className="w-3 h-3" /> 현재 등급 혜택
        </p>
        <ul className="space-y-0.5">
          {current.perks.map((perk) => (
            <li key={perk} className="text-xs text-slate-300 flex items-center gap-1.5">
              <span className={clsx("w-1 h-1 rounded-full shrink-0", current.color.replace("text-", "bg-"))} />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** All grades overview grid */
export function GradeGrid({ currentPoints }: { currentPoints: number }) {
  const { grades, gradeByPoints } = useGrades();
  const current = gradeByPoints(currentPoints);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Star className="w-4 h-4 text-oracle-trending" />
        전체 등급 로드맵
      </h3>
      <div className="space-y-2">
        {grades.map((grade) => {
          const isCurrentGrade = grade.id === current.id;
          const isUnlocked = currentPoints >= grade.minPoints;

          return (
            <div
              key={grade.id}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                isCurrentGrade
                  ? [grade.bgColor, grade.borderColor, "scale-[1.01]"]
                  : isUnlocked
                  ? "bg-slate-800/30 border-slate-700/50"
                  : "bg-slate-900/30 border-slate-800/30 opacity-50"
              )}
              style={isCurrentGrade ? { boxShadow: `0 0 12px ${grade.glowColor}` } : {}}
            >
              <span className={clsx("text-2xl", !isUnlocked && "grayscale")}>{grade.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
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
                <p className={clsx("text-xs", isUnlocked ? "text-slate-400" : "text-slate-700")}>
                  {grade.minPoints.toLocaleString()}P~
                  {grade.maxPoints !== null ? ` ${grade.maxPoints.toLocaleString()}P` : ""}
                </p>
              </div>
              <ChevronRight className={clsx("w-4 h-4 shrink-0", isUnlocked ? grade.color : "text-slate-700")} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
