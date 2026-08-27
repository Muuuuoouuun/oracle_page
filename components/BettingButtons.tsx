"use client";

import { useState } from "react";
import { CheckCircle2, Coins, Users, Undo2, Flame } from "lucide-react";
import { BetOption } from "@/lib/types";
import { useUser } from "@/lib/context";
import clsx from "clsx";

interface Props {
  options: BetOption[];
  oracleId: string;
  /** 마감이 지났거나 종료된 예언이면 배팅을 막는다. */
  locked?: boolean;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];
/** 옵션별 원터치 배팅에 쓰는 금액 */
const ONE_TAP = [10, 50, 100];

export default function BettingButtons({ options, oracleId, locked = false }: Props) {
  const { me, placeBet, cancelBet, myBets } = useUser();
  // 배팅 여부는 전역 상태에서 파생시킨다. (로컬 state 로 두면 새로고침·페이지
  // 이동 시 이미 배팅한 예언에 다시 배팅할 수 있게 된다)
  const existingBet = myBets.find((b) => b.oracleId === oracleId);

  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [showAmountPicker, setShowAmountPicker] = useState(false);

  const handleSelect = (optionId: string) => {
    if (existingBet || locked) return;
    setSelected(optionId);
    setShowAmountPicker(true);
  };

  const handleBet = () => {
    if (!selected || existingBet || locked) return;
    if (amount <= 0 || me.points < amount) return;
    placeBet(oracleId, selected, amount);
    setShowAmountPicker(false);
  };

  const selectedOption = options.find((o) => o.id === selected);
  const notEnoughPoints = amount <= 0 || me.points < amount;

  /* ── 이미 배팅한 경우 ── */
  if (existingBet) {
    const betOption = options.find((o) => o.id === existingBet.optionId);
    const bonus = existingBet.gradeBonus + existingBet.streakBonus;
    const expected = Math.floor(existingBet.amount * existingBet.odds * (1 + bonus));

    return (
      <div
        className={clsx(
          "rounded-xl border p-3 space-y-2",
          existingBet.status === "lost"
            ? "bg-red-500/5 border-red-500/20"
            : "bg-emerald-500/10 border-emerald-500/30"
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <CheckCircle2
            className={clsx(
              "w-5 h-5 shrink-0",
              existingBet.status === "lost" ? "text-oracle-hot" : "text-emerald-400"
            )}
          />
          <div className="text-sm min-w-0">
            <span className="text-slate-300">예언 완료: </span>
            <span className="font-bold text-emerald-400">
              {betOption?.label ?? existingBet.optionLabel}
            </span>
            <span className="text-slate-400 ml-2">
              {existingBet.amount.toLocaleString()}P
            </span>
          </div>
          <div className="ml-auto text-xs text-right shrink-0">
            {existingBet.status === "pending" && (
              <span className="text-slate-500">
                예상{" "}
                <span className="text-oracle-glow font-bold">
                  +{(expected - existingBet.amount).toLocaleString()}P
                </span>
              </span>
            )}
            {existingBet.status === "won" && (
              <span className="text-emerald-400 font-bold">
                +{(existingBet.payout ?? 0).toLocaleString()}P 획득
              </span>
            )}
            {existingBet.status === "lost" && (
              <span className="text-oracle-hot font-bold">
                -{existingBet.amount.toLocaleString()}P
              </span>
            )}
          </div>
        </div>

        {bonus > 0 && (
          <p className="text-[11px] text-oracle-trending flex items-center gap-1">
            <Flame className="w-3 h-3" />
            배당 x{existingBet.odds}
            {existingBet.gradeBonus > 0 && ` · 등급 +${Math.round(existingBet.gradeBonus * 100)}%`}
            {existingBet.streakBonus > 0 && ` · 연승 +${Math.round(existingBet.streakBonus * 100)}%`}
          </p>
        )}

        {/* 마감 전이라면 되돌릴 수 있어야 한다 */}
        {existingBet.status === "pending" && !locked && (
          <button
            onClick={() => cancelBet(existingBet.id)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-600 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> 배팅 취소 (마감 전까지 가능)
          </button>
        )}
      </div>
    );
  }

  /* ── 마감/종료 ── */
  if (locked) {
    return (
      <p className="text-sm text-slate-500 text-center py-3">
        마감된 예언입니다. 곧 결과가 확정됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Option buttons */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={clsx(
              "relative group flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              selected === opt.id
                ? "border-oracle-purple bg-oracle-purple/20 shadow-lg shadow-oracle-purple/20"
                : "border-slate-700 bg-slate-800/50 hover:border-oracle-purple/60 hover:bg-oracle-purple/10"
            )}
          >
            <span className="text-sm font-bold text-white">{opt.label}</span>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-oracle-purple to-oracle-glow transition-all duration-700"
                style={{ width: `${opt.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full text-xs mt-0.5">
              <span className="text-slate-400">
                <Users className="w-3 h-3 inline mr-0.5" />
                {opt.totalBets.toLocaleString()}
              </span>
              <span className="text-oracle-trending font-bold">x{opt.odds}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 원터치 배팅 — 모든 선택지에 대해 제공한다 */}
      {!showAmountPicker && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 text-center">원터치 배팅</p>
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium truncate flex-1 min-w-0">
                {opt.label}
              </span>
              {ONE_TAP.map((amt) => (
                <button
                  key={amt}
                  onClick={() => placeBet(oracleId, opt.id, amt)}
                  disabled={me.points < amt}
                  aria-label={`${opt.label}에 ${amt}포인트 배팅`}
                  className="shrink-0 text-xs py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-oracle-purple/20 border border-slate-700 hover:border-oracle-purple/50 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                >
                  {amt}P
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Amount picker */}
      {showAmountPicker && selected && (
        <div className="space-y-2 p-3 rounded-xl bg-slate-800/80 border border-oracle-purple/30">
          <p className="text-xs text-slate-400 text-center">
            <span className="text-oracle-glow font-bold">{selectedOption?.label}</span>에 얼마나 배팅할까요?
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={clsx(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all",
                  amount === amt
                    ? "bg-oracle-purple border-oracle-purple text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300 hover:border-oracle-purple/50"
                )}
              >
                {amt}P
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-oracle-purple"
              placeholder="직접 입력"
            />
            <button
              onClick={handleBet}
              disabled={notEnoughPoints}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Coins className="w-4 h-4" />
              배팅!
            </button>
            {notEnoughPoints && (
              <p className="text-xs text-oracle-hot w-full">
                {amount <= 0
                  ? "1P 이상 입력해주세요"
                  : `포인트 부족 (${me.points.toLocaleString()}P 보유)`}
              </p>
            )}
          </div>
          <p className="text-xs text-center text-slate-500">
            예상 수익:{" "}
            <span className="text-oracle-trending font-bold">
              +{Math.max(0, Math.floor(amount * (selectedOption?.odds ?? 1) - amount)).toLocaleString()}P
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
