"use client";

import Link from "next/link";
import { Zap, TrendingUp, Flame, ChevronRight } from "lucide-react";
import { Oracle } from "@/lib/types";
import { useUser } from "@/lib/context";
import clsx from "clsx";

interface Props {
  oracles: Oracle[];
}

/** 스트립에서의 원터치 배팅 금액 */
const QUICK_AMOUNT = 10;

export default function QuickBetStrip({ oracles }: Props) {
  const { me, myBets, placeBet } = useUser();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-oracle-trending" />
        <h2 className="text-sm font-bold text-white">지금 핫한 예언 빠른 배팅</h2>
        <span className="text-xs text-slate-500">한 번에 {QUICK_AMOUNT}P</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {oracles.map((oracle) => {
          const myBet = myBets.find((b) => b.oracleId === oracle.id);
          const placedOption = oracle.options.find((o) => o.id === myBet?.optionId);
          const closed = oracle.status === "closed";
          const canBet = !myBet && !closed && me.points >= QUICK_AMOUNT;

          return (
            <div
              key={oracle.id}
              className="snap-start shrink-0 w-64 rounded-xl border border-oracle-border bg-oracle-card p-3 space-y-2"
            >
              {/* Badge */}
              <div className="flex items-center gap-1">
                {oracle.isHot && <Flame className="w-3 h-3 text-oracle-hot" />}
                {oracle.isTrending && <TrendingUp className="w-3 h-3 text-oracle-trending" />}
                <span className="text-xs text-slate-500 truncate">{oracle.category}</span>
              </div>

              {/* Title */}
              <Link href={`/oracle/${oracle.id}`}>
                <p className="text-xs font-bold text-white line-clamp-2 leading-snug hover:text-oracle-glow transition-colors">
                  {oracle.title}
                </p>
              </Link>

              {/* Quick vote buttons */}
              {myBet ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  ✓ {placedOption?.label ?? myBet.optionLabel} 예언 완료!
                </div>
              ) : closed ? (
                <div className="text-xs text-slate-500">종료된 예언입니다</div>
              ) : (
                <div className="flex gap-1.5">
                  {oracle.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => placeBet(oracle.id, opt.id, QUICK_AMOUNT)}
                      disabled={!canBet}
                      className={clsx(
                        "flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all",
                        "bg-slate-800 border-slate-700 text-slate-300",
                        "hover:bg-oracle-purple/20 hover:border-oracle-purple/60 hover:text-white",
                        "active:scale-95",
                        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {!myBet && !closed && me.points < QUICK_AMOUNT && (
                <p className="text-xs text-oracle-hot">포인트가 부족합니다</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{oracle.totalParticipants.toLocaleString()}명 참여</span>
                <Link
                  href={`/oracle/${oracle.id}`}
                  className="flex items-center gap-0.5 text-oracle-purple hover:text-oracle-glow transition-colors"
                >
                  상세 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
