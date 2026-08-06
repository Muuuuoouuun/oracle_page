"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal, Flame, TrendingUp, Clock, Users } from "lucide-react";
import { Oracle, OracleCategory } from "@/lib/types";
import OracleCard from "./OracleCard";
import clsx from "clsx";

type SortOption = "최신순" | "인기순" | "마감임박";

const CATEGORIES: ("전체" | OracleCategory)[] = [
  "전체", "경제/주식", "스포츠", "정치", "엔터테인먼트", "기술/AI", "날씨/자연", "사회/문화",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  "전체": "🔮",
  "경제/주식": "📈",
  "스포츠": "⚽",
  "정치": "🏛️",
  "엔터테인먼트": "🎵",
  "기술/AI": "🤖",
  "날씨/자연": "🌤️",
  "사회/문화": "🌏",
};

const SORT_CONFIG: { key: SortOption; icon: React.ReactNode; label: string }[] = [
  { key: "인기순",  icon: <Flame className="w-3 h-3" />,      label: "인기순" },
  { key: "최신순",  icon: <Clock className="w-3 h-3" />,       label: "최신순" },
  { key: "마감임박", icon: <TrendingUp className="w-3 h-3" />, label: "마감임박" },
];

interface Props { oracles: Oracle[] }

export default function CommunityFeed({ oracles }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"전체" | OracleCategory>("전체");
  const [sort, setSort] = useState<SortOption>("인기순");

  const filtered = oracles
    .filter((o) => {
      if (category !== "전체" && o.category !== category) return false;
      if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.tags.some(t => t.includes(search))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "최신순")  return b.createdAt.getTime() - a.createdAt.getTime();
      if (sort === "인기순")  return b.totalParticipants - a.totalParticipants;
      if (sort === "마감임박") return a.endsAt.getTime() - b.endsAt.getTime();
      return 0;
    });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search bar */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-oracle-purple transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="예언 검색... (제목, 태그)"
          className="w-full bg-oracle-card border border-oracle-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple focus:shadow-glow-sm transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={clsx(
              "shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
              category === cat
                ? "bg-oracle-purple border-oracle-purple text-white shadow-oracle"
                : "bg-oracle-card border-oracle-border text-slate-400 hover:text-white hover:border-oracle-purple/40"
            )}
          >
            <span>{CATEGORY_EMOJIS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Sort + count row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-xs text-slate-500">
            <span className="text-white font-bold">{filtered.length}</span>개의 예언
            {search && <span className="ml-1 text-oracle-purple">· "{search}" 검색 결과</span>}
          </p>
        </div>
        <div className="flex gap-1 p-0.5 bg-slate-900/60 rounded-lg">
          {SORT_CONFIG.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={clsx(
                "flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-all font-medium",
                sort === key
                  ? "bg-oracle-purple/25 border-oracle-purple/50 text-oracle-purple"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((oracle) => <OracleCard key={oracle.id} oracle={oracle} />)
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl">
              {search ? "🔍" : CATEGORY_EMOJIS[category] ?? "🔮"}
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-sm">
                {search ? `"${search}" 검색 결과가 없어요` : `${category} 예언이 없어요`}
              </p>
              <p className="text-slate-500 text-xs">
                {search ? "다른 키워드로 검색해보세요" : "첫 번째 예언을 만들어보세요! ✨"}
              </p>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-oracle-purple hover:text-oracle-glow transition-colors font-medium"
              >
                전체 목록 보기 →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
