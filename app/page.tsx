"use client";

import { useState } from "react";
import {
  Sparkles, Bell, Home, TrendingUp, Users, Plus, Flame, Zap, Shield,
  Ticket, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useGrades, useOracles, useUI, useUser } from "@/lib/context";
import type { Oracle } from "@/lib/types";
import CommunityFeed from "@/components/CommunityFeed";
import QuickBetStrip from "@/components/QuickBetStrip";
import RecommendationPanel from "@/components/RecommendationPanel";
import LeaderBoard from "@/components/LeaderBoard";
import OracleCard from "@/components/OracleCard";
import GradeBadge from "@/components/GradeBadge";
import GradeCard, { GradeGrid } from "@/components/GradeCard";
import CreateOracleModal from "@/components/CreateOracleModal";
import NotificationPanel from "@/components/NotificationPanel";
import OnboardingCard from "@/components/OnboardingCard";
import DailyBonusCard from "@/components/DailyBonusCard";
import ClosingSoonStrip from "@/components/ClosingSoonStrip";
import ActivityTicker from "@/components/ActivityTicker";
import StreakBadge from "@/components/StreakBadge";
import clsx from "clsx";

type Tab = "홈" | "내 예언" | "커뮤니티" | "랭킹";

const TABS: { key: Tab; icon: React.ReactNode }[] = [
  { key: "홈", icon: <Home className="w-4 h-4" /> },
  { key: "내 예언", icon: <Ticket className="w-4 h-4" /> },
  { key: "커뮤니티", icon: <Users className="w-4 h-4" /> },
  { key: "랭킹", icon: <TrendingUp className="w-4 h-4" /> },
];

export default function OraclePage() {
  const { oracles } = useOracles();
  const { me, myBets, notifications } = useUser();
  const { gradeByPoints } = useGrades();
  const { tagFilter, setTagFilter } = useUI();
  const [selectedTab, setSelectedTab] = useState<Tab>("홈");
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const myGrade = gradeByPoints(me.points);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hotOracles = oracles.filter((o) => o.isHot && o.status !== "closed");
  const trendingOracles = oracles.filter((o) => o.isTrending && o.status !== "closed");
  const pendingCount = myBets.filter((b) => b.status === "pending").length;

  // 태그를 누르면 커뮤니티 피드로 데려간다 (필터가 걸린 곳이 거기라서).
  // state 를 또 만들지 않고 파생시킨다.
  const activeTab: Tab = tagFilter ? "커뮤니티" : selectedTab;
  const handleTabClick = (tab: Tab) => {
    if (tagFilter) setTagFilter(null);
    setSelectedTab(tab);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-oracle-dark/80 backdrop-blur-md border-b border-oracle-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <div>
              <h1 className="text-base font-black gradient-text leading-none">Oracle Page</h1>
              <p className="text-xs text-slate-500">당신은 예언가입니까?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile/me" className="flex items-center gap-1.5">
              <GradeBadge gradeId={myGrade.id} size="xs" />
              <div className="flex items-center gap-1 bg-oracle-card border border-oracle-border rounded-full px-2.5 py-1">
                <Zap className="w-3 h-3 text-oracle-trending" />
                <span className="text-xs font-bold text-white">{me.points.toLocaleString()}P</span>
              </div>
            </Link>
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`알림 ${unreadCount}개`}
                className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-oracle-hot text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
            <Link
              href="/admin"
              className="w-8 h-8 rounded-full bg-oracle-purple/20 border border-oracle-purple/50 flex items-center justify-center text-oracle-glow hover:bg-oracle-purple/30 transition-colors"
              title="관리자 페이지"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-t border-oracle-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={clsx(
                "flex-1 py-2.5 text-sm font-medium transition-all border-b-2 relative",
                activeTab === tab.key
                  ? "border-oracle-purple text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-white"
              )}
            >
              <span className="inline-flex items-center gap-1">
                {tab.icon}
                {tab.key}
                {tab.key === "내 예언" && pendingCount > 0 && (
                  <span className="ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-oracle-hot text-white">
                    {pendingCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 space-y-6">
        {activeTab === "홈" && (
          <HomeTab
            oracles={oracles}
            hotOracles={hotOracles}
            trendingOracles={trendingOracles}
            myPoints={me.points}
          />
        )}
        {activeTab === "내 예언" && <MyBetsTab />}
        {activeTab === "커뮤니티" && <CommunityFeed oracles={oracles} />}
        {activeTab === "랭킹" && (
          <RankingTab myPoints={me.points} myAccuracy={me.accuracy} myBets={me.totalBets} />
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        aria-label="새 예언 만들기"
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow shadow-lg shadow-oracle-purple/40 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all animate-glow z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Modals */}
      {showCreate && <CreateOracleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function HomeTab({ oracles, hotOracles, trendingOracles, myPoints }: {
  oracles: Oracle[];
  hotOracles: Oracle[];
  trendingOracles: Oracle[];
  myPoints: number;
}) {
  const newOracles = [...oracles]
    .filter((o) => o.isNew && o.status !== "closed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <OnboardingCard />

      <div className="rounded-2xl bg-gradient-to-r from-oracle-violet to-oracle-purple p-5 space-y-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative">
          <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">오늘의 예언</p>
          <h2 className="text-xl font-black text-white mt-1">당신의 직감을 믿으세요 🔮</h2>
          <p className="text-sm text-purple-200 mt-1">
            지금 <span className="font-bold text-white">{(12847 + oracles.filter(o => o.isNew).length * 23).toLocaleString()}명</span>이 예언 중
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
              <Flame className="w-3 h-3 text-orange-300" />
              HOT 예언 {hotOracles.length}개
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              신규 {oracles.filter(o => o.isNew).length}개
            </div>
          </div>
        </div>
      </div>

      <DailyBonusCard />
      <ClosingSoonStrip oracles={oracles} />
      <GradeCard points={myPoints} />
      <QuickBetStrip oracles={[...hotOracles, ...trendingOracles].slice(0, 6)} />
      <ActivityTicker />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-oracle-hot" />
          <h2 className="text-sm font-bold text-white">지금 핫한 예언</h2>
        </div>
        {hotOracles.map((oracle) => (
          <OracleCard key={oracle.id} oracle={oracle} />
        ))}
      </div>

      {/* 갓 올라온 예언 — 내가 방금 만든 예언도 여기서 바로 보인다 */}
      {newOracles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-oracle-glow" />
            <h2 className="text-sm font-bold text-white">새로 올라온 예언</h2>
          </div>
          {newOracles.map((oracle) => (
            <OracleCard key={oracle.id} oracle={oracle} />
          ))}
        </div>
      )}

      <RecommendationPanel oracles={oracles} />
    </div>
  );
}

/** 진행 중인 배팅과 최근 결과를 한 화면에 모은다. */
function MyBetsTab() {
  const { myBets, me } = useUser();
  const { oracles } = useOracles();

  const pending = myBets.filter((b) => b.status === "pending");
  const decided = myBets.filter((b) => b.status !== "pending");
  const created = oracles.filter((o) => o.creatorName === me.name);

  if (myBets.length === 0 && created.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-4xl">🎫</p>
        <p className="text-white font-bold">아직 참여한 예언이 없어요</p>
        <p className="text-sm text-slate-500">
          홈에서 “곧 결과가 나옵니다”의 예언부터 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "진행 중", value: `${pending.length}건`, color: "text-oracle-glow" },
          { label: "적중률", value: me.accuracy > 0 ? `${me.accuracy}%` : "—", color: "text-oracle-trending" },
          { label: "연승", value: `${me.currentStreak}`, color: "text-oracle-hot" },
        ].map((s) => (
          <div key={s.label} className="text-center bg-oracle-card border border-oracle-border rounded-xl p-3">
            <p className={clsx("text-lg font-black", s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <StreakBadge current={me.currentStreak} best={me.bestStreak} />

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-oracle-glow" /> 결과를 기다리는 중
          </h2>
          {pending.map((bet) => {
            const oracle = oracles.find((o) => o.id === bet.oracleId);
            return oracle ? <OracleCard key={bet.id} oracle={oracle} /> : null;
          })}
        </section>
      )}

      {decided.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 지난 결과
          </h2>
          <div className="rounded-2xl border border-oracle-border bg-oracle-card divide-y divide-oracle-border overflow-hidden">
            {decided.slice(0, 12).map((bet) => (
              <Link
                key={bet.id}
                href={`/oracle/${bet.oracleId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-oracle-purple/5 transition-colors"
              >
                {bet.status === "won" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-oracle-hot shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium line-clamp-1">{bet.oracleTitle}</p>
                  <p className="text-xs text-slate-500">
                    {bet.optionLabel} · {bet.amount.toLocaleString()}P
                  </p>
                </div>
                <span
                  className={clsx(
                    "text-xs font-bold shrink-0",
                    bet.status === "won" ? "text-emerald-400" : "text-oracle-hot"
                  )}
                >
                  {bet.status === "won"
                    ? `+${(bet.payout ?? 0).toLocaleString()}P`
                    : `-${bet.amount.toLocaleString()}P`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {created.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🔮</span> 내가 만든 예언
          </h2>
          <div className="rounded-2xl border border-oracle-border bg-oracle-card divide-y divide-oracle-border overflow-hidden">
            {created.map((o) => (
              <Link
                key={o.id}
                href={`/oracle/${o.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-oracle-purple/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium line-clamp-1">{o.title}</p>
                  <p className="text-xs text-slate-500">
                    {o.totalParticipants.toLocaleString()}명 · {o.category}
                  </p>
                </div>
                <span
                  className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                    o.status === "live"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : o.status === "upcoming"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-slate-600/30 text-slate-500 border-slate-600/30"
                  )}
                >
                  {o.status === "live" ? "진행중" : o.status === "upcoming" ? "예정" : "종료"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RankingTab({ myPoints, myAccuracy, myBets }: {
  myPoints: number; myAccuracy: number; myBets: number;
}) {
  return (
    <div className="space-y-4">
      <GradeCard points={myPoints} />
      <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4 space-y-3">
        <p className="text-sm font-bold text-white">나의 예언 통계</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "총 포인트", value: `${myPoints.toLocaleString()}P`, color: "text-oracle-glow" },
            { label: "적중률", value: myAccuracy > 0 ? `${myAccuracy}%` : "—", color: "text-oracle-trending" },
            { label: "참여 예언", value: `${myBets}개`, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="text-center bg-slate-800/50 rounded-xl p-3">
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <LeaderBoard />
      <GradeGrid currentPoints={myPoints} />
    </div>
  );
}
