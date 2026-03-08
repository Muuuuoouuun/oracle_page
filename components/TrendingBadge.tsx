"use client";

import { Flame, TrendingUp, Sparkles, Zap } from "lucide-react";
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </span>
      )}
      {isHot && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-oracle-hot/20 text-oracle-hot border border-oracle-hot/30">
          <Flame className="w-3 h-3" />
          HOT
        </span>
      )}
      {isTrending && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-oracle-trending/20 text-oracle-trending border border-oracle-trending/30">
          <TrendingUp className="w-3 h-3" />
          트렌딩
        </span>
      )}
      {isNew && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
        <span className="font-bold text-white">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
