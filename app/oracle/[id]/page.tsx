"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Coins, Clock, MessageCircle,
  Flame, TrendingUp, Sparkles, Send, Heart, Share2, Check,
} from "lucide-react";
import { useOracles, useUser } from "@/lib/context";
import { GradeId } from "@/lib/grades";
import BettingButtons from "@/components/BettingButtons";
import TrendingBadge from "@/components/TrendingBadge";
import GradeBadge from "@/components/GradeBadge";
import clsx from "clsx";

function formatTimeLeft(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "종료됨";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 남음`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 남음`;
  return `${Math.floor(hours / 24)}일 ${hours % 24}시간 남음`;
}

/* ── Stacked BetChart ── */
const CHART_COLORS = [
  { bar: "from-oracle-purple to-oracle-glow",  dot: "bg-oracle-purple", label: "text-oracle-glow" },
  { bar: "from-oracle-hot to-orange-400",       dot: "bg-oracle-hot",    label: "text-oracle-hot" },
  { bar: "from-emerald-500 to-teal-400",        dot: "bg-emerald-500",   label: "text-emerald-400" },
  { bar: "from-blue-500 to-cyan-400",           dot: "bg-blue-500",      label: "text-blue-400" },
];

function BetChart({ options }: { options: { label: string; percentage: number; totalBets: number }[] }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">배팅 현황</p>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-xl overflow-hidden gap-0.5">
        {options.map((opt, i) => (
          <div
            key={opt.label}
            className={clsx("h-full bg-gradient-to-r transition-all duration-700 relative", CHART_COLORS[i % CHART_COLORS.length].bar)}
            style={{ width: `${opt.percentage}%` }}
          />
        ))}
      </div>

      {/* Legend with individual bars */}
      <div className="space-y-3">
        {options.map((opt, i) => {
          const c = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <div key={opt.label} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={clsx("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                <span className="text-sm text-slate-200 flex-1 font-medium">{opt.label}</span>
                <span className={clsx("text-sm font-black", c.label)}>{opt.percentage}%</span>
                <span className="text-xs text-slate-500 w-16 text-right">{opt.totalBets.toLocaleString()}명</span>
              </div>
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden ml-4">
                <div
                  className={clsx("h-full rounded-full bg-gradient-to-r transition-all duration-700", c.bar)}
                  style={{ width: `${opt.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Comment Section ── */
interface CommentData {
  id: string;
  author: string;
  avatar: string;
  gradeId: GradeId;
  text: string;
  likes: number;
  liked: boolean;
  createdAt: Date;
}

const SEED_COMMENTS: CommentData[] = [
  { id: "c1", author: "오라클마스터", avatar: "🔮", gradeId: "arceus",  text: "이건 99% 확률이지. 무조건 참여!", likes: 45, liked: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: "c2", author: "현실주의자",   avatar: "🧐", gradeId: "mewtwo",  text: "변수가 너무 많아서 쉽게 판단하기 어렵네요. 신중하게 참여합니다.", likes: 23, liked: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "c3", author: "피카예언",     avatar: "⚡", gradeId: "pikachu", text: "역시 커뮤니티의 예언이 맞을 것 같아요 👍", likes: 12, liked: false, createdAt: new Date(Date.now() - 60 * 60 * 1000) },
];

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function CommentSection({ oracleId }: { oracleId: string }) {
  const { me } = useUser();
  const [comments, setComments] = useState<CommentData[]>(SEED_COMMENTS);
  const [input, setInput] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("popular");

  const handleLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) => c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c)
    );
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    setComments((prev) => [{
      id: `c-${Date.now()}`,
      author: me.name,
      avatar: me.avatar,
      gradeId: me.gradeId,
      text: input.trim(),
      likes: 0,
      liked: false,
      createdAt: new Date(),
    }, ...prev]);
    setInput("");
  };

  const sorted = [...comments].sort((a, b) =>
    sort === "popular" ? b.likes - a.likes : b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-oracle-purple" />
          댓글 {comments.length}개
        </h3>
        <div className="flex gap-1 p-0.5 bg-slate-900/60 rounded-lg">
          {(["popular", "latest"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-md border transition-all font-medium",
                sort === s
                  ? "bg-oracle-purple/25 border-oracle-purple/50 text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {s === "popular" ? "인기순" : "최신순"}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3 items-start">
        <span className="text-xl shrink-0 mt-1">{me.avatar}</span>
        <div className="flex-1 bg-oracle-card border border-oracle-border rounded-xl p-3 focus-within:border-oracle-purple focus-within:shadow-glow-sm transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="예언에 대한 생각을 남겨보세요..."
            rows={2}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 outline-none resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-oracle-purple to-oracle-glow text-white text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-all active:scale-95"
            >
              <Send className="w-3 h-3" /> 등록
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {sorted.map((c) => (
          <div key={c.id} className="flex gap-3 group/comment">
            <span className="text-xl shrink-0 mt-0.5">{c.avatar}</span>
            <div className="flex-1 min-w-0 bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 group-hover/comment:border-slate-600/60 transition-colors">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-sm font-bold text-white">{c.author}</span>
                <GradeBadge gradeId={c.gradeId} size="xs" />
                <span className="text-xs text-slate-600 ml-auto">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
              <button
                onClick={() => handleLike(c.id)}
                className={clsx(
                  "flex items-center gap-1 mt-2 text-xs transition-all rounded-full px-2 py-0.5",
                  c.liked
                    ? "text-oracle-hot bg-oracle-hot/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                )}
              >
                <Heart className={clsx("w-3 h-3", c.liked && "fill-current")} />
                {c.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function OracleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { oracles } = useOracles();
  const { me, myBets, placeBet } = useUser();
  const [copied, setCopied] = useState(false);

  const oracle = oracles.find((o) => o.id === id);
  if (!oracle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-5xl">🔮</p>
        <p className="text-white font-bold text-lg">예언을 찾을 수 없어요</p>
        <Link href="/" className="text-oracle-purple text-sm hover:text-oracle-glow transition-colors">
          ← 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/oracle/${oracle.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: oracle.title, url }); }
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  };

  const myBet = myBets.find((b) => b.oracleId === id);
  const isUrgent = oracle.endsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const relatedOracles = oracles.filter((o) => o.id !== id && o.category === oracle.category).slice(0, 3);

  const handleBet = (oracleId: string, optionId: string, amount: number) => {
    const opt = oracle.options.find((o) => o.id === optionId);
    if (opt) placeBet(oracleId, optionId, opt.label, oracle.title, amount);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/85 backdrop-blur-xl border-b border-oracle-border/60 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white hover:border-oracle-border/80 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-500 font-medium">{oracle.category}</p>
          <p className="text-sm font-bold text-white truncate">{oracle.title}</p>
        </div>
        <button
          onClick={handleShare}
          className={clsx(
            "w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center transition-all",
            copied ? "text-emerald-400 border-emerald-500/40" : "text-slate-400 hover:text-white hover:border-oracle-border/80"
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 flex-wrap">
            <TrendingBadge isHot={oracle.isHot} isTrending={oracle.isTrending} isNew={oracle.isNew} isLive={oracle.status === "live"} />
          </div>
          <h1 className="text-2xl font-black text-white leading-snug">{oracle.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{oracle.description}</p>

          {/* Meta chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5" />
              {oracle.totalParticipants.toLocaleString()}명 참여
            </span>
            <span className="flex items-center gap-1.5 bg-oracle-trending/10 border border-oracle-trending/25 rounded-full px-3 py-1 text-xs font-semibold text-oracle-trending">
              <Coins className="w-3.5 h-3.5" />
              {oracle.totalPool.toLocaleString()}P 풀
            </span>
            <span className={clsx(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
              isUrgent
                ? "bg-oracle-hot/10 border-oracle-hot/30 text-oracle-hot"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400"
            )}>
              <Clock className={clsx("w-3.5 h-3.5", isUrgent && "animate-pulse")} />
              {formatTimeLeft(oracle.endsAt)}
            </span>
            <span className="ml-auto text-xs text-slate-500">by {oracle.creatorName}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-5">
          <BetChart options={oracle.options} />
        </div>

        {/* Betting */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-oracle-glow" />
            {oracle.status === "closed" ? "예언 종료됨" : "예언 참여하기"}
          </h2>
          {oracle.status === "closed" ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-3xl">🔒</p>
              <p className="text-sm text-slate-400">이 예언은 종료되었습니다</p>
            </div>
          ) : (
            <BettingButtons options={oracle.options} oracleId={oracle.id} onBet={handleBet} />
          )}
        </div>

        {/* Tags */}
        {oracle.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {oracle.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-oracle-purple/80 border border-oracle-purple/25 rounded-full px-3 py-1 bg-oracle-purple/5 hover:bg-oracle-purple/15 hover:border-oracle-purple/50 transition-all cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-5">
          <CommentSection oracleId={id} />
        </div>

        {/* Related oracles */}
        {relatedOracles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-oracle-hot" />
              비슷한 예언
            </h3>
            {relatedOracles.map((o) => (
              <Link
                key={o.id}
                href={`/oracle/${o.id}`}
                className="block rounded-xl border border-oracle-border bg-oracle-card p-4 hover:border-oracle-purple/50 hover:shadow-oracle transition-all group card-hover"
              >
                <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-oracle-glow transition-colors">{o.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{o.totalParticipants.toLocaleString()}명</span>
                  {o.isHot && <Flame className="w-3 h-3 text-oracle-hot" />}
                  {o.isTrending && <TrendingUp className="w-3 h-3 text-oracle-trending" />}
                  <span className="ml-auto text-oracle-purple font-medium">상세 보기 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
