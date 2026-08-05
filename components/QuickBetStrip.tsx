"use client";

import { useState } from "react";
import { Zap, TrendingUp, Flame, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Oracle } from "@/lib/types";
import clsx from "clsx";

interface Props {
  oracles: Oracle[];
}

const CARD_ACCENTS = [
  "from-oracle-purple/20 to-oracle-violet/10",
  "from-oracle-hot/15 to-orange-500/10",
  "from-emerald-500/15 to-teal-500/10",
  "from-blue-500/15 to-cyan-500/10",
  "from-pink-500/15 to-fuchsia-500/10",
  "from-amber-500/15 to-yellow-500/10",
];

export default function QuickBetStrip({ oracles }: Props) {
  const [betStates, setBetStates] = useState<Record<string, string>>({});

  const handleQuickBet = (oracleId: string, optionId: string) => {
    setBetStates((prev) => ({ ...prev, [oracleId]: optionId }));
  };

  if (oracles.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">빠른 예언</h2>
        <span className="text-xs text-slate-500 ml-auto">{oracles.length}개</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
        {oracles.map((oracle, idx) => {
          const placed = betStates[oracle.id];
          const placedOption = oracle.options.find((o) => o.id === placed);
          const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];

          return (
            <div
              key={oracle.id}
              className={clsx(
                "snap-start shrink-0 w-60 rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden",
                "transition-all duration-300 hover:border-oracle-purple/50 hover:shadow-oracle card-hover"
              )}
            >
              {/* Top gradient accent */}
              <div className={clsx("h-1 w-full bg-gradient-to-r", accent.replace("/20", "/80").replace("/15", "/70").replace("/10", "/60"))} />

              <div className="p-3.5 space-y-2.5">
                {/* Badge row */}
                <div className="flex items-center gap-1.5">
                  {oracle.isHot && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-oracle-hot bg-oracle-hot/10 rounded-full px-1.5 py-0.5">
                      <Flame className="w-2.5 h-2.5" /> HOT
                    </span>
                  )}
                  {oracle.isTrending && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-oracle-trending bg-oracle-trending/10 rounded-full px-1.5 py-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> TREND
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto truncate">{oracle.category}</span>
                </div>

                {/* Title */}
                <p className="text-xs font-bold text-white line-clamp-2 leading-snug min-h-[2.5rem]">
                  {oracle.title}
                </p>

                {/* Quick vote buttons or success state */}
                {placed ? (
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-400">{placedOption?.label}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">예언 완료</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {oracle.options.slice(0, 2).map((opt, i) => (
                      <button
                        key={opt.id}
                        onClick={() => handleQuickBet(oracle.id, opt.id)}
                        className={clsx(
                          "flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-xl border font-medium transition-all text-[11px]",
                          "active:scale-95",
                          i === 0
                            ? "bg-oracle-purple/10 border-oracle-purple/30 text-oracle-purple hover:bg-oracle-purple/20 hover:border-oracle-purple/60"
                            : "bg-slate-700/40 border-slate-700 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500"
                        )}
                      >
                        <span className="truncate w-full text-center leading-tight">{opt.label}</span>
                        <span className="text-[10px] opacity-60 font-normal">{opt.percentage}%</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">
                    {oracle.totalParticipants.toLocaleString()}명 참여
                  </span>
                  <Link
                    href={`/oracle/${oracle.id}`}
                    className="flex items-center gap-0.5 text-[10px] text-oracle-purple hover:text-oracle-glow transition-colors font-medium"
                  >
                    상세 <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
