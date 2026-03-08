"use client";

import { Grade, GradeId, getGradeById } from "@/lib/grades";
import clsx from "clsx";

interface Props {
  gradeId: GradeId;
  size?: "xs" | "sm" | "md" | "lg";
  showTitle?: boolean;
  isOverride?: boolean;
}

const SIZE_MAP = {
  xs: { emoji: "text-xs", text: "text-[10px]", padding: "px-1.5 py-0.5", gap: "gap-0.5" },
  sm: { emoji: "text-sm", text: "text-xs", padding: "px-2 py-0.5", gap: "gap-1" },
  md: { emoji: "text-base", text: "text-xs", padding: "px-2.5 py-1", gap: "gap-1" },
  lg: { emoji: "text-xl", text: "text-sm", padding: "px-3 py-1.5", gap: "gap-1.5" },
};

export default function GradeBadge({ gradeId, size = "sm", showTitle = false, isOverride }: Props) {
  const grade = getGradeById(gradeId);
  const s = SIZE_MAP[size];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border font-semibold",
        s.padding, s.gap,
        grade.color,
        grade.bgColor,
        grade.borderColor
      )}
      style={{ boxShadow: `0 0 8px ${grade.glowColor}` }}
      title={isOverride ? "관리자 지정 등급" : "자동 등급"}
    >
      <span className={s.emoji}>{grade.emoji}</span>
      <span className={s.text}>{grade.name}</span>
      {showTitle && (
        <span className={clsx(s.text, "opacity-70")}>· {grade.title}</span>
      )}
      {isOverride && (
        <span className={clsx(s.text, "opacity-60")}>★</span>
      )}
    </span>
  );
}

/** Compact icon-only version */
export function GradeIcon({ gradeId, className }: { gradeId: GradeId; className?: string }) {
  const grade = getGradeById(gradeId);
  return (
    <span
      className={clsx("inline-block", className)}
      title={`${grade.name} · ${grade.title}`}
    >
      {grade.emoji}
    </span>
  );
}
