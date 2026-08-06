"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Hash, Users, Coins, Sparkles } from "lucide-react";
import { useOracles } from "@/lib/context";
import OracleCard from "@/components/OracleCard";

export default function TagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { oracles } = useOracles();
  const tag = decodeURIComponent(name);

  const filtered = oracles.filter((o) => o.tags.includes(tag));
  const totalParticipants = filtered.reduce((s, o) => s + o.totalParticipants, 0);
  const totalPool = filtered.reduce((s, o) => s + o.totalPool, 0);

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/85 backdrop-blur-xl border-b border-oracle-border/60 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Hash className="w-4 h-4 text-oracle-purple shrink-0" />
          <span className="text-sm font-bold text-white truncate">{tag}</span>
        </div>
        <span className="text-xs text-slate-500 shrink-0">{filtered.length}개</span>
      </div>

      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Tag banner */}
        <div className="rounded-2xl border border-oracle-purple/25 bg-gradient-to-br from-oracle-purple/10 to-oracle-violet/5 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-oracle-purple/20 border border-oracle-purple/40 flex items-center justify-center">
              <Hash className="w-6 h-6 text-oracle-glow" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">#{tag}</h1>
              <p className="text-xs text-oracle-purple/80">{filtered.length}개 예언</p>
            </div>
          </div>
          {filtered.length > 0 && (
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 text-xs text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {totalParticipants.toLocaleString()}명 참여
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 text-xs text-oracle-trending font-semibold">
                <Coins className="w-3.5 h-3.5" />
                {totalPool.toLocaleString()}P 풀
              </div>
            </div>
          )}
        </div>

        {/* Oracle list */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="text-5xl">🔍</div>
            <p className="text-white font-bold">#{tag} 태그 예언이 없어요</p>
            <p className="text-sm text-slate-500">아직 이 태그에 예언이 없습니다</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-oracle-purple hover:text-oracle-glow transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> 예언 만들어보기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((oracle) => (
              <OracleCard key={oracle.id} oracle={oracle} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
