import type { MyBetRecord } from "./types";

/**
 * 정산 계산.
 *
 * 포인트가 오가는 부분이라 UI 에서 떼어내 순수 함수로 둔다. (테스트: lib/settlement.test.ts)
 * 배당과 보너스는 모두 **배팅 시점에 고정된 값**을 쓴다. 배팅 이후 시장 배당이
 * 움직여도 이미 건 사람의 몫은 변하지 않는다.
 */

/** 적중 시 받게 되는 총액(원금 포함). 실패하면 0. */
export function payoutFor(bet: Pick<MyBetRecord, "amount" | "odds" | "gradeBonus" | "streakBonus">): number {
  const rate = 1 + bet.gradeBonus + bet.streakBonus;
  return Math.floor(bet.amount * bet.odds * rate);
}

/** 원금을 뺀 순수익. 화면에 "예상 수익"으로 보여주는 값. */
export function profitFor(bet: Pick<MyBetRecord, "amount" | "odds" | "gradeBonus" | "streakBonus">): number {
  return payoutFor(bet) - bet.amount;
}

export interface SettlementResult {
  /** 정산이 반영된 전체 배팅 목록 (입력 순서 유지) */
  bets: MyBetRecord[];
  /** 이번 정산으로 지급할 총 포인트 */
  totalPayout: number;
  currentStreak: number;
  bestStreak: number;
  /** 승패가 확정된 배팅 중 적중한 수 */
  wonBets: number;
  /** 승패가 확정된 배팅 기준 적중률 (0-100) */
  accuracy: number;
  /** 이번에 실제로 정산된 배팅 수 */
  settledCount: number;
}

export interface RefundResult {
  /** 환불이 반영된 전체 배팅 목록 (입력 순서 유지) */
  bets: MyBetRecord[];
  /** 돌려줄 원금 합계 */
  totalRefund: number;
  /** 실제로 환불된 배팅 수 */
  refundedCount: number;
}

/**
 * 판정 불가로 무효 처리된 예언의 배팅을 환불한다.
 *
 * 승부가 아니었으므로 **연승과 적중률에는 영향을 주지 않는다.** 원금만 그대로
 * 돌려준다. 이미 승패가 갈린 배팅은 건드리지 않는다.
 */
export function refundBets(bets: MyBetRecord[], oracleIds: Set<string>): RefundResult {
  let totalRefund = 0;
  let refundedCount = 0;

  const next = bets.map((b) => {
    if (b.status !== "pending" || !oracleIds.has(b.oracleId)) return b;
    totalRefund += b.amount;
    refundedCount += 1;
    return { ...b, status: "refunded" as const, payout: b.amount };
  });

  return { bets: next, totalRefund, refundedCount };
}

/**
 * 정답이 확정된 예언들에 대해 미정산 배팅을 정산한다.
 *
 * - 이미 won/lost/refunded 인 배팅은 건드리지 않는다 → 재정산해도 이중 지급되지 않는다.
 * - 연승은 배팅한 순서대로 계산해야 하므로 placedAt 오름차순으로 처리한다.
 */
export function settleBets(
  bets: MyBetRecord[],
  winnerByOracle: Map<string, string>,
  startStreak: number,
  startBest: number
): SettlementResult {
  const pending = bets
    .filter((b) => b.status === "pending" && winnerByOracle.has(b.oracleId))
    .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());

  let currentStreak = startStreak;
  let bestStreak = startBest;
  let totalPayout = 0;
  const settled = new Map<string, MyBetRecord>();

  for (const bet of pending) {
    const won = bet.optionId === winnerByOracle.get(bet.oracleId);
    const payout = won ? payoutFor(bet) : 0;
    totalPayout += payout;
    currentStreak = won ? currentStreak + 1 : 0;
    if (currentStreak > bestStreak) bestStreak = currentStreak;
    settled.set(bet.id, { ...bet, status: won ? "won" : "lost", payout });
  }

  const next = bets.map((b) => settled.get(b.id) ?? b);
  // 무효 환불(refunded)은 승부가 아니므로 적중률 분모에 넣지 않는다.
  const decided = next.filter((b) => b.status === "won" || b.status === "lost");
  const wonBets = decided.filter((b) => b.status === "won").length;

  return {
    bets: next,
    totalPayout,
    currentStreak,
    bestStreak,
    wonBets,
    accuracy: decided.length ? Math.round((wonBets / decided.length) * 100) : 0,
    settledCount: pending.length,
  };
}
