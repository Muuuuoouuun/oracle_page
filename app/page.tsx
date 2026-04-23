"use client";

import { useState } from "react";
import { Sparkles, Bell, Home, TrendingUp, Users, Plus, Flame, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { Oracle } from "@/lib/types";
import { useOracles, useUser } from "@/lib/context";
import { getNextGradeProgress } from "@/lib/grades";
import CommunityFeed from "@/components/CommunityFeed";
import QuickBetStrip from "@/components/QuickBetStrip";
import RecommendationPanel from "@/components/RecommendationPanel";
import LeaderBoard from "@/components/LeaderBoard";
import OracleCard from "@/components/OracleCard";
import GradeBadge from "@/components/GradeBadge";
import GradeCard, { GradeGrid } from "@/components/GradeCard";
import CreateOracleModal from "@/components/CreateOracleModal";
import NotificationPanel from "@/components/NotificationPanel";
import OnboardingModal from "@/components/OnboardingModal";
import DailyBonus from "@/components/DailyBonus";
import clsx from "clsx";

type Tab = "홈" | "커뮤니티" | "랭킹";

export default function OraclePage() {
  const { oracles } = useOracles();
  const { me, notifications } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("홈");
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("oracle_onboarded");
  });
  const [showDailyBonus, setShowDailyBonus] = useState(() => {
    if (typeof window === "undefined") return false;
    const last = localStorage.getItem("oracle_daily_bonus");
    return !last || new Date(last).toDateString() !== new Date().toDateString();
  });

  const handleOnboardingClose = () => {
    localStorage.setItem("oracle_onboarded", "1");
    setShowOnboarding(false);
    // show daily bonus after onboarding
    const last = localStorage.getItem("oracle_daily_bonus");
    if (!last || new Date(last).toDateString() !== new Date().toDateString()) {
      setShowDailyBonus(true);
    }
  };

  const handleDailyBonusClose = () => {
    localStorage.setItem("oracle_daily_bonus", new Date().toISOString());
    setShowDailyBonus(false);
  };

  const { current: myGrade } = getNextGradeProgress(me.points);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hotOracles = oracles.filter((o) => o.isHot);
  const trendingOracles = oracles.filter((o) => o.isTrending);

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
            <Link href={`/profile/me`} className="flex items-center gap-1.5">
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
          {(["홈", "커뮤니티", "랭킹"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "flex-1 py-2.5 text-sm font-medium transition-all border-b-2",
                activeTab === tab
                  ? "border-oracle-purple text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-white"
              )}
            >
              {tab === "홈" && <Home className="w-4 h-4 inline mr-1" />}
              {tab === "커뮤니티" && <Users className="w-4 h-4 inline mr-1" />}
              {tab === "랭킹" && <TrendingUp className="w-4 h-4 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 space-y-6">
        {activeTab === "홈" && (
          <HomeTab oracles={oracles} hotOracles={hotOracles} trendingOracles={trendingOracles} myPoints={me.points} />
        )}
        {activeTab === "커뮤니티" && <CommunityFeed oracles={oracles} />}
        {activeTab === "랭킹" && <RankingTab myPoints={me.points} myAccuracy={me.accuracy} myBets={me.totalBets} />}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow shadow-lg shadow-oracle-purple/40 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all animate-glow z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Modals */}
      {showCreate && <CreateOracleModal onClose={() => setShowCreate(false)} />}
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      {!showOnboarding && showDailyBonus && <DailyBonus onClose={handleDailyBonusClose} />}
    </div>
  );
}

function HomeTab({ oracles, hotOracles, trendingOracles, myPoints }: {
  oracles: Oracle[];
  hotOracles: Oracle[];
  trendingOracles: Oracle[];
  myPoints: number;
}) {
  return (
    <div className="space-y-6">
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

      <GradeCard points={myPoints} />
      <QuickBetStrip oracles={[...hotOracles, ...trendingOracles].slice(0, 6)} />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-oracle-hot" />
          <h2 className="text-sm font-bold text-white">지금 핫한 예언</h2>
        </div>
        {hotOracles.map((oracle) => (
          <OracleCard key={oracle.id} oracle={oracle} />
        ))}
      </div>

      <RecommendationPanel oracles={oracles} />
    </div>
  );
}

function RankingTab({ myPoints, myAccuracy, myBets }: {
  myPoints: number; myAccuracy: number; myBets: number;
}) {
  const { current: myGrade } = getNextGradeProgress(myPoints);
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
