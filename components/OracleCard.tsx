"use client";

import { useState } from "react";
import { MessageCircle, Clock, Users, Coins, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Oracle } from "@/lib/types";
import TrendingBadge from "./TrendingBadge";
import BettingButtons from "./BettingButtons";
import clsx from "clsx";

interface Props {
  oracle: Oracle;
  compact?: boolean;
}

function formatTimeLeft(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "종료됨";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 ${hours % 24}시간 남음`;
  if (hours > 0) return `${hours}시간 남음`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}분 남음`;
}

const CATEGORY_COLORS: Record<string, string> = {
  "경제/주식": "text-emerald-400 bg-emerald-500/10",
  "스포츠": "text-blue-400 bg-blue-500/10",
  "정치": "text-red-400 bg-red-500/10",
  "엔터테인먼트": "text-pink-400 bg-pink-500/10",
  "기술/AI": "text-cyan-400 bg-cyan-500/10",
  "날씨/자연": "text-sky-400 bg-sky-500/10",
  "사회/문화": "text-violet-400 bg-violet-500/10",
};

export default function OracleCard({ oracle, compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const [liked, setLiked] = useState(false);

  const categoryColor = CATEGORY_COLORS[oracle.category] ?? "text-slate-400 bg-slate-500/10";
  const timeLeft = formatTimeLeft(oracle.endsAt);
  const isUrgent = oracle.endsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div
      className={clsx(
        "rounded-2xl border transition-all duration-300",
        "bg-oracle-card border-oracle-border",
        "hover:border-oracle-purple/50 hover:shadow-lg hover:shadow-oracle-purple/10",
        oracle.isHot && "ring-1 ring-oracle-hot/30"
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", categoryColor)}>
                {oracle.category}
              </span>
              <TrendingBadge
                isHot={oracle.isHot}
                isTrending={oracle.isTrending}
                isNew={oracle.isNew}
                isLive={oracle.status === "live"}
              />
            </div>
            <Link href={`/oracle/${oracle.id}`} className="group/title">
              <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover/title:text-oracle-glow transition-colors">
                {oracle.title}
              </h3>
            </Link>
          </div>
          <div className="text-2xl shrink-0">{oracle.creatorAvatar}</div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {oracle.totalParticipants.toLocaleString()}명
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-oracle-trending" />
            {oracle.totalPool.toLocaleString()}P
          </span>
          <span
            className={clsx(
              "flex items-center gap-1 ml-auto",
              isUrgent ? "text-oracle-hot font-bold" : "text-slate-500"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}
          </span>
        </div>

        {/* Option percentage preview (always visible) */}
        <div className="space-y-1.5">
          {oracle.options.map((opt) => (
            <div key={opt.id} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{opt.label}</span>
                <span className="text-white font-bold">{opt.percentage}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow"
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Expand/collapse betting section */}
        {compact ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-xs text-oracle-purple hover:text-oracle-glow transition-colors py-1"
          >
            {expanded ? (
              <>접기 <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>예언하기 <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        ) : null}

        {/* Betting section */}
        {(expanded || !compact) && (
          <div className="pt-1 border-t border-oracle-border">
            <BettingButtons
              options={oracle.options}
              oracleId={oracle.id}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>by {oracle.creatorName}</span>
          <div className="flex items-center gap-3">
            {oracle.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-oracle-purple/70 hover:text-oracle-purple cursor-pointer">
                #{tag}
              </span>
            ))}
            <Link href={`/oracle/${oracle.id}`} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              {oracle.commentCount}
            </Link>
            <Link href={`/oracle/${oracle.id}`} className="flex items-center gap-1 hover:text-oracle-purple transition-colors">
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
