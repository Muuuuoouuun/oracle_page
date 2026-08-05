"use client";

import { Flame, TrendingUp, Sparkles } from "lucide-react";
import clsx from "clsx";

interface Props {
  isHot?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  isLive?: boolean;
}

export default function TrendingBadge({ isHot, isTrending, isNew, isLive }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {isLive && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-red-400" />
          </span>
          LIVE
        </span>
      )}
      {isHot && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-oracle-hot/15 text-oracle-hot border border-oracle-hot/30 shadow-[0_0_8px_rgba(255,77,109,0.2)]">
          <Flame className="w-3 h-3" />
          HOT
        </span>
      )}
      {isTrending && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-oracle-trending/15 text-oracle-trending border border-oracle-trending/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
          <TrendingUp className="w-3 h-3" />
          트렌딩
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-3 h-3" />
          NEW
        </span>
      )}
    </div>
  );
}

export function PopularityBar({ percentage, label }: { percentage: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-bold text-white tabular-nums">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden progress-bar">
        <div
          className="h-full rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
