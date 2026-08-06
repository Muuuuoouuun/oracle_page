"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Trophy, Target, Coins, Calendar, TrendingUp,
  CheckCircle2, XCircle, Clock, ChevronRight, Zap, Star,
} from "lucide-react";
import { useUser, useOracles } from "@/lib/context";
import { MOCK_USERS } from "@/lib/adminData";
import { getGradeByPoints, getNextGradeProgress } from "@/lib/grades";
import GradeBadge from "@/components/GradeBadge";
import GradeCard, { GradeGrid } from "@/components/GradeCard";
import { UserProfile } from "@/lib/types";
import clsx from "clsx";

function formatDate(d: Date) {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function timeAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const BET_STATUS_CONFIG = {
  won:     { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "적중" },
  lost:    { icon: <XCircle className="w-4 h-4" />,      color: "text-oracle-hot",  bg: "bg-oracle-hot/10",  border: "border-oracle-hot/25",  label: "미적중" },
  pending: { icon: <Clock className="w-4 h-4" />,         color: "text-slate-500",   bg: "bg-slate-500/10",   border: "border-slate-600/25",   label: "대기중" },
};

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, myBets } = useUser();
  const { oracles } = useOracles();

  const isMe = id === "me" || id === me.id;
  const user: UserProfile | undefined = isMe ? me : MOCK_USERS.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">👤</div>
        <p className="text-white font-bold">유저를 찾을 수 없어요</p>
        <Link href="/" className="text-sm text-oracle-purple hover:text-oracle-glow transition-colors">
          ← 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const grade = getGradeByPoints(user.points);
  const { next, progress, pointsNeeded } = getNextGradeProgress(user.points);
  const wonBets = isMe ? myBets.filter((b) => b.status === "won") : [];
  const settledBets = isMe ? myBets.filter(b => b.status !== "pending") : [];
  const accuracy = isMe
    ? settledBets.length > 0 ? Math.round((wonBets.length / settledBets.length) * 100) : 0
    : user.accuracy;
  const createdOracles = oracles.filter((o) => o.creatorName === user.name);

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/85 backdrop-blur-xl border-b border-oracle-border/60 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white hover:border-oracle-border/80 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{isMe ? "나의 프로필" : user.name}</p>
        </div>
        <GradeBadge gradeId={grade.id} size="xs" isOverride={user.gradeOverride} />
      </div>

      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Profile hero */}
        <div
          className={clsx("rounded-2xl border p-5 space-y-4 relative overflow-hidden", grade.bgColor, grade.borderColor)}
          style={{ boxShadow: `0 0 32px ${grade.glowColor}30, 0 4px 24px rgba(0,0,0,0.4)` }}
        >
          {/* Background decoration */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-15 blur-2xl pointer-events-none" style={{ background: grade.glowColor }} />

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2", grade.bgColor, grade.borderColor)}
                style={{ boxShadow: `0 0 16px ${grade.glowColor}50` }}
              >
                {user.avatar}
              </div>
              {user.role === "admin" && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-oracle-purple border-2 border-oracle-dark flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-white">{user.name}</h1>
                {user.role === "admin" && (
                  <span className="text-[10px] bg-oracle-purple/25 text-oracle-glow border border-oracle-purple/40 px-1.5 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <GradeBadge gradeId={grade.id} size="sm" showTitle isOverride={user.gradeOverride} />
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDate(user.joinedAt)} 가입
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="relative grid grid-cols-3 gap-2">
            {[
              { label: "포인트",  value: `${user.points.toLocaleString()}P`, icon: <Zap className="w-3.5 h-3.5" />,    color: "text-oracle-glow" },
              { label: "적중률",  value: accuracy > 0 ? `${accuracy}%` : "—",  icon: <Target className="w-3.5 h-3.5" />, color: "text-oracle-trending" },
              { label: "총 배팅", value: `${isMe ? myBets.length : user.totalBets}건`, icon: <Trophy className="w-3.5 h-3.5" />, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="text-center bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
                <div className={clsx("flex justify-center mb-1.5", s.color)}>{s.icon}</div>
                <p className={clsx("text-base font-black", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Grade progress */}
          {next && (
            <div className="relative space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  다음: <span className="font-bold text-white">{next.emoji} {next.name}</span>
                </span>
                <span className={clsx("font-bold", grade.color)}>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-900/60 rounded-full overflow-hidden progress-bar">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(to right, ${grade.glowColor}, ${next.glowColor ?? grade.glowColor})`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">
                <span className="font-bold text-white">{pointsNeeded.toLocaleString()}P</span> 더 필요
              </p>
            </div>
          )}
        </div>

        {/* Bet history (self only) */}
        {isMe && myBets.length > 0 && (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
            <div className="px-4 py-3.5 border-b border-oracle-border/60 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-oracle-purple" />
                나의 배팅 내역
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="text-emerald-400 font-bold">{wonBets.length}승</span>
                <span className="text-oracle-hot font-bold">{myBets.filter(b => b.status === "lost").length}패</span>
                <span>{myBets.filter(b => b.status === "pending").length}대기</span>
              </div>
            </div>
            <div className="divide-y divide-oracle-border/40">
              {myBets.map((bet) => {
                const cfg = BET_STATUS_CONFIG[bet.status];
                return (
                  <div key={bet.id} className={clsx("flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-slate-800/30")}>
                    {/* Status icon */}
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", cfg.color, cfg.bg, cfg.border)}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium line-clamp-1">{bet.oracleTitle || "예언"}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className={clsx("font-semibold", cfg.color)}>{cfg.label}</span>
                        <span>·</span>
                        <span>{bet.optionLabel}</span>
                        <span>·</span>
                        <span>{timeAgo(bet.placedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={clsx(
                        "text-sm font-black",
                        bet.status === "won" ? "text-emerald-400" : bet.status === "lost" ? "text-oracle-hot" : "text-slate-500"
                      )}>
                        {bet.status === "won"
                          ? `+${bet.payout ?? bet.amount}P`
                          : bet.status === "lost"
                          ? `-${bet.amount}P`
                          : `${bet.amount}P`}
                      </span>
                      {bet.status === "pending" && <p className="text-[10px] text-slate-600">대기중</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Created oracles */}
        {createdOracles.length > 0 && (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
            <div className="px-4 py-3.5 border-b border-oracle-border/60">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔮</span>
                {isMe ? "내가 만든 예언" : `${user.name}의 예언`}
                <span className="text-xs text-slate-500 font-normal ml-auto">{createdOracles.length}개</span>
              </h2>
            </div>
            <div className="divide-y divide-oracle-border/40">
              {createdOracles.map((o) => (
                <Link
                  key={o.id}
                  href={`/oracle/${o.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-oracle-purple/5 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-oracle-glow transition-colors">{o.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>{o.totalParticipants.toLocaleString()}명</span>
                      <span>·</span>
                      <span>{o.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      o.status === "live"     ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                      o.status === "upcoming" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                                                "bg-slate-600/20 text-slate-500 border-slate-600/25"
                    )}>
                      {o.status === "live" ? "진행중" : o.status === "upcoming" ? "예정" : "종료"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-oracle-purple transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no data */}
        {isMe && myBets.length === 0 && createdOracles.length === 0 && (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card p-8 text-center space-y-3">
            <div className="text-4xl">🔮</div>
            <p className="text-white font-bold">아직 예언 기록이 없어요</p>
            <p className="text-sm text-slate-500">첫 예언에 참여하거나 예언을 만들어보세요!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-oracle-purple hover:text-oracle-glow transition-colors font-medium mt-1"
            >
              예언 보러 가기 →
            </Link>
          </div>
        )}

        <GradeGrid currentPoints={user.points} />
      </div>
    </div>
  );
}
