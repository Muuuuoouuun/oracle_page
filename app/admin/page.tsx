"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, Scroll, Settings, Shield, ArrowLeft,
  TrendingUp, Activity, Coins, UserCheck, Ban, ChevronDown,
  Search, Edit2, Check, X, AlertTriangle, Flame, Zap, Star, Gavel
} from "lucide-react";
import { ADMIN_STATS } from "@/lib/adminData";
import { useGrades, useOracles, useUI, useUser } from "@/lib/context";
import type { GradeId, GradeThresholds } from "@/lib/grades";
import type { OracleStatus, UserProfile } from "@/lib/types";
import GradeBadge from "@/components/GradeBadge";
import OracleResult from "@/components/OracleResult";
import ReviewQueueTab from "@/components/admin/ReviewQueueTab";
import clsx from "clsx";

type AdminTab = "대시보드" | "승인 대기" | "사용자관리" | "예언관리" | "등급설정";

/* ────────────────────────────────────── */
/*  Auth Gate                             */
/* ────────────────────────────────────── */

/**
 * 관리자 확인.
 *
 * Supabase 모드에서는 프로필의 role 로 판정한다 — 비밀번호를 아는 것만으로는
 * 들어올 수 없고, RLS 와 서버 함수가 한 번 더 막는다.
 * 로컬(데모) 모드에는 계정 자체가 없어 비밀번호 게이트를 남겨둔다.
 */
function AdminAuthGate({ onAuth }: { onAuth: () => void }) {
  const { mode } = useUI();
  const { me } = useUser();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === "admin1234") {
      onAuth();
    } else {
      setError(true);
      setPw("");
    }
  };

  /* 서버 모드 — role 로만 판정 */
  if (mode === "supabase") {
    if (me.role === "admin") {
      return (
        <div className="min-h-screen bg-oracle-dark flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="text-5xl">🛡️</div>
            <h1 className="text-xl font-black text-white">{me.name} 님, 반갑습니다</h1>
            <p className="text-sm text-slate-400">관리자 권한이 확인되었습니다.</p>
            <button
              onClick={onAuth}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              관리자 패널 열기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-oracle-dark flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-black text-white">관리자만 볼 수 있는 화면입니다</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            로그인한 계정에 관리자 권한이 없습니다.
            <br />
            권한은 데이터베이스에서만 부여할 수 있습니다.
          </p>
          <div className="rounded-xl bg-slate-800 p-3 text-left text-xs text-slate-400 font-mono overflow-x-auto">
            update profiles set role = &apos;admin&apos;
            <br />
            &nbsp;where id = &apos;{me.id}&apos;;
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> 메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  /* 로컬(데모) 모드 — 계정이 없으므로 비밀번호로 가린다 */
  return (
    <div className="min-h-screen bg-oracle-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🛡️</div>
          <h1 className="text-2xl font-black gradient-text">관리자 로그인</h1>
          <p className="text-sm text-slate-500">Oracle Page Admin Panel</p>
        </div>

        <div className="rounded-xl border border-oracle-trending/30 bg-oracle-trending/10 p-3 text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-oracle-trending">데모 모드</span>입니다. 서버가 연결되면
          이 비밀번호 대신 계정 권한으로 확인합니다.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="관리자 비밀번호"
            className={clsx(
              "w-full bg-oracle-card border rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors",
              error ? "border-oracle-hot" : "border-oracle-border focus:border-oracle-purple"
            )}
            autoFocus
          />
          {error && (
            <p className="text-xs text-oracle-hot flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 비밀번호가 올바르지 않습니다
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            로그인
          </button>
        </form>
        <p className="text-center text-xs text-slate-600">
          힌트: admin1234
        </p>
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────── */
/*  Dashboard Tab                         */
/* ────────────────────────────────────── */
function DashboardTab() {
  const { users } = useUser();
  const { grades, gradeByPoints } = useGrades();
  const stats = ADMIN_STATS;
  const cards = [
    { label: "총 사용자", value: stats.totalUsers.toLocaleString(), sub: `오늘 활성: ${stats.activeToday.toLocaleString()}명`, icon: <Users className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "라이브 예언", value: stats.liveOracles, sub: `총 예언 ${stats.totalOracles}개`, icon: <Flame className="w-5 h-5" />, color: "text-oracle-hot", bg: "bg-oracle-hot/10", border: "border-oracle-hot/20" },
    { label: "오늘 배팅 수", value: stats.totalBetsToday.toLocaleString(), sub: "건", icon: <Activity className="w-5 h-5" />, color: "text-oracle-trending", bg: "bg-oracle-trending/10", border: "border-oracle-trending/20" },
    { label: "유통 포인트", value: (stats.totalPointsCirculating / 10000).toFixed(0) + "만P", sub: "총 유통량", icon: <Coins className="w-5 h-5" />, color: "text-oracle-glow", bg: "bg-oracle-glow/10", border: "border-oracle-glow/20" },
    { label: "신규 가입", value: `+${stats.newUsersThisWeek}명`, sub: "이번 주", icon: <UserCheck className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "평균 적중률", value: `${stats.avgAccuracy}%`, sub: "전체 유저", icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  // Grade distribution — 높은 등급이 위로 오도록 rank 내림차순
  const activeUsers = users.filter((u) => !u.isBanned);
  const gradeDistribution = [...grades]
    .sort((a, b) => b.rank - a.rank)
    .map((g) => ({
      grade: g,
      count: activeUsers.filter((u) => gradeByPoints(u.points).id === g.id).length,
    }));
  // 막대는 가장 인원이 많은 등급을 100% 로 두고 상대 비교한다.
  const maxCount = Math.max(1, ...gradeDistribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={clsx("rounded-xl border p-3 space-y-1", card.bg, card.border)}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{card.label}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className={clsx("text-xl font-black", card.color)}>{card.value}</p>
            <p className="text-xs text-slate-600">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      <div className="rounded-xl border border-oracle-border bg-oracle-card p-4 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-oracle-trending" /> 등급 분포
        </h3>
        <div className="space-y-2">
          {gradeDistribution.map(({ grade, count }) => (
            <div key={grade.id} className="flex items-center gap-2">
              <span className="text-base w-6 text-center">{grade.emoji}</span>
              <span className={clsx("text-xs font-medium w-16", grade.color)}>{grade.name}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: grade.glowColor,
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{count}명</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────── */
/*  User Management Tab                   */
/* ────────────────────────────────────── */
function UserManagementTab() {
  // 유저 목록은 전역 상태를 그대로 쓴다. 여기서 수정하면 로그인한 "나"에게도 실제로 반영된다.
  const { users, updateUser, toggleBan } = useUser();
  const { grades, gradeByPoints } = useGrades();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<GradeId>("magikarp");
  const [editPoints, setEditPoints] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "banned" | "admin">("all");

  const filtered = users.filter((u) => {
    if (filter === "banned" && !u.isBanned) return false;
    if (filter === "admin" && u.role !== "admin") return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setEditGrade(user.gradeId);
    setEditPoints(user.points);
  };

  const saveEdit = (userId: string) => {
    const points = Math.max(0, Math.round(editPoints));
    updateUser(userId, {
      points,
      gradeId: editGrade,
      // 포인트 기반 자동 등급과 다르면 "수동 지정"으로 표시하고, 이후 자동 재계산에서 제외한다.
      gradeOverride: gradeByPoints(points).id !== editGrade,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="유저 검색..."
            className="w-full bg-oracle-card border border-oracle-border rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="bg-oracle-card border border-oracle-border rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">전체</option>
          <option value="banned">제재됨</option>
          <option value="admin">관리자</option>
        </select>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map((user) => {
          const autoGrade = gradeByPoints(user.points);
          const isEditing = editingId === user.id;

          return (
            <div
              key={user.id}
              className={clsx(
                "rounded-xl border p-3 space-y-2 transition-all",
                user.isBanned
                  ? "bg-red-500/5 border-red-500/20"
                  : isEditing
                  ? "bg-oracle-purple/5 border-oracle-purple/40"
                  : "bg-oracle-card border-oracle-border"
              )}
            >
              {/* User header */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{user.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-white">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="text-[10px] bg-oracle-purple/20 text-oracle-purple border border-oracle-purple/30 px-1.5 py-0.5 rounded-full font-bold">
                        ADMIN
                      </span>
                    )}
                    {user.isBanned && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        BAN
                      </span>
                    )}
                    <GradeBadge gradeId={user.gradeId} size="xs" isOverride={user.gradeOverride} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{user.points.toLocaleString()}P</span>
                    <span>·</span>
                    <span>적중률 {user.accuracy}%</span>
                    <span>·</span>
                    <span>{user.totalBets}건</span>
                  </div>
                </div>

                {/* Actions */}
                {!isEditing ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-oracle-purple/30 text-slate-400 hover:text-oracle-purple transition-colors"
                      title="등급/포인트 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => toggleBan(user.id)}
                        className={clsx(
                          "p-1.5 rounded-lg transition-colors",
                          user.isBanned
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                        )}
                        title={user.isBanned ? "제재 해제" : "제재"}
                      >
                        {user.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => saveEdit(user.id)}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="space-y-3 pt-2 border-t border-oracle-border">
                  {/* Points edit */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">포인트 조정</label>
                    <input
                      type="number"
                      value={editPoints}
                      onChange={(e) => setEditPoints(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-oracle-purple"
                    />
                    <p className="text-xs text-slate-600">
                      자동 등급: {autoGrade.emoji} {autoGrade.name}
                    </p>
                  </div>

                  {/* Grade override */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      등급 수동 지정 <span className="text-oracle-hot">★ 관리자 오버라이드</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grades.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setEditGrade(g.id)}
                          className={clsx(
                            "flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all",
                            editGrade === g.id
                              ? [g.bgColor, g.borderColor, g.color]
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                          )}
                        >
                          <span>{g.emoji}</span>
                          <span>{g.name}</span>
                          {editGrade === g.id && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      ))}
                    </div>
                    {editGrade !== gradeByPoints(editPoints).id && (
                      <p className="text-xs text-oracle-hot flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        포인트 기반 등급과 다른 등급이 지정됩니다 (★ 표시)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Ban reason */}
              {user.isBanned && user.banReason && (
                <p className="text-xs text-red-400/70 flex items-center gap-1">
                  <Ban className="w-3 h-3" /> {user.banReason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────── */
/*  Oracle Management Tab                 */
/* ────────────────────────────────────── */
function OracleManagementTab() {
  const { oracles, updateOracle, closeOracle } = useOracles();
  const [search, setSearch] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);
  const [resultOracleId, setResultOracleId] = useState<string | null>(null);

  /**
   * 상태 배지를 눌러 순환시킨다.
   * 결과 확정(정답 선택)은 여기서도 할 수 있지만, 마감된 예언은
   * "승인 대기" 탭에서 배팅 분포를 보고 처리하는 쪽이 낫다.
   */
  const cycleStatus = (id: string, current: OracleStatus) => {
    if (current === "live") {
      setClosingId(id); // 정답 선택으로
      return;
    }
    if (current === "awaiting") {
      setClosingId(id);
      return;
    }
    // 종료·무효된 예언을 다시 열면 이전 정답은 지운다.
    const next: OracleStatus = current === "upcoming" ? "live" : "upcoming";
    updateOracle(id, { status: next, winningOptionId: undefined });
    setResultOracleId((prev) => (prev === id ? null : prev));
  };

  const handleSetWinner = (oracleId: string, optionId: string) => {
    closeOracle(oracleId, optionId);
    setClosingId(null);
    setResultOracleId(oracleId);
  };

  const filtered = oracles.filter(
    (o) => !search || o.title.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLORS: Record<OracleStatus, string> = {
    live: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    awaiting: "bg-oracle-trending/20 text-oracle-trending border-oracle-trending/40",
    closed: "bg-slate-600/30 text-slate-500 border-slate-600/30",
    voided: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const STATUS_LABELS: Record<OracleStatus, string> = {
    live: "진행중",
    upcoming: "예정",
    awaiting: "결과 대기",
    closed: "종료",
    voided: "무효",
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="예언 검색..."
          className="w-full bg-oracle-card border border-oracle-border rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((oracle) => {
          const isClosing = closingId === oracle.id;
          const showResult = resultOracleId === oracle.id;
          const resultOption = oracle.options.find((o) => o.id === oracle.winningOptionId);

          return (
            <div key={oracle.id} className={clsx(
              "rounded-xl border bg-oracle-card p-3 space-y-2 transition-all",
              isClosing ? "border-oracle-trending/50 bg-oracle-trending/5" : "border-oracle-border"
            )}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{oracle.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{oracle.category}</span>
                    <span>·</span>
                    <span>{oracle.totalParticipants.toLocaleString()}명</span>
                    <span>·</span>
                    <span>{oracle.totalPool.toLocaleString()}P</span>
                  </div>
                </div>
                <button
                  onClick={() => cycleStatus(oracle.id, oracle.status)}
                  className={clsx(
                    "shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border transition-all",
                    STATUS_COLORS[oracle.status]
                  )}
                >
                  {STATUS_LABELS[oracle.status]}
                </button>
              </div>

              {/* Winner selection on close */}
              {isClosing && (
                <div className="space-y-2 p-3 rounded-xl bg-oracle-trending/10 border border-oracle-trending/30">
                  <p className="text-xs font-bold text-oracle-trending">정답 옵션을 선택하세요</p>
                  {oracle.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSetWinner(oracle.id, opt.id)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-oracle-trending/60 text-sm text-white transition-colors flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      <span className="text-xs text-slate-500">{opt.percentage}% · {opt.totalBets.toLocaleString()}명</span>
                    </button>
                  ))}
                  <button onClick={() => setClosingId(null)} className="text-xs text-slate-500 hover:text-white">취소</button>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-2 pt-1 border-t border-oracle-border">
                <button
                  onClick={() => updateOracle(oracle.id, { isHot: !oracle.isHot })}
                  className={clsx(
                    "flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all",
                    oracle.isHot
                      ? "bg-oracle-hot/20 border-oracle-hot/40 text-oracle-hot"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-oracle-hot/30"
                  )}
                >
                  <Flame className="w-3 h-3" /> HOT
                </button>
                <button
                  onClick={() => updateOracle(oracle.id, { isTrending: !oracle.isTrending })}
                  className={clsx(
                    "flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all",
                    oracle.isTrending
                      ? "bg-oracle-trending/20 border-oracle-trending/40 text-oracle-trending"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-oracle-trending/30"
                  )}
                >
                  <TrendingUp className="w-3 h-3" /> 트렌딩
                </button>
                <div className="ml-auto text-xs text-slate-600">by {oracle.creatorName}</div>
              </div>

              {/* Result preview — 관리자가 실제로 고른 정답을 그대로 보여준다 */}
              {showResult && resultOption && (
                <OracleResult oracle={oracle} winningOption={resultOption} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────── */
/*  Grade Settings Tab                    */
/* ────────────────────────────────────── */
function GradeSettingsTab() {
  const { grades, thresholds, saveThresholds } = useGrades();
  // 편집 중인 값은 로컬에 두고, "저장"을 눌러야 전역에 반영한다.
  const [draft, setDraft] = useState<GradeThresholds>(thresholds);
  const [saved, setSaved] = useState(false);

  const update = (id: GradeId, value: number) => {
    setDraft((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveThresholds(draft);
    setSaved(true);
  };

  const isDirty = grades.some((g) => (draft[g.id] ?? g.minPoints) !== thresholds[g.id]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-oracle-border bg-oracle-card p-4 space-y-1">
        <p className="text-sm font-bold text-white">등급 승급 기준 포인트</p>
        <p className="text-xs text-slate-500">각 등급의 최소 포인트 기준을 설정합니다. 변경 시 즉시 적용됩니다.</p>
      </div>

      <div className="space-y-3">
        {grades.map((grade, idx) => {
          return (
            <div key={grade.id} className={clsx("rounded-xl border p-4 space-y-3", grade.bgColor, grade.borderColor)}>
              {/* Grade info */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{grade.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={clsx("font-black text-base", grade.color)}>{grade.name}</span>
                    <span className="text-xs text-slate-500">Lv.{grade.rank}</span>
                  </div>
                  <p className={clsx("text-xs", grade.color, "opacity-70")}>{grade.title}</p>
                </div>
              </div>

              {/* Threshold input */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">최소 포인트</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={idx === 0 ? 0 : draft[grade.id] ?? grade.minPoints}
                    onChange={(e) => update(grade.id, Number(e.target.value))}
                    disabled={idx === 0}
                    className={clsx(
                      "flex-1 bg-slate-800/50 border rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors",
                      "border-slate-700 focus:border-oracle-purple",
                      idx === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    min={0}
                  />
                  <span className="text-xs text-slate-500 shrink-0">P 이상</span>
                </div>
                {idx === 0 && <p className="text-xs text-slate-600">최하위 등급은 0P로 고정됩니다</p>}
              </div>

              {/* Perks display */}
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">포함 혜택</p>
                <div className="flex flex-wrap gap-1">
                  {grade.perks.map((perk) => (
                    <span key={perk} className={clsx("text-[10px] px-2 py-0.5 rounded-full", grade.bgColor, grade.color, "border", grade.borderColor)}>
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={!isDirty && saved}
        className={clsx(
          "w-full py-3 rounded-xl font-bold text-sm transition-all",
          saved && !isDirty
            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
            : "bg-gradient-to-r from-oracle-purple to-oracle-glow text-white hover:opacity-90"
        )}
      >
        {saved && !isDirty ? "✓ 저장 완료 — 등급이 즉시 재계산되었습니다" : "변경사항 저장"}
      </button>
    </div>
  );
}

/* ────────────────────────────────────── */
/*  Main Admin Page                       */
/* ────────────────────────────────────── */
export default function AdminPage() {
  const { awaitingOracles } = useOracles();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("대시보드");

  if (!authed) {
    return <AdminAuthGate onAuth={() => setAuthed(true)} />;
  }

  const TABS: { key: AdminTab; icon: React.ReactNode }[] = [
    { key: "대시보드", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "승인 대기", icon: <Gavel className="w-4 h-4" /> },
    { key: "사용자관리", icon: <Users className="w-4 h-4" /> },
    { key: "예언관리", icon: <Scroll className="w-4 h-4" /> },
    { key: "등급설정", icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-oracle-dark/90 backdrop-blur-md border-b border-oracle-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-oracle-purple" />
            <div>
              <h1 className="text-base font-black text-white leading-none">관리자 패널</h1>
              <p className="text-xs text-slate-500">Oracle Page Admin</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 메인으로
          </Link>
        </div>

        {/* Tab nav */}
        <div className="flex border-t border-oracle-border overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.key
                  ? "border-oracle-purple text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-white"
              )}
            >
              {tab.icon}
              {tab.key}
              {tab.key === "승인 대기" && awaitingOracles.length > 0 && (
                <span className="ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-oracle-hot text-white">
                  {awaitingOracles.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {activeTab === "대시보드" && <DashboardTab />}
        {activeTab === "승인 대기" && <ReviewQueueTab />}
        {activeTab === "사용자관리" && <UserManagementTab />}
        {activeTab === "예언관리" && <OracleManagementTab />}
        {activeTab === "등급설정" && <GradeSettingsTab />}
      </main>
    </div>
  );
}
