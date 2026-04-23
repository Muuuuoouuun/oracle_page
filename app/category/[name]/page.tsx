"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useOracles } from "@/lib/context";
import { OracleCategory } from "@/lib/types";
import OracleCard from "@/components/OracleCard";
import RecommendationPanel from "@/components/RecommendationPanel";

const CATEGORY_META: Record<string, { emoji: string; desc: string }> = {
  "경제/주식": { emoji: "📈", desc: "주식, 암호화폐, 경제 지표 예언" },
  "스포츠":    { emoji: "⚽", desc: "축구, 야구, 올림픽 등 스포츠 예언" },
  "정치":      { emoji: "🏛️", desc: "선거, 정책, 외교 관련 예언" },
  "엔터테인먼트": { emoji: "🎵", desc: "K-POP, 드라마, 영화 예언" },
  "기술/AI":   { emoji: "🤖", desc: "AI, 테크 기업, 신기술 예언" },
  "날씨/자연": { emoji: "🌤️", desc: "날씨, 자연 현상 예언" },
  "사회/문화": { emoji: "🌏", desc: "사회 이슈, 문화 트렌드 예언" },
};

export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const category = decodeURIComponent(name) as OracleCategory;
  const { oracles } = useOracles();
  const meta = CATEGORY_META[category] ?? { emoji: "🔮", desc: "" };

  const filtered = oracles.filter((o) => o.category === category);
  const live = filtered.filter((o) => o.status === "live");
  const others = filtered.filter((o) => o.status !== "live");
  const related = oracles.filter((o) => o.category !== category);

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/80 backdrop-blur-md border-b border-oracle-border px-4 py-3 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-slate-500">카테고리</p>
          <p className="text-sm font-bold text-white">{meta.emoji} {category}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-oracle-violet to-oracle-purple p-5 space-y-1">
          <p className="text-4xl">{meta.emoji}</p>
          <h1 className="text-xl font-black text-white">{category}</h1>
          <p className="text-sm text-purple-200">{meta.desc}</p>
          <p className="text-xs text-purple-300 mt-2">
            진행중 <span className="font-bold text-white">{live.length}개</span> ·
            전체 <span className="font-bold text-white">{filtered.length}개</span>
          </p>
        </div>

        {/* Live */}
        {live.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              진행 중인 예언
            </h2>
            {live.map((o) => <OracleCard key={o.id} oracle={o} />)}
          </div>
        )}

        {/* Others */}
        {others.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              종료된 예언
            </h2>
            {others.map((o) => <OracleCard key={o.id} oracle={o} />)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <p className="text-4xl">{meta.emoji}</p>
            <p className="text-slate-400 text-sm">아직 {category} 예언이 없어요</p>
            <p className="text-xs text-slate-600">첫 번째 예언을 만들어보세요!</p>
          </div>
        )}

        {/* Other categories */}
        <RecommendationPanel oracles={related} />
      </div>
    </div>
  );
}
