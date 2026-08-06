"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Flame, Users, Plus } from "lucide-react";
import { useOracles } from "@/lib/context";
import { OracleCategory } from "@/lib/types";
import OracleCard from "@/components/OracleCard";
import RecommendationPanel from "@/components/RecommendationPanel";
import clsx from "clsx";

const CATEGORY_META: Record<string, { emoji: string; desc: string; gradient: string; accent: string }> = {
  "경제/주식":      { emoji: "📈", desc: "주식, 암호화폐, 경제 지표 예언", gradient: "from-emerald-900/60 via-teal-900/40 to-oracle-dark/0",    accent: "text-emerald-400" },
  "스포츠":         { emoji: "⚽", desc: "축구, 야구, 올림픽 등 스포츠 예언",  gradient: "from-blue-900/60 via-blue-900/40 to-oracle-dark/0",      accent: "text-blue-400" },
  "정치":           { emoji: "🏛️", desc: "선거, 정책, 외교 관련 예언",       gradient: "from-red-900/60 via-red-900/40 to-oracle-dark/0",        accent: "text-red-400" },
  "엔터테인먼트":   { emoji: "🎵", desc: "K-POP, 드라마, 영화 예언",         gradient: "from-pink-900/60 via-fuchsia-900/40 to-oracle-dark/0",   accent: "text-pink-400" },
  "기술/AI":        { emoji: "🤖", desc: "AI, 테크 기업, 신기술 예언",        gradient: "from-cyan-900/60 via-cyan-900/40 to-oracle-dark/0",      accent: "text-cyan-400" },
  "날씨/자연":      { emoji: "🌤️", desc: "날씨, 자연 현상 예언",             gradient: "from-sky-900/60 via-sky-900/40 to-oracle-dark/0",        accent: "text-sky-400" },
  "사회/문화":      { emoji: "🌏", desc: "사회 이슈, 문화 트렌드 예언",       gradient: "from-violet-900/60 via-violet-900/40 to-oracle-dark/0",  accent: "text-violet-400" },
};

export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const category = decodeURIComponent(name) as OracleCategory;
  const { oracles } = useOracles();
  const meta = CATEGORY_META[category] ?? { emoji: "🔮", desc: "예언 카테고리", gradient: "from-oracle-violet/40 to-oracle-dark/0", accent: "text-oracle-glow" };

  const filtered = oracles.filter((o) => o.category === category);
  const live = filtered.filter((o) => o.status === "live");
  const others = filtered.filter((o) => o.status !== "live");
  const related = oracles.filter((o) => o.category !== category);

  const totalParticipants = filtered.reduce((s, o) => s + o.totalParticipants, 0);
  const totalPool = filtered.reduce((s, o) => s + o.totalPool, 0);

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
        <div className="flex-1">
          <p className="text-[11px] text-slate-500 font-medium">카테고리</p>
          <p className="text-sm font-bold text-white">{meta.emoji} {category}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-oracle-purple hover:text-oracle-glow transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> 예언 만들기
        </Link>
      </div>

      <div className="px-4 py-5 space-y-6 animate-fade-in">
        {/* Hero banner */}
        <div className={clsx("rounded-2xl overflow-hidden relative bg-gradient-to-b", meta.gradient, "bg-oracle-card border border-oracle-border")}>
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }} />
          <div className="relative p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-4xl">{meta.emoji}</span>
                <h1 className="text-xl font-black text-white mt-2">{category}</h1>
                <p className="text-sm text-slate-300">{meta.desc}</p>
              </div>
              {/* Category stats */}
              <div className="text-right space-y-1">
                <div className={clsx("text-2xl font-black", meta.accent)}>{filtered.length}</div>
                <div className="text-xs text-slate-500">예언</div>
              </div>
            </div>

            {/* Mini stats row */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                진행중 {live.length}개
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300">
                <Users className="w-3 h-3" />
                {totalParticipants.toLocaleString()}명 참여
              </div>
            </div>
          </div>
        </div>

        {/* Live predictions */}
        {live.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  진행 중인 예언
                </span>
              </h2>
              <span className="text-xs text-emerald-400 font-medium">{live.length}개</span>
            </div>
            {live.map((o) => <OracleCard key={o.id} oracle={o} />)}
          </div>
        )}

        {/* Ended predictions */}
        {others.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                종료된 예언
              </h2>
              <span className="text-xs text-slate-600 font-medium">{others.length}개</span>
            </div>
            <div className="opacity-80">
              {others.map((o) => <OracleCard key={o.id} oracle={o} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center space-y-4">
            <div className="text-5xl">{meta.emoji}</div>
            <div className="space-y-1">
              <p className="text-white font-bold">아직 {category} 예언이 없어요</p>
              <p className="text-slate-500 text-sm">첫 번째 예언가가 되어보세요!</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-oracle-purple/20 border border-oracle-purple/40 text-oracle-purple text-sm font-medium hover:bg-oracle-purple/30 transition-all"
            >
              <Plus className="w-4 h-4" /> 예언 만들기
            </Link>
          </div>
        )}

        {/* Recommendations from other categories */}
        {related.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-oracle-hot" /> 다른 예언도 보기
            </h3>
            <RecommendationPanel oracles={related} />
          </div>
        )}
      </div>
    </div>
  );
}
