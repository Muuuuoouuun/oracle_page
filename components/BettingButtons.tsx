"use client";

import { useState } from "react";
import { CheckCircle2, Coins, Users } from "lucide-react";
import { BetOption } from "@/lib/types";
import { useUser } from "@/lib/context";
import clsx from "clsx";

interface Props {
  options: BetOption[];
  oracleId: string;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

export default function BettingButtons({ options, oracleId }: Props) {
  const { me, placeBet, myBets } = useUser();
  // 배팅 여부는 전역 상태에서 파생시킨다. (로컬 state 로 두면 새로고침·페이지
  // 이동 시 이미 배팅한 예언에 다시 배팅할 수 있게 된다)
  const existingBet = myBets.find((b) => b.oracleId === oracleId);

  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [showAmountPicker, setShowAmountPicker] = useState(false);

  const handleSelect = (optionId: string) => {
    if (existingBet) return;
    setSelected(optionId);
    setShowAmountPicker(true);
  };

  const handleBet = () => {
    if (!selected || existingBet) return;
    if (amount <= 0 || me.points < amount) return;
    placeBet(oracleId, selected, amount);
    setShowAmountPicker(false);
  };

  const handleQuickBet = (optionId: string, amt: number) => {
    if (existingBet || me.points < amt) return;
    placeBet(oracleId, optionId, amt);
    setShowAmountPicker(false);
  };

  const selectedOption = options.find((o) => o.id === selected);
  const notEnoughPoints = amount <= 0 || me.points < amount;

  if (existingBet) {
    const betOption = options.find((o) => o.id === existingBet.optionId);
    const expectedProfit = Math.floor(existingBet.amount * existingBet.odds - existingBet.amount);

    return (
      <div
        className={clsx(
          "flex items-center gap-2 py-3 px-4 rounded-xl border",
          existingBet.status === "won"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : existingBet.status === "lost"
            ? "bg-red-500/5 border-red-500/20"
            : "bg-emerald-500/10 border-emerald-500/30"
        )}
      >
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
          <span className="text-slate-400 ml-2">{existingBet.amount.toLocaleString()}P 배팅</span>
        </div>
        <div className="ml-auto text-xs text-slate-500 text-right shrink-0">
          {existingBet.status === "pending" && (
            <>
              예상 수익{" "}
              <span className="text-oracle-glow font-bold">
                +{expectedProfit.toLocaleString()}P
              </span>
            </>
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

      {/* Quick bet shortcuts */}
      {!showAmountPicker && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 text-center">
            빠른 배팅 — <span className="text-slate-400">{options[0]?.label}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => handleQuickBet(options[0].id, amt)}
                disabled={me.points < amt}
                className="text-xs py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-oracle-purple/20 border border-slate-700 hover:border-oracle-purple/50 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
              >
                {amt}P
              </button>
            ))}
          </div>
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
