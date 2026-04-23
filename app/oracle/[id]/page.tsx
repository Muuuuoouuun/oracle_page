"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Coins, Clock, MessageCircle,
  Flame, TrendingUp, Sparkles, Send
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

/* ── BetChart (CSS-only donut-like bar chart) ── */
function BetChart({ options }: { options: { label: string; percentage: number; totalBets: number }[] }) {
  const colors = ["from-oracle-purple to-oracle-glow", "from-oracle-hot to-orange-400", "from-emerald-500 to-teal-400", "from-blue-500 to-cyan-400"];
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">배팅 현황</p>
      {/* Stacked bar */}
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        {options.map((opt, i) => (
          <div
            key={opt.label}
            className={clsx("h-full bg-gradient-to-r transition-all duration-700", colors[i % colors.length])}
            style={{ width: `${opt.percentage}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.label} className="flex items-center gap-2">
            <div className={clsx("w-3 h-3 rounded-full bg-gradient-to-r shrink-0", colors[i % colors.length])} />
            <span className="text-sm text-slate-300 flex-1">{opt.label}</span>
            <span className="text-sm font-bold text-white">{opt.percentage}%</span>
            <span className="text-xs text-slate-500">{opt.totalBets.toLocaleString()}명</span>
          </div>
        ))}
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
  { id: "c1", author: "오라클마스터", avatar: "🔮", gradeId: "arceus", text: "이건 99% 확률이지. 무조건 참여!", likes: 45, liked: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: "c2", author: "현실주의자", avatar: "🧐", gradeId: "mewtwo", text: "변수가 너무 많아서 쉽게 판단하기 어렵네요. 신중하게 참여합니다.", likes: 23, liked: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "c3", author: "피카예언", avatar: "⚡", gradeId: "pikachu", text: "역시 커뮤니티의 예언이 맞을 것 같아요 👍", likes: 12, liked: false, createdAt: new Date(Date.now() - 60 * 60 * 1000) },
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
    setComments((prev) => [
      {
        id: `c-${Date.now()}`,
        author: me.name,
        avatar: me.avatar,
        gradeId: me.gradeId,
        text: input.trim(),
        likes: 0,
        liked: false,
        createdAt: new Date(),
      },
      ...prev,
    ]);
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
        <div className="flex gap-1">
          {(["popular", "latest"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-lg border transition-all",
                sort === s ? "bg-oracle-purple/20 border-oracle-purple/50 text-oracle-purple" : "border-slate-700 text-slate-500"
              )}
            >
              {s === "popular" ? "인기순" : "최신순"}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <span className="text-xl shrink-0">{me.avatar}</span>
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 focus-within:border-oracle-purple transition-colors">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-oracle-purple text-white text-xs font-bold disabled:opacity-40 hover:bg-oracle-violet transition-colors"
            >
              <Send className="w-3 h-3" /> 등록
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {sorted.map((c) => (
          <div key={c.id} className="flex gap-3">
            <span className="text-xl shrink-0">{c.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-white">{c.author}</span>
                <GradeBadge gradeId={c.gradeId} size="xs" />
                <span className="text-xs text-slate-600">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{c.text}</p>
              <button
                onClick={() => handleLike(c.id)}
                className={clsx(
                  "flex items-center gap-1 mt-1.5 text-xs transition-colors",
                  c.liked ? "text-oracle-hot" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {c.liked ? "❤️" : "🤍"} {c.likes}
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

  const oracle = oracles.find((o) => o.id === id);
  if (!oracle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-5xl">🔮</p>
        <p className="text-white font-bold">예언을 찾을 수 없어요</p>
        <Link href="/" className="text-oracle-purple text-sm">← 돌아가기</Link>
      </div>
    );
  }

  const myBet = myBets.find((b) => b.oracleId === id);
  const isUrgent = oracle.endsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const relatedOracles = oracles.filter((o) => o.id !== id && o.category === oracle.category).slice(0, 3);

  const handleBet = (oracleId: string, optionId: string, amount: number) => {
    const opt = oracle.options.find((o) => o.id === optionId);
    if (opt) placeBet(oracleId, optionId, opt.label, oracle.title, amount);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/80 backdrop-blur-md border-b border-oracle-border px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">{oracle.category}</p>
          <p className="text-sm font-bold text-white truncate">{oracle.title}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 flex-wrap">
            <TrendingBadge isHot={oracle.isHot} isTrending={oracle.isTrending} isNew={oracle.isNew} isLive={oracle.status === "live"} />
          </div>
          <h1 className="text-xl font-black text-white leading-snug">{oracle.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{oracle.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{oracle.totalParticipants.toLocaleString()}명 참여</span>
            <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-oracle-trending" />{oracle.totalPool.toLocaleString()}P 풀</span>
            <span className={clsx("flex items-center gap-1", isUrgent && "text-oracle-hot font-bold")}>
              <Clock className="w-3.5 h-3.5" />{formatTimeLeft(oracle.endsAt)}
            </span>
            <span className="text-oracle-purple/70">by {oracle.creatorName}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4">
          <BetChart options={oracle.options} />
        </div>

        {/* Betting */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-oracle-glow" />
            {oracle.status === "closed" ? "예언 종료" : "예언 참여하기"}
          </h2>
          {oracle.status === "closed" ? (
            <p className="text-sm text-slate-400 text-center py-4">이 예언은 종료되었습니다.</p>
          ) : (
            <BettingButtons options={oracle.options} oracleId={oracle.id} onBet={handleBet} />
          )}
        </div>

        {/* Tags */}
        {oracle.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {oracle.tags.map((tag) => (
              <span key={tag} className="text-xs text-oracle-purple/70 border border-oracle-purple/20 rounded-full px-2.5 py-1">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4">
          <CommentSection oracleId={id} />
        </div>

        {/* Related */}
        {relatedOracles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">비슷한 예언</h3>
            {relatedOracles.map((o) => (
              <Link key={o.id} href={`/oracle/${o.id}`} className="block rounded-xl border border-oracle-border bg-oracle-card p-3 hover:border-oracle-purple/50 transition-colors">
                <p className="text-sm font-medium text-white line-clamp-1">{o.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span><Users className="w-3 h-3 inline mr-0.5" />{o.totalParticipants.toLocaleString()}명</span>
                  {o.isHot && <Flame className="w-3 h-3 text-oracle-hot" />}
                  {o.isTrending && <TrendingUp className="w-3 h-3 text-oracle-trending" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
