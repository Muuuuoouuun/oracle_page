import type { BetOption } from "./types";

/** 하우스 엣지 — 배당률 산출 시 적용되는 마진 (10%) */
const HOUSE_EDGE = 0.9;

/** 배당률은 선택률의 역수에 하우스 엣지를 적용해 산출한다. */
export function oddsFor(percentage: number): number {
  const p = Math.min(99, Math.max(1, percentage)) / 100;
  return Math.max(1.05, Math.round((HOUSE_EDGE / p) * 100) / 100);
}

/**
 * 옵션별 배팅 수로 선택률과 배당률을 다시 계산한다.
 * 반올림 오차로 선택률 합이 100 을 벗어나지 않도록 최대잔여법으로 배분한다.
 */
export function recalcOptions(options: BetOption[]): BetOption[] {
  if (options.length === 0) return options;

  const totalBets = options.reduce((sum, o) => sum + o.totalBets, 0);

  let percentages: number[];
  if (totalBets === 0) {
    // 아직 배팅이 없으면 균등 분배
    const base = Math.floor(100 / options.length);
    const remainder = 100 - base * options.length;
    percentages = options.map((_, i) => base + (i < remainder ? 1 : 0));
  } else {
    const raw = options.map((o) => (o.totalBets / totalBets) * 100);
    const floors = raw.map((v) => Math.floor(v));
    let left = 100 - floors.reduce((a, b) => a + b, 0);
    const byFraction = raw
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac);
    const bumped = new Set<number>();
    for (const { i } of byFraction) {
      if (left <= 0) break;
      bumped.add(i);
      left -= 1;
    }
    percentages = floors.map((f, i) => f + (bumped.has(i) ? 1 : 0));
  }

  return options.map((o, i) => ({
    ...o,
    percentage: percentages[i],
    odds: oddsFor(percentages[i]),
  }));
}
