import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { oddsFor, recalcOptions } from "./betting.ts";
import type { BetOption } from "./types.ts";

function opt(id: string, totalBets: number): BetOption {
  return { id, label: id, percentage: 0, totalBets, odds: 1 };
}

const sum = (opts: BetOption[]) => opts.reduce((s, o) => s + o.percentage, 0);

describe("oddsFor", () => {
  test("선택률이 낮을수록 배당이 높다", () => {
    assert.ok(oddsFor(20) > oddsFor(50));
    assert.ok(oddsFor(50) > oddsFor(80));
  });

  test("하우스 엣지 10% 가 적용된다", () => {
    // 50% -> 0.9 / 0.5 = 1.8
    assert.equal(oddsFor(50), 1.8);
    // 25% -> 0.9 / 0.25 = 3.6
    assert.equal(oddsFor(25), 3.6);
  });

  test("배당은 1.05 아래로 내려가지 않는다", () => {
    assert.ok(oddsFor(99) >= 1.05);
    assert.ok(oddsFor(100) >= 1.05);
  });

  test("0% 나 음수가 들어와도 터지지 않는다", () => {
    assert.ok(Number.isFinite(oddsFor(0)));
    assert.ok(Number.isFinite(oddsFor(-10)));
  });
});

describe("recalcOptions", () => {
  test("배팅이 없으면 균등 분배하고 합이 100", () => {
    const r = recalcOptions([opt("a", 0), opt("b", 0), opt("c", 0)]);
    assert.equal(sum(r), 100);
    assert.deepEqual(r.map((o) => o.percentage), [34, 33, 33]);
  });

  test("배팅 수 비율대로 선택률이 정해진다", () => {
    const r = recalcOptions([opt("a", 75), opt("b", 25)]);
    assert.deepEqual(r.map((o) => o.percentage), [75, 25]);
  });

  test("나누어떨어지지 않아도 합이 정확히 100 (최대잔여법)", () => {
    // 1/3 씩 -> 33.33... 세 개
    const r = recalcOptions([opt("a", 1), opt("b", 1), opt("c", 1)]);
    assert.equal(sum(r), 100);
  });

  test("여러 조합에서도 합은 항상 100", () => {
    const cases: number[][] = [
      [1, 2], [7, 11, 13], [1, 1, 1, 1], [999, 1], [5, 5, 5], [1, 2, 3, 4],
    ];
    for (const counts of cases) {
      const r = recalcOptions(counts.map((n, i) => opt(String(i), n)));
      assert.equal(sum(r), 100, `합이 100 이 아님: ${counts.join(",")}`);
    }
  });

  test("선택률에 맞춰 배당도 다시 계산된다", () => {
    const r = recalcOptions([opt("a", 75), opt("b", 25)]);
    assert.equal(r[0].odds, oddsFor(75));
    assert.equal(r[1].odds, oddsFor(25));
    assert.ok(r[1].odds > r[0].odds, "인기 없는 쪽 배당이 더 높아야 한다");
  });

  test("빈 배열을 넣어도 터지지 않는다", () => {
    assert.deepEqual(recalcOptions([]), []);
  });

  test("원본 배열을 변형하지 않는다", () => {
    const input = [opt("a", 3), opt("b", 1)];
    recalcOptions(input);
    assert.equal(input[0].percentage, 0);
    assert.equal(input[0].odds, 1);
  });
});
