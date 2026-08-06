"use client";

import { useState } from "react";
import { CheckCircle2, Coins, Users, Zap, TrendingUp } from "lucide-react";
import { BetOption } from "@/lib/types";
import { useUser } from "@/lib/context";
import clsx from "clsx";

interface Props {
  options: BetOption[];
  oracleId: string;
  onBet?: (oracleId: string, optionId: string, amount: number) => void;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

const OPTION_GRADIENTS = [
  { active: "from-oracle-purple to-oracle-glow", ring: "ring-oracle-purple/50", shadow: "shadow-oracle-purple/25" },
  { active: "from-oracle-hot to-orange-400",      ring: "ring-oracle-hot/50",    shadow: "shadow-oracle-hot/25" },
  { active: "from-emerald-500 to-teal-400",       ring: "ring-emerald-500/50",   shadow: "shadow-emerald-500/25" },
  { active: "from-blue-500 to-cyan-400",          ring: "ring-blue-500/50",      shadow: "shadow-blue-500/25" },
];

const CONFETTI_PARTICLES: { emoji: string; dx: string; dy: string; rot: string; delay: string }[] = [
  { emoji: "✨", dx: "-55px", dy: "-65px", rot: "45deg",  delay: "0s" },
  { emoji: "🌟", dx: "55px",  dy: "-65px", rot: "-45deg", delay: "0.04s" },
  { emoji: "🎉", dx: "-70px", dy: "-15px", rot: "90deg",  delay: "0.07s" },
  { emoji: "💫", dx: "70px",  dy: "-15px", rot: "-90deg", delay: "0.10s" },
  { emoji: "⭐", dx: "-45px", dy: "45px",  rot: "135deg", delay: "0.05s" },
  { emoji: "✨", dx: "45px",  dy: "45px",  rot: "-135deg", delay: "0.08s" },
  { emoji: "🎊", dx: "0px",   dy: "-75px", rot: "0deg",   delay: "0.02s" },
  { emoji: "💥", dx: "0px",   dy: "50px",  rot: "180deg", delay: "0.06s" },
];

function ConfettiBurst() {
  return (
    <>
      {CONFETTI_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="confetti-particle"
          style={{
            "--cdx": p.dx,
            "--cdy": p.dy,
            "--crot": p.rot,
            animationDelay: p.delay,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}
    </>
  );
}

export default function BettingButtons({ options, oracleId, onBet }: Props) {
  const { me, placeBet, myBets } = useUser();
  const existingBet = myBets.find((b) => b.oracleId === oracleId);

  const [selected, setSelected] = useState<string | null>(existingBet?.optionId ?? null);
  const [amount, setAmount] = useState<number>(50);
  const [betPlaced, setBetPlaced] = useState(!!existingBet);
  const [showAmountPicker, setShowAmountPicker] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSelect = (optionId: string) => {
    if (betPlaced) return;
    setSelected(optionId);
    setShowAmountPicker(true);
  };

  const handleBet = () => {
    if (!selected || betPlaced) return;
    if (me.points < amount) return;
    const opt = options.find((o) => o.id === selected);
    if (opt) placeBet(oracleId, selected, opt.label, amount);
    onBet?.(oracleId, selected, amount);
    setBetPlaced(true);
    setShowAmountPicker(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 900);
  };

  const handleQuickBet = (optionId: string, amt: number) => {
    if (betPlaced || me.points < amt) return;
    const opt = options.find((o) => o.id === optionId);
    if (opt) placeBet(oracleId, optionId, opt.label, amt);
    setSelected(optionId);
    setAmount(amt);
    onBet?.(oracleId, optionId, amt);
    setBetPlaced(true);
    setShowAmountPicker(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 900);
  };

  const selectedOption = options.find((o) => o.id === selected);
  const notEnoughPoints = me.points < amount;
  const expectedProfit = Math.floor(amount * (selectedOption?.odds ?? 1) - amount);

  if (betPlaced) {
    return (
      <div className="relative overflow-visible">
        {showConfetti && <ConfettiBurst />}
        <div className="animate-scale-in rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">예언 완료 🎉</p>
              <p className="text-sm font-bold text-emerald-400">{selectedOption?.label}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">{amount}P 배팅</p>
              <p className="text-xs font-bold text-oracle-glow">+{expectedProfit}P 예상</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Option buttons */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const g = OPTION_GRADIENTS[i % OPTION_GRADIENTS.length];
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={clsx(
                "relative group flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? [`border-transparent ring-2 ${g.ring} shadow-lg ${g.shadow}`, "bg-slate-800/80"]
                  : "border-slate-700/80 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70"
              )}
            >
              {isSelected && (
                <div className={clsx("absolute inset-0 rounded-xl bg-gradient-to-br opacity-10", g.active)} />
              )}
              <div className="relative w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{opt.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2">
                  <div
                    className={clsx("h-full rounded-full bg-gradient-to-r transition-all duration-700", g.active)}
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-500 flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {opt.totalBets.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-oracle-trending">×{opt.odds}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick bet shortcuts */}
      {!showAmountPicker && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider text-center">빠른 배팅</p>
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((opt) =>
              QUICK_AMOUNTS.map((amt) => (
                <button
                  key={`${opt.id}-${amt}`}
                  onClick={() => handleQuickBet(opt.id, amt)}
                  disabled={me.points < amt}
                  className="text-xs py-2 px-2.5 rounded-lg bg-slate-800/60 hover:bg-oracle-purple/20 border border-slate-700/60 hover:border-oracle-purple/50 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <span className="opacity-70">{opt.label.split(" ")[0]}</span> {amt}P
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Amount picker */}
      {showAmountPicker && selected && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-800/60 border border-oracle-purple/25 animate-slide-up">
          <p className="text-xs text-slate-400 text-center">
            <span className="font-bold text-oracle-glow">{selectedOption?.label}</span>에 얼마나 배팅할까요?
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={clsx(
                  "flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-all",
                  amount === amt
                    ? "bg-oracle-purple border-oracle-purple text-white shadow-glow-sm"
                    : "bg-slate-700/60 border-slate-600 text-slate-300 hover:border-oracle-purple/50 hover:text-white"
                )}
              >
                {amt}P
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                min={1}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-oracle-purple transition-colors placeholder:text-slate-600"
                placeholder="직접 입력"
              />
              <button
                onClick={handleBet}
                disabled={notEnoughPoints}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-oracle"
              >
                <Zap className="w-4 h-4" />
                배팅!
              </button>
            </div>
            {notEnoughPoints && (
              <p className="text-xs text-oracle-hot flex items-center gap-1">
                <span>포인트 부족</span>
                <span className="text-slate-400">({me.points.toLocaleString()}P 보유)</span>
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-0.5">
            <TrendingUp className="w-3 h-3" />
            예상 수익:{" "}
            <span className="text-oracle-trending font-bold text-sm">+{expectedProfit}P</span>
          </div>
        </div>
      )}
    </div>
  );
}
