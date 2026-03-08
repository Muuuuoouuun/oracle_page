"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Flame, Clock, Star, ChevronRight } from "lucide-react";
import { Oracle } from "@/lib/types";
import clsx from "clsx";

type FilterTab = "추천" | "인기" | "트렌딩" | "마감임박";

interface Props {
  oracles: Oracle[];
  onSelectOracle?: (oracle: Oracle) => void;
}

const TABS: { key: FilterTab; icon: React.ReactNode; label: string }[] = [
  { key: "추천", icon: <Sparkles className="w-3.5 h-3.5" />, label: "추천" },
  { key: "인기", icon: <Flame className="w-3.5 h-3.5" />, label: "인기" },
  { key: "트렌딩", icon: <TrendingUp className="w-3.5 h-3.5" />, label: "트렌딩" },
  { key: "마감임박", icon: <Clock className="w-3.5 h-3.5" />, label: "마감임박" },
];

export default function RecommendationPanel({ oracles, onSelectOracle }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("추천");

  const filtered = (() => {
    switch (activeTab) {
      case "인기":
        return [...oracles].sort((a, b) => b.totalParticipants - a.totalParticipants).slice(0, 5);
      case "트렌딩":
        return oracles.filter((o) => o.isTrending).slice(0, 5);
      case "마감임박":
        return [...oracles]
          .filter((o) => o.endsAt.getTime() > Date.now())
          .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())
          .slice(0, 5);
      case "추천":
      default:
        return [...oracles]
          .sort((a, b) => {
            const scoreA = (a.isHot ? 3 : 0) + (a.isTrending ? 2 : 0) + (a.isNew ? 1 : 0);
            const scoreB = (b.isHot ? 3 : 0) + (b.isTrending ? 2 : 0) + (b.isNew ? 1 : 0);
            return scoreB - scoreA || b.totalParticipants - a.totalParticipants;
          })
          .slice(0, 5);
    }
  })();

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-oracle-trending" />
          <h2 className="text-sm font-bold text-white">추천 예언</h2>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.key
                  ? "bg-oracle-purple text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-oracle-border">
        {filtered.map((oracle, idx) => (
          <button
            key={oracle.id}
            onClick={() => onSelectOracle?.(oracle)}
            className="w-full text-left px-4 py-3 hover:bg-oracle-purple/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <span
                className={clsx(
                  "text-sm font-black w-5 text-center shrink-0",
                  idx === 0 ? "text-oracle-trending" : idx === 1 ? "text-slate-300" : "text-slate-500"
                )}
              >
                {idx + 1}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-oracle-glow transition-colors">
                  {oracle.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{oracle.category}</span>
                  <span>·</span>
                  <span>{oracle.totalParticipants.toLocaleString()}명</span>
                  {oracle.isHot && (
                    <span className="text-oracle-hot">
                      <Flame className="w-3 h-3 inline" />
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-oracle-purple transition-colors shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
