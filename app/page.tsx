"use client";

import { useState, useEffect } from "react";
import { Sparkles, Bell, Home, TrendingUp, Users, Plus, Flame, Zap, Shield, Star, ChevronRight } from "lucide-react";
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

  const TAB_CONFIG = [
    { key: "홈" as Tab,      icon: <Home className="w-4 h-4" />,        label: "홈" },
    { key: "커뮤니티" as Tab, icon: <Users className="w-4 h-4" />,       label: "커뮤니티" },
    { key: "랭킹" as Tab,     icon: <TrendingUp className="w-4 h-4" />,  label: "랭킹" },
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-oracle-dark/85 backdrop-blur-xl border-b border-oracle-border/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-float">🔮</span>
            <div>
              <h1 className="text-base font-black gradient-text leading-none">Oracle Page</h1>
              <p className="text-[11px] text-slate-500 font-medium">당신은 예언가입니까?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Points badge */}
            <Link href="/profile/me" className="flex items-center gap-1.5 group">
              <GradeBadge gradeId={myGrade.id} size="xs" />
              <div className="flex items-center gap-1 bg-oracle-card border border-oracle-border rounded-full px-2.5 py-1 group-hover:border-oracle-purple/50 transition-colors">
                <Zap className="w-3 h-3 text-oracle-trending" />
                <span className="text-xs font-bold text-white">{me.points.toLocaleString()}P</span>
              </div>
            </Link>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white hover:border-oracle-border/80 transition-all relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-oracle-hot text-white text-[9px] font-black flex items-center justify-center shadow-hot-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Admin link */}
            <Link
              href="/admin"
              className="w-8 h-8 rounded-full bg-oracle-purple/15 border border-oracle-purple/40 flex items-center justify-center text-oracle-glow hover:bg-oracle-purple/25 hover:border-oracle-purple/60 transition-all"
              title="관리자 페이지"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-t border-oracle-border/50">
          {TAB_CONFIG.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all border-b-2",
                activeTab === key
                  ? "border-oracle-purple text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {icon}
              {label}
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
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full btn-oracle flex items-center justify-center hover:opacity-90 active:scale-95 transition-all animate-glow z-30"
      >
        <Plus className="w-6 h-6 text-white relative z-10" />
      </button>

      {/* Modals */}
      {showCreate && <CreateOracleModal onClose={() => setShowCreate(false)} />}
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
      {!showOnboarding && showDailyBonus && <DailyBonus onClose={handleDailyBonusClose} />}
    </div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function HomeTab({ oracles, hotOracles, trendingOracles, myPoints }: {
  oracles: Oracle[];
  hotOracles: Oracle[];
  trendingOracles: Oracle[];
  myPoints: number;
}) {
  const activeOracles = oracles.filter(o => o.isNew).length;
  const participantTarget = 12847 + activeOracles * 23;
  const liveCount = useCountUp(participantTarget, 1500);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-oracle-violet via-oracle-purple to-[#5B21B6]" />
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />
        {/* Glow orbs */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-oracle-glow/30 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-oracle-hot/20 blur-2xl" />

        <div className="relative p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-purple-200 uppercase tracking-widest">오늘의 예언</p>
              <h2 className="text-xl font-black text-white leading-tight">
                당신의 직감을<br />믿으세요 🔮
              </h2>
            </div>
            <div className="text-4xl animate-float">{/* decorative emoji removed - clean design */}</div>
          </div>

          <p className="text-sm text-purple-200">
            지금{" "}
            <span className="font-black text-white text-glow tabular-nums">
              {liveCount.toLocaleString()}명
            </span>
            이 예언 중
          </p>

          {/* Stat chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-semibold border border-white/10">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              HOT {hotOracles.length}개
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              신규 {activeOracles}개
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-semibold border border-white/10">
              <Star className="w-3.5 h-3.5 text-purple-300" />
              전체 {oracles.length}개
            </div>
          </div>
        </div>
      </div>

      <GradeCard points={myPoints} />

      {/* Category quick-access */}
      <CategoryChips />

      <QuickBetStrip oracles={[...hotOracles, ...trendingOracles].slice(0, 6)} />

      {/* Hot oracles section */}
      {hotOracles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-oracle-hot" />
              <h2 className="text-sm font-bold text-white">지금 핫한 예언</h2>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              {hotOracles.length}개
            </span>
          </div>
          <div className="space-y-3">
            {hotOracles.slice(0, 3).map((oracle) => (
              <OracleCard key={oracle.id} oracle={oracle} />
            ))}
          </div>
          {hotOracles.length > 3 && (
            <button
              className="w-full py-2.5 rounded-xl border border-oracle-border text-xs font-semibold text-slate-400 hover:text-white hover:border-oracle-purple/50 hover:bg-oracle-purple/5 transition-all"
              onClick={() => {/* handled by tab switch - just show all via community */}}
            >
              HOT 예언 {hotOracles.length - 3}개 더 보기 →
            </button>
          )}
        </div>
      )}

      <RecommendationPanel oracles={oracles} />
    </div>
  );
}

const CATEGORY_CHIPS = [
  { name: "경제/주식",    emoji: "📈" },
  { name: "스포츠",       emoji: "⚽" },
  { name: "정치",         emoji: "🏛️" },
  { name: "엔터테인먼트", emoji: "🎵" },
  { name: "기술/AI",      emoji: "🤖" },
  { name: "날씨/자연",    emoji: "🌤️" },
  { name: "사회/문화",    emoji: "🌏" },
];

function CategoryChips() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">카테고리</h2>
        <Link href="/" className="text-[11px] text-oracle-purple hover:text-oracle-glow transition-colors flex items-center gap-0.5">
          전체 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
        {CATEGORY_CHIPS.map((cat) => (
          <Link
            key={cat.name}
            href={`/category/${encodeURIComponent(cat.name)}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-oracle-border bg-oracle-card text-slate-400 hover:text-white hover:border-oracle-purple/40 hover:bg-oracle-purple/10 transition-all"
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RankingTab({ myPoints, myAccuracy, myBets }: {
  myPoints: number; myAccuracy: number; myBets: number;
}) {
  const { current: myGrade } = getNextGradeProgress(myPoints);

  const stats = [
    { label: "총 포인트", value: `${myPoints.toLocaleString()}P`, color: "text-oracle-glow", sub: "누적 획득" },
    { label: "적중률",    value: myAccuracy > 0 ? `${myAccuracy}%` : "—",  color: "text-oracle-trending", sub: "예언 정확도" },
    { label: "참여 예언", value: `${myBets}개`,  color: "text-emerald-400", sub: "배팅 완료" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <GradeCard points={myPoints} />

      {/* Stats card */}
      <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4 space-y-3">
        <p className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-oracle-trending" />
          나의 예언 통계
        </p>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
              <p className={clsx("text-lg font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
              <p className="text-[9px] text-slate-600">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <LeaderBoard />
      <GradeGrid currentPoints={myPoints} />
    </div>
  );
}
