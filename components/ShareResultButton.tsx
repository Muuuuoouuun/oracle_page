"use client";

import { useState } from "react";
import { Share2, Check, AlertCircle } from "lucide-react";
import type { Oracle } from "@/lib/types";
import type { MyBetRecord } from "@/lib/context";
import clsx from "clsx";

interface Props {
  oracle: Oracle;
  bet: MyBetRecord;
  won: boolean;
}

/** 결과 카드 이미지를 캔버스로 그린다. (외부 라이브러리 없이) */
function drawCard(oracle: Oracle, bet: MyBetRecord, won: boolean): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  // 배경
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#150E2B");
  bg.addColorStop(1, "#0F0A1E");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 상단 광채
  const glow = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 640);
  glow.addColorStop(0, won ? "rgba(52,211,153,0.28)" : "rgba(255,77,109,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 900);

  const center = (text: string, y: number, font: string, color: string) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, y);
  };

  // 줄바꿈이 필요한 제목
  const wrap = (text: string, y: number, font: string, color: string, maxW: number, lh: number) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    const chars = Array.from(text);
    let line = "";
    let cy = y;
    const lines: string[] = [];
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    for (const l of lines.slice(0, 3)) {
      ctx.fillText(l, W / 2, cy);
      cy += lh;
    }
    return cy;
  };

  center("🔮 ORACLE PAGE", 130, "600 34px system-ui, sans-serif", "rgba(255,255,255,0.45)");
  center(won ? "🎉" : "😢", 330, "150px system-ui, sans-serif", "#fff");
  center(
    won ? "예언 적중!" : "예언 실패",
    440,
    "900 76px system-ui, sans-serif",
    won ? "#34D399" : "#FF4D6D"
  );

  const afterTitle = wrap(
    oracle.title,
    570,
    "600 40px system-ui, sans-serif",
    "rgba(255,255,255,0.82)",
    W - 180,
    56
  );

  // 결과 박스
  const boxY = afterTitle + 40;
  const boxH = 300;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.strokeStyle = won ? "rgba(52,211,153,0.45)" : "rgba(255,77,109,0.35)";
  ctx.lineWidth = 3;
  const r = 36;
  ctx.beginPath();
  ctx.moveTo(90 + r, boxY);
  ctx.arcTo(W - 90, boxY, W - 90, boxY + boxH, r);
  ctx.arcTo(W - 90, boxY + boxH, 90, boxY + boxH, r);
  ctx.arcTo(90, boxY + boxH, 90, boxY, r);
  ctx.arcTo(90, boxY, W - 90, boxY, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  center("내 선택", boxY + 70, "500 30px system-ui, sans-serif", "rgba(255,255,255,0.45)");
  center(bet.optionLabel, boxY + 130, "800 52px system-ui, sans-serif", "#fff");

  const profit = won ? (bet.payout ?? 0) - bet.amount : -bet.amount;
  center(
    `${profit >= 0 ? "+" : ""}${profit.toLocaleString()}P`,
    boxY + 232,
    "900 84px system-ui, sans-serif",
    won ? "#FFD84D" : "#FF4D6D"
  );

  const totalBonus = bet.gradeBonus + bet.streakBonus;
  const detail = `${bet.amount.toLocaleString()}P × ${bet.odds}${
    totalBonus > 0 ? ` (+${Math.round(totalBonus * 100)}% 보너스)` : ""
  }`;
  center(detail, boxY + boxH + 70, "500 30px system-ui, sans-serif", "rgba(255,255,255,0.4)");
  center("당신은 예언가입니까?", H - 90, "600 34px system-ui, sans-serif", "rgba(255,255,255,0.3)");

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** 적중 결과를 이미지 카드로 만들어 공유하거나 저장한다. */
export default function ShareResultButton({ oracle, bet, won }: Props) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

  const handleShare = async () => {
    setState("working");
    try {
      const blob = await drawCard(oracle, bet, won);
      if (!blob) throw new Error("카드를 만들지 못했습니다");

      const file = new File([blob], "oracle-result.png", { type: "image/png" });
      const text = `${won ? "예언 적중!" : "예언 실패"} — ${oracle.title}`;

      // 파일 공유를 지원하면 공유 시트로, 아니면 이미지를 저장한다.
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text, title: "Oracle Page" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "oracle-result.png";
        a.click();
        URL.revokeObjectURL(url);
      }
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 실패가 아니다.
      if (e instanceof DOMException && e.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={state === "working"}
      className={clsx(
        "w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border",
        state === "error"
          ? "border-oracle-hot/50 text-oracle-hot bg-oracle-hot/10"
          : state === "done"
          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
          : "border-oracle-purple/50 text-oracle-purple hover:bg-oracle-purple/10",
        state === "working" && "opacity-60"
      )}
    >
      {state === "done" ? (
        <><Check className="w-4 h-4" /> 결과 카드가 준비됐어요</>
      ) : state === "error" ? (
        <><AlertCircle className="w-4 h-4" /> 카드를 만들지 못했어요. 다시 시도해주세요</>
      ) : (
        <><Share2 className="w-4 h-4" /> {state === "working" ? "카드 만드는 중…" : "결과 공유하기"}</>
      )}
    </button>
  );
}
