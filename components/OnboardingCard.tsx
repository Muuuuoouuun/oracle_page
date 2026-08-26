"use client";

import Link from "next/link";
import { X, Coins, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { TUTORIAL_ID, useOracles, useUI } from "@/lib/context";

const BASICS = [
  {
    icon: <Coins className="w-4 h-4" />,
    title: "포인트를 겁니다",
    body: "1,500P로 시작합니다. 예언에 참여하면 건 만큼 빠져나갑니다.",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    title: "배당이 수익을 정합니다",
    body: "적게 고른 쪽일수록 배당이 높습니다. 배당은 배팅한 순간 값으로 고정됩니다.",
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    title: "적중하면 등급이 오릅니다",
    body: "포인트가 쌓이면 잉어킹부터 아르세우스까지 진화합니다. 등급이 오르면 배당도 올라갑니다.",
  },
];

/**
 * 첫 방문자용 안내.
 * 설명을 길게 하는 대신 90초짜리 연습 예언으로 곧장 보낸다.
 */
export default function OnboardingCard() {
  const { onboarded, finishOnboarding } = useUI();
  const { oracles } = useOracles();

  const tutorial = oracles.find((o) => o.id === TUTORIAL_ID);
  if (onboarded) return null;

  return (
    <section className="rounded-2xl border border-oracle-purple/40 bg-oracle-purple/5 p-5 space-y-4 relative">
      <button
        onClick={finishOnboarding}
        aria-label="안내 닫기"
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="space-y-1 pr-8">
        <p className="text-xs font-bold tracking-wider text-oracle-purple">처음이신가요?</p>
        <h2 className="text-lg font-black text-white">30초면 충분합니다</h2>
      </div>

      <ul className="space-y-2.5">
        {BASICS.map((b) => (
          <li key={b.title} className="flex gap-3">
            <span className="w-8 h-8 rounded-lg bg-oracle-purple/15 border border-oracle-purple/30 text-oracle-purple flex items-center justify-center shrink-0">
              {b.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-snug">{b.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{b.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {tutorial && tutorial.status === "live" ? (
        <Link
          href={`/oracle/${TUTORIAL_ID}`}
          onClick={finishOnboarding}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          연습 예언 해보기 — 90초 뒤 결과 <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <button
          onClick={finishOnboarding}
          className="w-full py-3 rounded-xl border border-oracle-purple/50 text-oracle-purple font-bold text-sm hover:bg-oracle-purple/10 transition-colors"
        >
          알겠습니다
        </button>
      )}
    </section>
  );
}
