"use client";

import { useEffect } from "react";
import { useGrades } from "@/lib/context";
import clsx from "clsx";

/**
 * 승급 순간 전체 화면 연출.
 * 포켓몬 진화가 컨셉인 앱에서 가장 자랑할 만한 순간인데 그동안 알림 한 줄로 지나갔다.
 */
export default function GradeUpOverlay() {
  const { gradeUpEvent, clearGradeUp } = useGrades();

  // 연출은 잠깐이면 충분하다 — 자동으로 닫는다.
  useEffect(() => {
    if (!gradeUpEvent) return;
    const timer = setTimeout(clearGradeUp, 4200);
    return () => clearTimeout(timer);
  }, [gradeUpEvent, clearGradeUp]);

  // Esc 로도 닫기
  useEffect(() => {
    if (!gradeUpEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearGradeUp();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gradeUpEvent, clearGradeUp]);

  if (!gradeUpEvent) return null;
  const g = gradeUpEvent;

  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-label={`${g.name} 등급으로 승급했습니다`}
      onClick={clearGradeUp}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer evolve-fade"
    >
      {/* 방사형 광선 */}
      <div
        className="absolute w-[140vmin] h-[140vmin] rounded-full evolve-rays"
        style={{
          background: `radial-gradient(circle, ${g.glowColor} 0%, transparent 62%)`,
        }}
      />

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-white/60">EVOLUTION</p>

        <div
          className={clsx(
            "w-36 h-36 rounded-[2rem] flex items-center justify-center text-7xl border-2 evolve-pop",
            g.bgColor,
            g.borderColor
          )}
          style={{ boxShadow: `0 0 60px ${g.glowColor}, inset 0 0 30px ${g.glowColor}` }}
        >
          {g.emoji}
        </div>

        <div className="space-y-1 evolve-rise">
          <p className="text-sm text-white/70">축하합니다! 등급이 올랐습니다</p>
          <h2 className={clsx("text-4xl font-black", g.color)}>{g.name}</h2>
          <p className={clsx("text-base font-bold", g.color, "opacity-80")}>{g.title}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 max-w-sm evolve-rise-late">
          {g.perks.map((perk) => (
            <span
              key={perk}
              className={clsx(
                "text-[11px] px-2.5 py-1 rounded-full border",
                g.bgColor,
                g.color,
                g.borderColor
              )}
            >
              {perk}
            </span>
          ))}
        </div>

        <p className="text-xs text-white/40 mt-2">화면을 누르면 닫힙니다</p>
      </div>
    </div>
  );
}
