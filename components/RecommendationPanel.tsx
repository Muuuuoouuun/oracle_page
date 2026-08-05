"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Flame, Clock, Star, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { Oracle } from "@/lib/types";
import clsx from "clsx";

type FilterTab = "추천" | "인기" | "트렌딩" | "마감임박";

interface Props {
  oracles: Oracle[];
  onSelectOracle?: (oracle: Oracle) => void;
}

const TABS: { key: FilterTab; icon: React.ReactNode; label: string }[] = [
  { key: "추천",   icon: <Sparkles className="w-3.5 h-3.5" />,   label: "추천" },
  { key: "인기",   icon: <Flame className="w-3.5 h-3.5" />,       label: "인기" },
  { key: "트렌딩", icon: <TrendingUp className="w-3.5 h-3.5" />,  label: "트렌딩" },
  { key: "마감임박", icon: <Clock className="w-3.5 h-3.5" />,     label: "마감임박" },
];

const RANK_STYLES = [
  { label: "1", className: "rank-1 font-black" },
  { label: "2", className: "rank-2 font-black" },
  { label: "3", className: "rank-3 font-black" },
];

function formatShortTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "종료됨";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / 60000)}분`;
  if (hours < 24) return `${hours}시간`;
  return `${Math.floor(hours / 24)}일`;
}

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
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-oracle-trending animate-bounce-soft" />
          <h2 className="text-sm font-bold text-white">추천 예언</h2>
          <span className="ml-auto text-xs text-slate-500">{filtered.length}개</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all duration-200",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-oracle-purple to-oracle-violet text-white shadow-oracle"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-oracle-border/50">
        {filtered.map((oracle, idx) => {
          const rankStyle = RANK_STYLES[idx] ?? { label: `${idx + 1}`, className: "text-slate-600 font-bold" };
          const isUrgent = oracle.endsAt.getTime() - Date.now() < 3 * 60 * 60 * 1000;

          return (
            <Link
              key={oracle.id}
              href={`/oracle/${oracle.id}`}
              onClick={() => onSelectOracle?.(oracle)}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-oracle-purple/5 transition-colors group"
            >
              {/* Rank number */}
              <div className="w-6 text-center shrink-0">
                <span className={clsx("text-sm", rankStyle.className)}>{rankStyle.label}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-oracle-glow transition-colors duration-200">
                  {oracle.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{oracle.category}</span>
                  <span className="text-slate-700">·</span>
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {oracle.totalParticipants.toLocaleString()}명
                  </span>
                  {oracle.isHot && (
                    <Flame className="w-3 h-3 text-oracle-hot shrink-0" />
                  )}
                  {activeTab === "마감임박" && (
                    <span className={clsx("ml-auto font-bold shrink-0", isUrgent ? "text-oracle-hot" : "text-slate-500")}>
                      {formatShortTime(oracle.endsAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-oracle-purple group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          <p className="text-2xl mb-2">🔮</p>
          해당 카테고리 예언이 없어요
        </div>
      )}
    </div>
  );
}
