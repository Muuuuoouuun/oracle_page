"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gavel, Users, Coins, Clock, AlertTriangle, CheckCircle2,
  Ban, ExternalLink, History, Zap,
} from "lucide-react";
import { useOracles } from "@/lib/context";
import { useNow } from "@/lib/useNow";
import type { Oracle } from "@/lib/types";
import clsx from "clsx";

/** 승인 큐에서 얼마나 기다렸는지 */
function waitedFor(since: Date, now: number): { label: string; stale: boolean } {
  const ms = Math.max(0, now - since.getTime());
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return { label: `${mins}분 대기`, stale: false };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `${hours}시간 대기`, stale: hours >= 6 };
  return { label: `${Math.floor(hours / 24)}일 대기`, stale: true };
}

/**
 * 관리자 승인 큐.
 *
 * 마감된 예언의 결과를 사람이 확정하는 자리. 확정 전까지는 포인트가 전혀
 * 움직이지 않으므로, 판정 근거를 보고 결정할 수 있다.
 * 판정이 불가능한 예언은 무효 처리해 전원 환불한다.
 */
export default function ReviewQueueTab() {
  const {
    awaitingOracles, closeOracle, voidOracle,
    settlementMode, setSettlementMode, reviews,
  } = useOracles();
  const now = useNow(30_000);

  return (
    <div className="space-y-6">
      <SettlementModeCard mode={settlementMode} onChange={setSettlementMode} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-oracle-trending" />
          <h2 className="text-sm font-bold text-white">결과 확정 대기</h2>
          {awaitingOracles.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-oracle-hot text-white">
              {awaitingOracles.length}
            </span>
          )}
        </div>

        {awaitingOracles.length === 0 ? (
          <div className="rounded-2xl border border-oracle-border bg-oracle-card py-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
            <p className="text-sm text-slate-400">확정을 기다리는 예언이 없습니다</p>
            <p className="text-xs text-slate-600">
              마감된 예언이 생기면 여기로 올라옵니다.
            </p>
          </div>
        ) : (
          awaitingOracles.map((oracle) => (
            <ReviewCard
              key={oracle.id}
              oracle={oracle}
              now={now}
              onSettle={(optionId, note) => closeOracle(oracle.id, optionId, note)}
              onVoid={(note) => voidOracle(oracle.id, note)}
            />
          ))
        )}
      </section>

      <ReviewHistory reviews={reviews} />
    </div>
  );
}

/* ────────────────────────────────────── */

function SettlementModeCard({
  mode,
  onChange,
}: {
  mode: "review" | "auto";
  onChange: (m: "review" | "auto") => void;
}) {
  const options = [
    {
      key: "review" as const,
      icon: <Gavel className="w-4 h-4" />,
      title: "관리자 확정",
      body: "마감되면 이 큐로 올라오고, 확정해야 정산됩니다.",
    },
    {
      key: "auto" as const,
      icon: <Zap className="w-4 h-4" />,
      title: "자동 정산",
      body: "마감되면 선택률 가중 랜덤으로 즉시 정산합니다. 데모용입니다.",
    },
  ];

  return (
    <div className="rounded-2xl border border-oracle-border bg-oracle-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-white">정산 방식</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          마감된 예언의 결과를 어떻게 정할지 정합니다.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            aria-pressed={mode === o.key}
            className={clsx(
              "text-left p-3 rounded-xl border transition-all",
              mode === o.key
                ? "bg-oracle-purple/15 border-oracle-purple/60"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-1.5 text-sm font-bold",
                mode === o.key ? "text-oracle-purple" : "text-slate-300"
              )}
            >
              {o.icon}
              {o.title}
              {mode === o.key && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{o.body}</p>
          </button>
        ))}
      </div>

      {mode === "auto" && (
        <p className="text-xs text-oracle-hot flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          자동 정산은 결과가 무작위입니다. 포인트가 실제로 오가는 서비스라면
          관리자 확정을 쓰세요.
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────── */

function ReviewCard({
  oracle,
  now,
  onSettle,
  onVoid,
}: {
  oracle: Oracle;
  now: number | null;
  onSettle: (optionId: string, note: string) => void;
  onVoid: (note: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmVoid, setConfirmVoid] = useState(false);

  const since = oracle.awaitingSince ? new Date(oracle.awaitingSince) : new Date(oracle.endsAt);
  const waited = now === null ? null : waitedFor(since, now);

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-oracle-card p-4 space-y-3",
        waited?.stale ? "border-oracle-hot/50" : "border-oracle-border"
      )}
    >
      {/* 제목 + 대기 시간 */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/oracle/${oracle.id}`}
            className="text-sm font-bold text-white hover:text-oracle-glow transition-colors inline-flex items-start gap-1"
          >
            <span className="line-clamp-2 leading-snug">{oracle.title}</span>
            <ExternalLink className="w-3 h-3 shrink-0 mt-1 text-slate-500" />
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
            <span>{oracle.category}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {oracle.totalParticipants.toLocaleString()}명
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-oracle-trending">
              <Coins className="w-3 h-3" />
              {oracle.totalPool.toLocaleString()}P
            </span>
          </div>
        </div>
        <span
          className={clsx(
            "shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1",
            waited?.stale
              ? "bg-oracle-hot/15 border-oracle-hot/40 text-oracle-hot"
              : "bg-slate-800 border-slate-700 text-slate-400"
          )}
        >
          <Clock className="w-3 h-3" />
          {waited?.label ?? "—"}
        </span>
      </div>

      {/* 판정 근거 — 배팅 분포 */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-slate-400">어디에 걸었나</p>
        {oracle.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id === selected ? null : opt.id)}
            className={clsx(
              "w-full text-left p-2.5 rounded-xl border transition-all",
              selected === opt.id
                ? "bg-emerald-500/15 border-emerald-500/60"
                : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">
                {opt.label}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                {opt.totalBets.toLocaleString()}명
              </span>
              <span className="text-sm font-bold text-white tabular-nums w-11 text-right">
                {opt.percentage}%
              </span>
              {selected === opt.id && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  selected === opt.id
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-oracle-purple to-oracle-glow"
                )}
                style={{ width: `${opt.percentage}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* 메모 */}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="판정 근거 (선택) — 기록에 남습니다"
        maxLength={200}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple transition-colors"
      />

      {/* 결정 */}
      {confirmVoid ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-2">
          <p className="text-xs text-white leading-relaxed">
            <span className="font-bold text-red-400">무효 처리</span>하면 이 예언에 걸린
            <span className="font-bold"> {oracle.totalPool.toLocaleString()}P</span> 가 참여자에게
            그대로 환불됩니다. 승부로 치지 않으므로 연승과 적중률에는 영향이 없습니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onVoid(note);
                setConfirmVoid(false);
              }}
              className="flex-1 py-2 rounded-lg bg-red-500/80 text-white text-xs font-bold hover:bg-red-500 transition-colors"
            >
              무효 처리하고 전원 환불
            </button>
            <button
              onClick={() => setConfirmVoid(false)}
              className="px-3 py-2 rounded-lg border border-slate-600 text-xs text-slate-400 hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => selected && onSettle(selected, note)}
            disabled={!selected}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selected ? "이 선택지를 정답으로 확정" : "정답을 선택하세요"}
          </button>
          <button
            onClick={() => setConfirmVoid(true)}
            title="판정할 수 없는 예언을 무효 처리합니다"
            className="px-3 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Ban className="w-3.5 h-3.5" /> 무효
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────── */

function ReviewHistory({
  reviews,
}: {
  reviews: ReturnType<typeof useOracles>["reviews"];
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-white">결재 기록</h2>
      </div>
      <div className="rounded-2xl border border-oracle-border bg-oracle-card divide-y divide-oracle-border overflow-hidden">
        {reviews.slice(0, 15).map((r) => (
          <div key={r.id} className="px-4 py-2.5 flex items-start gap-2.5">
            <span
              className={clsx(
                "text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                r.action === "void"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-emerald-500/15 text-emerald-400"
              )}
            >
              {r.action === "void" ? "무효" : "확정"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white line-clamp-1">{r.oracleTitle}</p>
              <p className="text-[11px] text-slate-500">
                {r.decidedByName}
                {r.winningOptionLabel && ` · 정답: ${r.winningOptionLabel}`}
                {r.affectedBets > 0 && ` · ${r.affectedBets}건`}
                {r.note && ` · ${r.note}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
