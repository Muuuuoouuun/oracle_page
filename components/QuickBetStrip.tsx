"use client";

import { useState } from "react";
import { Zap, TrendingUp, Flame, ChevronRight } from "lucide-react";
import { Oracle } from "@/lib/types";
import clsx from "clsx";

interface Props {
  oracles: Oracle[];
}

export default function QuickBetStrip({ oracles }: Props) {
  const [betStates, setBetStates] = useState<Record<string, string>>({});

  const handleQuickBet = (oracleId: string, optionId: string) => {
    setBetStates((prev) => ({ ...prev, [oracleId]: optionId }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">지금 핫한 예언 빠른 배팅</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {oracles.map((oracle) => {
          const placed = betStates[oracle.id];
          const placedOption = oracle.options.find((o) => o.id === placed);

          return (
            <div
              key={oracle.id}
              className="snap-start shrink-0 w-64 rounded-xl border border-oracle-border bg-oracle-card p-3 space-y-2"
            >
              {/* Badge */}
              <div className="flex items-center gap-1">
                {oracle.isHot && <Flame className="w-3 h-3 text-oracle-hot" />}
                {oracle.isTrending && <TrendingUp className="w-3 h-3 text-oracle-trending" />}
                <span className="text-xs text-slate-500 truncate">{oracle.category}</span>
              </div>

              {/* Title */}
              <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                {oracle.title}
              </p>

              {/* Quick vote buttons */}
              {placed ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  ✓ {placedOption?.label} 예언 완료!
                </div>
              ) : (
                <div className="flex gap-1.5">
                  {oracle.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleQuickBet(oracle.id, opt.id)}
                      className={clsx(
                        "flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all",
                        "bg-slate-800 border-slate-700 text-slate-300",
                        "hover:bg-oracle-purple/20 hover:border-oracle-purple/60 hover:text-white",
                        "active:scale-95"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{oracle.totalParticipants.toLocaleString()}명 참여</span>
                <span className="flex items-center gap-0.5 text-oracle-purple">
                  상세 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
