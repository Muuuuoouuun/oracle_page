"use client";

import { useState, useRef, useCallback } from "react";
import { MessageCircle, Clock, Users, Coins, ChevronDown, ChevronUp, ExternalLink, Share2, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Oracle } from "@/lib/types";
import { useUser } from "@/lib/context";
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

const CATEGORY_STYLES: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  "경제/주식":    { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  "스포츠":       { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    dot: "bg-blue-400" },
  "정치":         { text: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400" },
  "엔터테인먼트": { text: "text-pink-400",     bg: "bg-pink-500/10",    border: "border-pink-500/20",    dot: "bg-pink-400" },
  "기술/AI":      { text: "text-cyan-400",     bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    dot: "bg-cyan-400" },
  "날씨/자연":    { text: "text-sky-400",      bg: "bg-sky-500/10",     border: "border-sky-500/20",     dot: "bg-sky-400" },
  "사회/문화":    { text: "text-violet-400",   bg: "bg-violet-500/10",  border: "border-violet-500/20",  dot: "bg-violet-400" },
};

const OPTION_GRADIENTS = [
  "from-oracle-purple to-oracle-glow",
  "from-oracle-hot to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-blue-500 to-cyan-400",
];

const DELAY_CLASSES = ["pr-d1", "pr-d2", "pr-d3", "pr-d4"];

export default function OracleCard({ oracle, compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);
  const { showToast } = useUser();
  const cardRef = useRef<HTMLDivElement>(null);

  /* ── 3D tilt (direct DOM mutation, no re-render) ── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const y = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    el.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 7}deg) translateY(-3px) scale(1.012)`;
    el.style.boxShadow = `
      ${x * 6}px ${y * 6 + 10}px 36px rgba(124,58,237,0.20),
      0 ${8 + Math.abs(y * 3)}px 20px rgba(0,0,0,0.28)
    `;
    el.style.borderColor = "rgba(124,58,237,0.55)";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform   = "";
    el.style.boxShadow   = "";
    el.style.borderColor = "";
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/oracle/${oracle.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: oracle.title, url });
        showToast("공유 완료!", "🔗", "info");
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        showToast("링크가 복사되었어요!", "🔗", "info");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const catStyle = CATEGORY_STYLES[oracle.category] ?? {
    text: "text-slate-400", bg: "bg-slate-500/10",
    border: "border-slate-500/20", dot: "bg-slate-400",
  };
  const timeLeft = formatTimeLeft(oracle.endsAt);
  const isUrgent = oracle.endsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "rounded-2xl border relative overflow-hidden group/card card-3d surface-light",
        "bg-oracle-card border-oracle-border",
        oracle.isHot && "ring-1 ring-oracle-hot/20 hot-pulse"
      )}
      style={{ transition: "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.22s ease, border-color 0.22s ease" }}
    >
      {/* Hot double-ring pulse */}
      {oracle.isHot && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-oracle-hot/25 animate-ping-slow pointer-events-none" />
      )}

      <div className="p-4 space-y-3 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/category/${encodeURIComponent(oracle.category)}`}
                className={clsx(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all hover:opacity-90 shine-hover",
                  catStyle.text, catStyle.bg, catStyle.border
                )}
              >
                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", catStyle.dot)} />
                {oracle.category}
              </Link>
              <TrendingBadge
                isHot={oracle.isHot}
                isTrending={oracle.isTrending}
                isNew={oracle.isNew}
                isLive={oracle.status === "live"}
              />
            </div>
            <Link href={`/oracle/${oracle.id}`} className="group/title block">
              <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover/title:text-oracle-glow transition-colors duration-200">
                {oracle.title}
              </h3>
            </Link>
          </div>
          <div className="text-2xl shrink-0 group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            {oracle.creatorAvatar}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium tabular-nums">{oracle.totalParticipants.toLocaleString()}명</span>
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-oracle-trending" />
            <span className="text-oracle-trending font-semibold tabular-nums">{oracle.totalPool.toLocaleString()}P</span>
          </span>
          <span
            className={clsx(
              "flex items-center gap-1 ml-auto font-medium",
              isUrgent ? "text-oracle-hot" : "text-slate-500"
            )}
          >
            <Clock className={clsx("w-3.5 h-3.5", isUrgent && "animate-pulse")} />
            {timeLeft}
          </span>
        </div>

        {/* Option percentage bars with clip-path reveal */}
        <div className="space-y-2">
          {oracle.options.map((opt, i) => (
            <div key={opt.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{opt.label}</span>
                <span className="font-bold text-white tabular-nums">{opt.percentage}%</span>
              </div>
              <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden progress-bar">
                <div
                  className={clsx(
                    "h-full rounded-full bg-gradient-to-r progress-reveal",
                    OPTION_GRADIENTS[i % OPTION_GRADIENTS.length],
                    DELAY_CLASSES[i] ?? ""
                  )}
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Expand toggle (compact mode) */}
        {compact && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-xs text-oracle-purple hover:text-oracle-glow transition-colors py-1 font-medium"
          >
            {expanded ? (
              <><ChevronUp className="w-3.5 h-3.5" /> 접기</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> 예언하기 <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        )}

        {/* Betting section */}
        {(expanded || !compact) && (
          <div className="pt-2 border-t border-oracle-border/60">
            <BettingButtons options={oracle.options} oracleId={oracle.id} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <span className="hover:text-slate-300 transition-colors">by {oracle.creatorName}</span>
          <div className="flex items-center gap-3">
            {oracle.tags.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="text-oracle-purple/60 hover:text-oracle-purple transition-colors"
              >
                #{tag}
              </Link>
            ))}
            <Link href={`/oracle/${oracle.id}`} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              {oracle.commentCount}
            </Link>
            <button
              onClick={handleShare}
              className={clsx(
                "flex items-center gap-1 transition-colors",
                copied ? "text-emerald-400" : "hover:text-oracle-purple"
              )}
              title="공유"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <Link href={`/oracle/${oracle.id}`} className="flex items-center gap-1 hover:text-oracle-purple transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
