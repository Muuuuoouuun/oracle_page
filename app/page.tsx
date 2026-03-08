"use client";

import { useState } from "react";
import {
  Sparkles, Bell, User, Home, TrendingUp, Users, Plus, Flame, Zap
} from "lucide-react";
import { MOCK_ORACLES, HOT_ORACLES, TRENDING_ORACLES } from "@/lib/mockData";
import CommunityFeed from "@/components/CommunityFeed";
import QuickBetStrip from "@/components/QuickBetStrip";
import RecommendationPanel from "@/components/RecommendationPanel";
import LeaderBoard from "@/components/LeaderBoard";
import OracleCard from "@/components/OracleCard";
import clsx from "clsx";

type Tab = "홈" | "커뮤니티" | "랭킹";

export default function OraclePage() {
  const [activeTab, setActiveTab] = useState<Tab>("홈");

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
      {/* Top nav */}
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
            {/* Points display */}
            <div className="flex items-center gap-1 bg-oracle-card border border-oracle-border rounded-full px-3 py-1">
              <Zap className="w-3.5 h-3.5 text-oracle-trending" />
              <span className="text-xs font-bold text-white">1,500P</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full bg-oracle-purple/20 border border-oracle-purple/50 flex items-center justify-center text-oracle-glow">
              <User className="w-4 h-4" />
            </button>
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
        {activeTab === "홈" && <HomeTab />}
        {activeTab === "커뮤니티" && <CommunityTab />}
        {activeTab === "랭킹" && <RankingTab />}
      </main>

      {/* FAB */}
      <button className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow shadow-lg shadow-oracle-purple/40 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all animate-glow">
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}

/* ── Tab Content ── */

function HomeTab() {
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-r from-oracle-violet to-oracle-purple p-5 space-y-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative">
          <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">오늘의 예언</p>
          <h2 className="text-xl font-black text-white mt-1">
            당신의 직감을 믿으세요 🔮
          </h2>
          <p className="text-sm text-purple-200 mt-1">
            지금 <span className="font-bold text-white">12,847명</span>이 예언 중
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
              <Flame className="w-3 h-3 text-orange-300" />
              HOT 예언 {HOT_ORACLES.length}개
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              신규 예언 추가됨
            </div>
          </div>
        </div>
      </div>

      {/* Quick bet strip */}
      <QuickBetStrip oracles={[...HOT_ORACLES, ...TRENDING_ORACLES]} />

      {/* Top picks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-oracle-hot" />
            <h2 className="text-sm font-bold text-white">지금 핫한 예언</h2>
          </div>
        </div>
        {MOCK_ORACLES.filter((o) => o.isHot).map((oracle) => (
          <OracleCard key={oracle.id} oracle={oracle} />
        ))}
      </div>

      {/* Recommendation panel */}
      <RecommendationPanel oracles={MOCK_ORACLES} />
    </div>
  );
}

function CommunityTab() {
  return <CommunityFeed oracles={MOCK_ORACLES} />;
}

function RankingTab() {
  return (
    <div className="space-y-4">
      {/* My stats */}
      <div className="rounded-2xl border border-oracle-purple/30 bg-oracle-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-oracle-purple/20 border-2 border-oracle-purple flex items-center justify-center text-2xl">
            🌟
          </div>
          <div>
            <p className="text-white font-bold">나의 예언 통계</p>
            <p className="text-xs text-slate-500">예언을 시작해 포인트를 쌓아보세요!</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "총 포인트", value: "1,500P", color: "text-oracle-glow" },
            { label: "적중률", value: "—", color: "text-oracle-trending" },
            { label: "참여 예언", value: "0개", color: "text-emerald-400" },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-slate-800/50 rounded-xl p-3">
              <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <LeaderBoard />

      {/* Recently closed */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-oracle-purple" />
          마감된 예언 결과
        </h2>
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4 text-center space-y-2">
          <p className="text-3xl">🔮</p>
          <p className="text-sm text-slate-400">아직 마감된 예언이 없어요</p>
          <p className="text-xs text-slate-600">예언에 참여하고 적중률을 높여보세요!</p>
        </div>
      </div>
    </div>
  );
}
