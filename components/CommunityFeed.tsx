"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Oracle, OracleCategory } from "@/lib/types";
import { useUI, useUser } from "@/lib/context";
import OracleCard from "./OracleCard";
import clsx from "clsx";

type SortOption = "최신순" | "인기순" | "마감임박";

const CATEGORIES: ("전체" | OracleCategory)[] = [
  "전체", "경제/주식", "스포츠", "정치", "엔터테인먼트", "기술/AI", "날씨/자연", "사회/문화",
];

interface Props {
  oracles: Oracle[];
}

export default function CommunityFeed({ oracles }: Props) {
  const { tagFilter, setTagFilter } = useUI();
  const { myBets } = useUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"전체" | OracleCategory>("전체");
  const [sort, setSort] = useState<SortOption>("인기순");
  const [onlyMine, setOnlyMine] = useState(false);

  const myOracleIds = new Set(myBets.map((b) => b.oracleId));

  const filtered = oracles
    .filter((o) => {
      if (category !== "전체" && o.category !== category) return false;
      if (tagFilter && !o.tags.includes(tagFilter)) return false;
      if (onlyMine && !myOracleIds.has(o.id)) return false;
      if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "최신순")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "인기순") return b.totalParticipants - a.totalParticipants;
      if (sort === "마감임박")
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="예언 검색..."
          className="w-full bg-oracle-card border border-oracle-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={clsx(
              "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
              category === cat
                ? "bg-oracle-purple border-oracle-purple text-white"
                : "bg-oracle-card border-oracle-border text-slate-400 hover:text-white hover:border-oracle-purple/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 태그 필터가 걸려 있으면 눈에 띄게 알려주고 바로 해제할 수 있게 한다 */}
      {tagFilter && (
        <div className="flex items-center gap-2 rounded-xl border border-oracle-purple/40 bg-oracle-purple/10 px-3 py-2">
          <span className="text-xs text-slate-400">태그 필터</span>
          <span className="text-sm font-bold text-oracle-purple">#{tagFilter}</span>
          <button
            onClick={() => setTagFilter(null)}
            aria-label="태그 필터 해제"
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" /> 해제
          </button>
        </div>
      )}

      {/* Sort + count */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500">
            <span className="text-white font-bold">{filtered.length}</span>개의 예언
          </p>
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={clsx(
              "text-xs px-2.5 py-1 rounded-lg border transition-all",
              onlyMine
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                : "border-slate-700 text-slate-500 hover:text-white"
            )}
          >
            참여한 예언만
          </button>
        </div>
        <div className="flex gap-1">
          {(["인기순", "최신순", "마감임박"] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-lg border transition-all",
                sort === s
                  ? "bg-oracle-purple/20 border-oracle-purple/50 text-oracle-purple"
                  : "border-slate-700 text-slate-500 hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((oracle) => (
            <OracleCard key={oracle.id} oracle={oracle} />
          ))
        ) : (
          <div className="py-16 text-center space-y-3">
            <p className="text-3xl">🔮</p>
            <p className="text-slate-400 text-sm">
              {onlyMine
                ? "아직 참여한 예언이 없어요"
                : tagFilter
                ? `#${tagFilter} 태그의 예언이 없어요`
                : "해당하는 예언이 없습니다"}
            </p>
            {(tagFilter || onlyMine || search || category !== "전체") && (
              <button
                onClick={() => {
                  setTagFilter(null);
                  setOnlyMine(false);
                  setSearch("");
                  setCategory("전체");
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-oracle-purple/50 text-oracle-purple hover:bg-oracle-purple/10 transition-colors"
              >
                필터 모두 해제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
