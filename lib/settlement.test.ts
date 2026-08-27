import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { payoutFor, profitFor, refundBets, settleBets } from "./settlement.ts";
import type { MyBetRecord } from "./types.ts";

let seq = 0;
function bet(over: Partial<MyBetRecord> = {}): MyBetRecord {
  seq += 1;
  return {
    id: `b${seq}`,
    oracleId: "o1",
    optionId: "a",
    optionLabel: "예",
    oracleTitle: "테스트 예언",
    amount: 100,
    odds: 2,
    gradeBonus: 0,
    streakBonus: 0,
    placedAt: new Date(2026, 0, 1, 0, seq),
    status: "pending",
    ...over,
  };
}

const winners = (m: Record<string, string>) => new Map(Object.entries(m));

describe("payoutFor / profitFor", () => {
  test("보너스가 없으면 원금 x 배당", () => {
    assert.equal(payoutFor(bet({ amount: 100, odds: 2 })), 200);
    assert.equal(profitFor(bet({ amount: 100, odds: 2 })), 100);
  });

  test("등급·연승 보너스는 더해져서 배당에 곱해진다", () => {
    // 100 x 1.55 x (1 + 0.05) = 162.75 -> 162
    assert.equal(payoutFor(bet({ amount: 100, odds: 1.55, gradeBonus: 0.05 })), 162);
    // 100 x 2 x (1 + 0.15 + 0.1) = 250
    assert.equal(payoutFor(bet({ amount: 100, odds: 2, gradeBonus: 0.15, streakBonus: 0.1 })), 250);
  });

  test("소수점은 유저에게 불리하지 않게 버림 처리한다", () => {
    assert.equal(payoutFor(bet({ amount: 33, odds: 1.7 })), 56); // 56.1
    assert.equal(payoutFor(bet({ amount: 1, odds: 1.05 })), 1); // 1.05
  });
});

describe("settleBets", () => {
  test("적중하면 지급액이 잡히고 실패하면 0", () => {
    const bets = [bet({ id: "win", optionId: "a" }), bet({ id: "lose", optionId: "b" })];
    const r = settleBets(bets, winners({ o1: "a" }), 0, 0);

    assert.equal(r.totalPayout, 200);
    assert.equal(r.bets.find((b) => b.id === "win")?.status, "won");
    assert.equal(r.bets.find((b) => b.id === "win")?.payout, 200);
    assert.equal(r.bets.find((b) => b.id === "lose")?.status, "lost");
    assert.equal(r.bets.find((b) => b.id === "lose")?.payout, 0);
    assert.equal(r.settledCount, 2);
  });

  test("정답이 확정되지 않은 예언의 배팅은 건드리지 않는다", () => {
    const bets = [bet({ oracleId: "o1" }), bet({ id: "other", oracleId: "o2" })];
    const r = settleBets(bets, winners({ o1: "a" }), 0, 0);

    assert.equal(r.bets.find((b) => b.id === "other")?.status, "pending");
    assert.equal(r.settledCount, 1);
  });

  test("이미 정산된 배팅은 재정산되지 않는다 — 이중 지급 방지", () => {
    const bets = [bet({ id: "done", optionId: "a", status: "won", payout: 200 })];
    const r = settleBets(bets, winners({ o1: "a" }), 0, 0);

    assert.equal(r.totalPayout, 0, "이미 지급된 건에 다시 지급하면 안 된다");
    assert.equal(r.settledCount, 0);
    assert.equal(r.bets[0].payout, 200);
  });

  test("연승은 배팅한 순서대로 누적되고 실패하면 0으로 끊긴다", () => {
    const bets = [
      bet({ id: "1", oracleId: "a", optionId: "win", placedAt: new Date(2026, 0, 1, 1) }),
      bet({ id: "2", oracleId: "b", optionId: "win", placedAt: new Date(2026, 0, 1, 2) }),
      bet({ id: "3", oracleId: "c", optionId: "lose", placedAt: new Date(2026, 0, 1, 3) }),
      bet({ id: "4", oracleId: "d", optionId: "win", placedAt: new Date(2026, 0, 1, 4) }),
    ];
    const r = settleBets(bets, winners({ a: "win", b: "win", c: "win", d: "win" }), 0, 0);

    assert.equal(r.currentStreak, 1, "마지막 적중 이후 연승은 1");
    assert.equal(r.bestStreak, 2, "중간에 2연승이 있었다");
  });

  test("입력 순서가 뒤섞여도 시간 순으로 연승을 계산한다", () => {
    const bets = [
      bet({ id: "late", oracleId: "b", optionId: "lose", placedAt: new Date(2026, 0, 1, 9) }),
      bet({ id: "early", oracleId: "a", optionId: "win", placedAt: new Date(2026, 0, 1, 1) }),
    ];
    const r = settleBets(bets, winners({ a: "win", b: "win" }), 0, 0);

    // 시간순이면 적중(1) 후 실패(0)
    assert.equal(r.currentStreak, 0);
    assert.equal(r.bestStreak, 1);
  });

  test("기존 연승 기록을 이어받는다", () => {
    const bets = [bet({ optionId: "a" })];
    const r = settleBets(bets, winners({ o1: "a" }), 4, 9);

    assert.equal(r.currentStreak, 5);
    assert.equal(r.bestStreak, 9, "최고 기록을 넘지 못하면 그대로");
  });

  test("최고 연승을 넘어서면 갱신된다", () => {
    const bets = [bet({ optionId: "a" })];
    const r = settleBets(bets, winners({ o1: "a" }), 9, 9);

    assert.equal(r.currentStreak, 10);
    assert.equal(r.bestStreak, 10);
  });

  test("적중률은 승패가 확정된 배팅만으로 계산한다", () => {
    const bets = [
      bet({ id: "1", oracleId: "a", optionId: "win" }),
      bet({ id: "2", oracleId: "b", optionId: "lose" }),
      bet({ id: "3", oracleId: "c", optionId: "x" }), // 미확정 예언
    ];
    const r = settleBets(bets, winners({ a: "win", b: "win" }), 0, 0);

    assert.equal(r.wonBets, 1);
    assert.equal(r.accuracy, 50, "진행 중인 배팅은 분모에 넣지 않는다");
  });

  test("정산할 게 없으면 통계가 그대로다", () => {
    const r = settleBets([], new Map(), 3, 7);
    assert.equal(r.totalPayout, 0);
    assert.equal(r.currentStreak, 3);
    assert.equal(r.bestStreak, 7);
    assert.equal(r.accuracy, 0);
  });

  test("원본 배열을 변형하지 않는다", () => {
    const bets = [bet({ optionId: "a" })];
    settleBets(bets, winners({ o1: "a" }), 0, 0);
    assert.equal(bets[0].status, "pending");
    assert.equal(bets[0].payout, undefined);
  });

  test("무효 환불은 적중률 분모에 들어가지 않는다", () => {
    const bets = [
      bet({ id: "1", oracleId: "a", optionId: "win" }),
      bet({ id: "2", oracleId: "b", optionId: "lose" }),
      bet({ id: "3", oracleId: "c", status: "refunded", payout: 100 }),
    ];
    const r = settleBets(bets, winners({ a: "win", b: "win" }), 0, 0);

    assert.equal(r.wonBets, 1);
    assert.equal(r.accuracy, 50, "환불된 건은 승부가 아니다");
  });
});

describe("refundBets", () => {
  test("원금을 그대로 돌려주고 상태를 refunded 로 바꾼다", () => {
    const bets = [bet({ id: "x", oracleId: "o1", amount: 250 })];
    const r = refundBets(bets, new Set(["o1"]));

    assert.equal(r.totalRefund, 250);
    assert.equal(r.refundedCount, 1);
    assert.equal(r.bets[0].status, "refunded");
    assert.equal(r.bets[0].payout, 250, "환불액은 원금과 같다");
  });

  test("배당·보너스가 붙어 있어도 원금만 돌려준다", () => {
    const bets = [bet({ amount: 100, odds: 3, gradeBonus: 0.2, streakBonus: 0.15 })];
    const r = refundBets(bets, new Set(["o1"]));
    assert.equal(r.totalRefund, 100, "무효는 승부가 아니므로 배당을 쳐주지 않는다");
  });

  test("무효가 아닌 예언의 배팅은 건드리지 않는다", () => {
    const bets = [bet({ oracleId: "o1" }), bet({ id: "other", oracleId: "o2" })];
    const r = refundBets(bets, new Set(["o1"]));

    assert.equal(r.refundedCount, 1);
    assert.equal(r.bets.find((b) => b.id === "other")?.status, "pending");
  });

  test("이미 승패가 갈린 배팅은 환불하지 않는다 — 이중 지급 방지", () => {
    const bets = [
      bet({ id: "w", oracleId: "o1", status: "won", payout: 300 }),
      bet({ id: "l", oracleId: "o1", status: "lost", payout: 0 }),
    ];
    const r = refundBets(bets, new Set(["o1"]));

    assert.equal(r.totalRefund, 0);
    assert.equal(r.refundedCount, 0);
    assert.equal(r.bets[0].payout, 300);
  });

  test("이미 환불된 건을 다시 환불하지 않는다", () => {
    const bets = [bet({ oracleId: "o1", status: "refunded", payout: 100 })];
    const r = refundBets(bets, new Set(["o1"]));
    assert.equal(r.totalRefund, 0);
    assert.equal(r.refundedCount, 0);
  });

  test("대상이 없으면 아무 일도 없다", () => {
    const bets = [bet({ oracleId: "o1" })];
    const r = refundBets(bets, new Set());
    assert.equal(r.totalRefund, 0);
    assert.equal(r.bets[0].status, "pending");
  });

  test("원본 배열을 변형하지 않는다", () => {
    const bets = [bet({ oracleId: "o1" })];
    refundBets(bets, new Set(["o1"]));
    assert.equal(bets[0].status, "pending");
  });
});
