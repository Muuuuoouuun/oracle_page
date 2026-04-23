"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { GRADES } from "@/lib/grades";
import GradeBadge from "./GradeBadge";
import clsx from "clsx";

interface Props { onClose: () => void }

const STEPS = [
  {
    emoji: "🔮",
    title: "Oracle Page에 오신 걸 환영합니다!",
    body: "당신은 예언가입니까? 세상의 미래를 예측하고, 맞히면 포인트를 획득하세요. 커뮤니티와 함께 예언의 세계로 빠져보세요.",
    highlight: null,
  },
  {
    emoji: "⚡",
    title: "예언에 배팅하세요",
    body: "관심 있는 예언에 포인트를 걸고 결과를 기다리세요. 맞히면 배당률에 따라 포인트가 지급됩니다. 직감을 믿으세요!",
    highlight: "betting",
  },
  {
    emoji: "🏆",
    title: "포켓몬 등급으로 성장하세요",
    body: "포인트가 쌓일수록 등급이 올라갑니다. 잉어킹에서 시작해 아르세우스까지 — 더 높은 등급일수록 더 많은 혜택이!",
    highlight: "grades",
  },
  {
    emoji: "✨",
    title: "예언을 직접 만들어보세요",
    body: "🌱 이상해씨 등급부터 직접 예언을 만들 수 있어요. 우측 하단 + 버튼을 눌러 새 예언을 등록해보세요!",
    highlight: null,
  },
];

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl bg-oracle-card border border-oracle-border shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-oracle-purple" : i < step ? "w-3 bg-oracle-purple/50" : "w-3 bg-slate-700"
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 text-center">
          <div className="text-6xl animate-float">{current.emoji}</div>
          <h2 className="text-lg font-black text-white leading-snug">{current.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{current.body}</p>

          {/* Grade showcase on step 2 */}
          {current.highlight === "grades" && (
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {GRADES.map((g) => (
                <GradeBadge key={g.id} gradeId={g.id} size="xs" />
              ))}
            </div>
          )}

          {/* Betting example on step 1 */}
          {current.highlight === "betting" && (
            <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3 text-left space-y-2">
              <p className="text-xs text-slate-400 text-center">배팅 예시</p>
              <div className="flex gap-2">
                <div className="flex-1 py-2 rounded-lg bg-oracle-purple/20 border border-oracle-purple/50 text-center text-sm text-white font-bold">상승 📈</div>
                <div className="flex-1 py-2 rounded-lg bg-slate-700 border border-slate-600 text-center text-sm text-slate-400">하락 📉</div>
              </div>
              <div className="flex gap-1.5">
                {[10, 50, 100].map((p) => (
                  <span key={p} className="flex-1 text-center text-xs py-1 rounded-lg bg-slate-700 border border-slate-600 text-slate-300">{p}P</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(step + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {isLast ? "시작하기 🔮" : <>다음 <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
