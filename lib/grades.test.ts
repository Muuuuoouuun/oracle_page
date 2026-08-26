import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THRESHOLDS,
  GRADES,
  dailyBonusFor,
  dailyOracleLimit,
  getGradeByPoints,
  getNextGradeProgress,
  resolveGrades,
  streakBonusRate,
  type GradeThresholds,
} from "./grades.ts";

describe("getGradeByPoints", () => {
  test("포인트 구간에 맞는 등급을 돌려준다", () => {
    assert.equal(getGradeByPoints(0).id, "magikarp");
    assert.equal(getGradeByPoints(999).id, "magikarp");
    assert.equal(getGradeByPoints(1000).id, "bulbasaur");
    assert.equal(getGradeByPoints(5000).id, "pikachu");
    assert.equal(getGradeByPoints(100000).id, "arceus");
    assert.equal(getGradeByPoints(9_999_999).id, "arceus", "최상위 등급은 상한이 없다");
  });

  test("음수 포인트도 최하위 등급으로 떨어진다", () => {
    assert.equal(getGradeByPoints(-500).id, "magikarp");
  });
});

describe("resolveGrades", () => {
  test("기본값은 원래 기준과 같다", () => {
    const g = resolveGrades();
    assert.deepEqual(
      g.map((x) => x.minPoints),
      GRADES.map((x) => x.minPoints)
    );
  });

  test("최하위 등급은 무슨 값을 넣어도 0P 로 고정된다", () => {
    const g = resolveGrades({ magikarp: 5000 });
    assert.equal(g[0].minPoints, 0);
  });

  test("관리자가 기준을 낮추면 승급이 빨라진다", () => {
    const g = resolveGrades({ bulbasaur: 100 });
    assert.equal(getGradeByPoints(150, g).id, "bulbasaur");
    assert.equal(getGradeByPoints(99, g).id, "magikarp");
  });

  test("순서가 뒤집힌 입력도 단조 증가하도록 보정한다", () => {
    // 피카츄를 이상해씨보다 낮게 지정하는 잘못된 입력
    const g = resolveGrades({ bulbasaur: 5000, pikachu: 100 });
    const mins = g.map((x) => x.minPoints);
    for (let i = 1; i < mins.length; i += 1) {
      assert.ok(mins[i] > mins[i - 1], `${i}번째 기준이 이전보다 낮다: ${mins.join(",")}`);
    }
  });

  test("maxPoints 는 다음 등급 기준에서 파생되고 최상위는 null", () => {
    const g = resolveGrades();
    for (let i = 0; i < g.length - 1; i += 1) {
      assert.equal(g[i].maxPoints, g[i + 1].minPoints - 1);
    }
    assert.equal(g[g.length - 1].maxPoints, null);
  });

  test("소수점·음수 입력을 정리한다", () => {
    const g = resolveGrades({ bulbasaur: -100, pikachu: 2000.7 });
    assert.ok(g[1].minPoints >= 0);
    assert.ok(Number.isInteger(g[2].minPoints));
  });
});

describe("getNextGradeProgress", () => {
  test("다음 등급까지의 진행도를 계산한다", () => {
    const r = getNextGradeProgress(0);
    assert.equal(r.current.id, "magikarp");
    assert.equal(r.next?.id, "bulbasaur");
    assert.equal(r.progress, 0);
    assert.equal(r.pointsNeeded, 1000);
  });

  test("구간 중간이면 진행도가 그에 비례한다", () => {
    const r = getNextGradeProgress(500);
    assert.equal(r.progress, 50);
    assert.equal(r.pointsNeeded, 500);
  });

  test("최상위 등급이면 다음이 없다", () => {
    const r = getNextGradeProgress(200000);
    assert.equal(r.current.id, "arceus");
    assert.equal(r.next, null);
    assert.equal(r.progress, 100);
    assert.equal(r.pointsNeeded, 0);
  });

  test("진행도는 0~100 을 벗어나지 않는다", () => {
    for (const p of [-1000, 0, 1, 999, 1000, 50000, 999999]) {
      const r = getNextGradeProgress(p);
      assert.ok(r.progress >= 0 && r.progress <= 100, `진행도 범위 벗어남: ${p} -> ${r.progress}`);
      assert.ok(r.pointsNeeded >= 0, `남은 포인트가 음수: ${p}`);
    }
  });
});

describe("등급 혜택 규칙", () => {
  test("일일 생성 한도는 등급이 오를수록 늘어난다", () => {
    assert.equal(dailyOracleLimit(1), 0, "잉어킹은 예언을 만들 수 없다");
    assert.equal(dailyOracleLimit(2), 3);
    assert.equal(dailyOracleLimit(3), 5);
    assert.equal(dailyOracleLimit(4), 10);
    assert.equal(dailyOracleLimit(5), Infinity);
    assert.equal(dailyOracleLimit(7), Infinity);
  });

  test("일일 보너스도 등급이 오를수록 늘어난다", () => {
    const amounts = GRADES.map((g) => dailyBonusFor(g.rank));
    for (let i = 1; i < amounts.length; i += 1) {
      assert.ok(amounts[i] > amounts[i - 1], "상위 등급 보너스가 더 커야 한다");
    }
  });

  test("연승 보너스는 3연승부터 붙고 구간별로 커진다", () => {
    assert.equal(streakBonusRate(0), 0);
    assert.equal(streakBonusRate(2), 0);
    assert.equal(streakBonusRate(3), 0.05);
    assert.equal(streakBonusRate(4), 0.05);
    assert.equal(streakBonusRate(5), 0.1);
    assert.equal(streakBonusRate(7), 0.15);
    assert.equal(streakBonusRate(100), 0.15, "최고 구간에서 멈춘다");
  });

  test("혜택 문구는 실제 규칙에서 생성된다 — 구현과 어긋날 수 없다", () => {
    for (const g of GRADES) {
      const limit = dailyOracleLimit(g.rank);
      if (limit === 0) {
        assert.ok(
          !g.perks.some((p) => p.includes("예언 생성")),
          `${g.name}: 생성 불가인데 생성 혜택이 적혀 있다`
        );
      } else if (limit !== Infinity) {
        assert.ok(
          g.perks.some((p) => p.includes(`일 ${limit}개`)),
          `${g.name}: 실제 한도(${limit})와 문구가 다르다`
        );
      }

      assert.ok(
        g.perks.some((p) => p.includes(dailyBonusFor(g.rank).toLocaleString())),
        `${g.name}: 일일 보너스 금액이 문구에 없다`
      );

      if (g.accuracyBonus > 0) {
        assert.ok(
          g.perks.some((p) => p.includes(`+${g.accuracyBonus}%`)),
          `${g.name}: 배당 보너스가 문구에 없다`
        );
      }
    }
  });

  test("구현되지 않은 혜택이 문구에 남아 있지 않다", () => {
    const notImplemented = ["VIP", "투표 가중치", "포인트 2배", "포인트 3배", "포인트 5배", "피처드", "편집 권한"];
    for (const g of GRADES) {
      for (const perk of g.perks) {
        for (const banned of notImplemented) {
          assert.ok(
            !perk.includes(banned),
            `${g.name} 의 "${perk}" 는 구현되지 않은 약속이다`
          );
        }
      }
    }
  });
});

describe("DEFAULT_THRESHOLDS", () => {
  test("모든 등급에 대한 기준이 정의돼 있다", () => {
    for (const g of GRADES) {
      assert.equal(typeof DEFAULT_THRESHOLDS[g.id], "number", `${g.id} 기준 누락`);
    }
  });

  test("기준을 그대로 넣으면 원본과 같은 결과", () => {
    const same = resolveGrades(DEFAULT_THRESHOLDS as GradeThresholds);
    assert.deepEqual(
      same.map((g) => g.minPoints),
      GRADES.map((g) => g.minPoints)
    );
  });
});
