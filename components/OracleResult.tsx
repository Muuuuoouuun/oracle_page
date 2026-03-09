"use client";

import { useState } from "react";
import { Trophy, CheckCircle2, XCircle, Coins, Users, TrendingUp } from "lucide-react";
import { Oracle, BetOption } from "@/lib/types";
import { useUser, useOracles } from "@/lib/context";
import clsx from "clsx";

interface Props {
  oracle: Oracle;
  winningOption: BetOption;
  onClose?: () => void;
}

export default function OracleResult({ oracle, winningOption, onClose }: Props) {
  const { myBets, adjustPoints } = useUser();
  const myBet = myBets.find((b) => b.oracleId === oracle.id);
  const iWon = myBet?.optionId === winningOption.id;
  const payout = myBet ? Math.floor(myBet.amount * winningOption.odds) : 0;
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (iWon && !claimed) {
      adjustPoints(payout);
      setClaimed(true);
    }
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{
      borderColor: iWon ? "rgba(52,211,153,0.4)" : "rgba(255,77,109,0.3)",
      boxShadow: iWon ? "0 0 24px rgba(52,211,153,0.2)" : "0 0 24px rgba(255,77,109,0.1)",
    }}>
      {/* Header */}
      <div className={clsx("px-4 py-3 flex items-center gap-2", iWon ? "bg-emerald-500/10" : "bg-red-500/5")}>
        {iWon
          ? <Trophy className="w-5 h-5 text-oracle-trending" />
          : <XCircle className="w-5 h-5 text-oracle-hot" />}
        <span className="text-sm font-black text-white">
          {iWon ? "🎉 예언 적중!" : "😢 예언 실패"}
        </span>
      </div>

      <div className="bg-oracle-card px-4 py-4 space-y-4">
        {/* Oracle title */}
        <p className="text-sm text-slate-300 line-clamp-2">{oracle.title}</p>

        {/* Winning option */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">정답</p>
            <p className="text-sm font-bold text-white">{winningOption.label}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">배당률</p>
            <p className="text-sm font-bold text-oracle-trending">x{winningOption.odds}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
            <Users className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
            <p className="font-bold text-white">{oracle.totalParticipants.toLocaleString()}명</p>
            <p className="text-slate-500">참여자</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-2.5 text-center">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
            <p className="font-bold text-white">{winningOption.percentage}%</p>
            <p className="text-slate-500">정답 선택률</p>
          </div>
        </div>

        {/* My result */}
        {myBet && (
          <div className={clsx(
            "rounded-xl p-3 space-y-2",
            iWon ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/5 border border-red-500/15"
          )}>
            <p className="text-xs text-slate-400">나의 결과</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">내 선택: <span className="font-bold">{myBet.optionLabel}</span></p>
                <p className="text-xs text-slate-500">배팅: {myBet.amount.toLocaleString()}P</p>
              </div>
              {iWon ? (
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-400">+{payout.toLocaleString()}P</p>
                  <p className="text-xs text-slate-500">획득 포인트</p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-lg font-black text-oracle-hot">-{myBet.amount.toLocaleString()}P</p>
                  <p className="text-xs text-slate-500">손실 포인트</p>
                </div>
              )}
            </div>
            {iWon && !claimed && (
              <button
                onClick={handleClaim}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Coins className="w-4 h-4" /> 포인트 수령하기
              </button>
            )}
            {claimed && (
              <div className="text-center text-sm text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 포인트 수령 완료!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
