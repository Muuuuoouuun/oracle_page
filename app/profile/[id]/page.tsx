"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Target, Coins, Calendar, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
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

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me, myBets } = useUser();
  const { oracles } = useOracles();

  // Determine which user to show
  const isMe = id === "me" || id === me.id;
  const user: UserProfile | undefined = isMe
    ? me
    : MOCK_USERS.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-5xl">👤</p>
        <p className="text-white font-bold">유저를 찾을 수 없어요</p>
        <Link href="/" className="text-oracle-purple text-sm">← 돌아가기</Link>
      </div>
    );
  }

  const grade = getGradeByPoints(user.points);
  const { next, progress, pointsNeeded } = getNextGradeProgress(user.points);
  const wonBets = isMe ? myBets.filter((b) => b.status === "won") : [];
  const lostBets = isMe ? myBets.filter((b) => b.status === "lost") : [];
  const pendingBets = isMe ? myBets.filter((b) => b.status === "pending") : [];
  const accuracy = isMe
    ? myBets.length > 0 ? Math.round((wonBets.length / myBets.filter(b => b.status !== "pending").length || 0) * 100) : 0
    : user.accuracy;

  const createdOracles = isMe
    ? oracles.filter((o) => o.creatorName === me.name)
    : oracles.filter((o) => o.creatorName === user.name);

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/80 backdrop-blur-md border-b border-oracle-border px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <p className="text-sm font-bold text-white">{isMe ? "나의 프로필" : user.name}</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Profile header */}
        <div
          className={clsx("rounded-2xl border p-5 space-y-4", grade.bgColor, grade.borderColor)}
          style={{ boxShadow: `0 0 24px ${grade.glowColor}` }}
        >
          <div className="flex items-center gap-4">
            <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2", grade.bgColor, grade.borderColor)}>
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-white">{user.name}</h1>
                {user.role === "admin" && (
                  <span className="text-[10px] bg-oracle-purple/20 text-oracle-purple border border-oracle-purple/30 px-1.5 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <GradeBadge gradeId={grade.id} size="sm" showTitle isOverride={user.gradeOverride} />
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {formatDate(user.joinedAt)} 가입
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "포인트", value: `${user.points.toLocaleString()}P`, icon: <Coins className="w-3.5 h-3.5" />, color: "text-oracle-glow" },
              { label: "적중률", value: accuracy > 0 ? `${accuracy}%` : "—", icon: <Target className="w-3.5 h-3.5" />, color: "text-oracle-trending" },
              { label: "총 배팅", value: `${isMe ? myBets.length : user.totalBets}건`, icon: <Trophy className="w-3.5 h-3.5" />, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="text-center bg-slate-900/40 rounded-xl p-3">
                <div className={clsx("flex justify-center mb-1", s.color)}>{s.icon}</div>
                <p className={clsx("text-base font-black", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Grade progress */}
          {next && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">다음 등급: <span className="text-white font-bold">{next.emoji} {next.name}</span></span>
                <span className={clsx("font-bold", grade.color)}>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: `linear-gradient(to right, ${grade.glowColor}, ${next.glowColor ?? grade.glowColor})` }}
                />
              </div>
              <p className="text-xs text-slate-600">{pointsNeeded.toLocaleString()}P 더 필요</p>
            </div>
          )}
        </div>

        {/* My bet history (only for self) */}
        {isMe && myBets.length > 0 && (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
            <div className="px-4 py-3 border-b border-oracle-border">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-oracle-purple" />
                나의 배팅 내역
              </h2>
            </div>
            <div className="divide-y divide-oracle-border">
              {myBets.map((bet) => (
                <div key={bet.id} className="flex items-center gap-3 px-4 py-3">
                  {bet.status === "won" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {bet.status === "lost" && <XCircle className="w-4 h-4 text-oracle-hot shrink-0" />}
                  {bet.status === "pending" && <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1">{bet.oracleTitle}</p>
                    <p className="text-xs text-slate-500">
                      {bet.optionLabel} · {bet.amount.toLocaleString()}P · {timeAgo(bet.placedAt)}
                    </p>
                  </div>
                  <span className={clsx(
                    "text-xs font-bold shrink-0",
                    bet.status === "won" ? "text-emerald-400" : bet.status === "lost" ? "text-oracle-hot" : "text-slate-500"
                  )}>
                    {bet.status === "won" ? `+${bet.payout ?? bet.amount}P` : bet.status === "lost" ? `-${bet.amount}P` : "진행중"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created oracles */}
        {createdOracles.length > 0 && (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card overflow-hidden">
            <div className="px-4 py-3 border-b border-oracle-border">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔮</span> {isMe ? "내가 만든 예언" : `${user.name}의 예언`}
              </h2>
            </div>
            <div className="divide-y divide-oracle-border">
              {createdOracles.map((o) => (
                <Link key={o.id} href={`/oracle/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-oracle-purple/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.totalParticipants.toLocaleString()}명 · {o.category}</p>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                    o.status === "live" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    o.status === "upcoming" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-slate-600/30 text-slate-500 border-slate-600/30"
                  )}>
                    {o.status === "live" ? "진행중" : o.status === "upcoming" ? "예정" : "종료"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grade roadmap */}
        <GradeGrid currentPoints={user.points} />
      </div>
    </div>
  );
}
