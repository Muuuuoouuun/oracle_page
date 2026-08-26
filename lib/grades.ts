export type GradeId =
  | "magikarp"
  | "bulbasaur"
  | "pikachu"
  | "growlithe"
  | "mew"
  | "mewtwo"
  | "arceus";

export interface Grade {
  id: GradeId;
  rank: number;              // 1 = lowest
  name: string;              // 포켓몬 이름 (한국어)
  englishName: string;
  emoji: string;
  title: string;             // 예언가 칭호
  description: string;
  minPoints: number;
  maxPoints: number | null;  // null = no ceiling
  color: string;             // tailwind text color
  bgColor: string;           // tailwind bg color
  borderColor: string;
  glowColor: string;         // css shadow color
  perks: string[];           // special abilities/perks
  accuracyBonus: number;     // % bonus to grade upgrade threshold reduction
}

/**
 * 등급별 혜택 목록은 실제 동작하는 규칙에서만 생성한다.
 * 여기에 없는 혜택은 코드에도 없다는 뜻 — 문구와 구현이 어긋날 수 없게 만든 장치.
 */
function perksFor(g: { rank: number; accuracyBonus: number }): string[] {
  const perks: string[] = [];

  const limit = dailyOracleLimit(g.rank);
  if (limit === 0) perks.push("커뮤니티 피드 열람");
  else if (limit === Infinity) perks.push("예언 생성 무제한");
  else perks.push(`예언 생성 (일 ${limit}개)`);

  perks.push("예언 참여 · 배팅");
  if (g.rank >= 2) perks.push("커뮤니티 댓글 작성");
  perks.push(`일일 보너스 ${dailyBonusFor(g.rank).toLocaleString()}P`);
  if (g.accuracyBonus > 0) perks.push(`적중 시 배당 +${g.accuracyBonus}%`);

  return perks;
}

const BASE_GRADES: Omit<Grade, "perks">[] = [
  {
    id: "magikarp",
    rank: 1,
    name: "잉어킹",
    englishName: "Magikarp",
    emoji: "🐟",
    title: "꼬꼬마 예언가",
    description: "튀어라! 잉어킹! 아직은 물만 튀기는 초보 예언가지만, 가능성은 무한합니다.",
    minPoints: 0,
    maxPoints: 999,
    color: "text-slate-400",
    bgColor: "bg-slate-500/15",
    borderColor: "border-slate-600/50",
    glowColor: "rgba(148,163,184,0.3)",
    accuracyBonus: 0,
  },
  {
    id: "bulbasaur",
    rank: 2,
    name: "이상해씨",
    englishName: "Bulbasaur",
    emoji: "🌱",
    title: "새싹 예언가",
    description: "등에 씨앗을 품고 성장 중! 작지만 탄탄한 예언력을 쌓아가는 중입니다.",
    minPoints: 1000,
    maxPoints: 4999,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-600/50",
    glowColor: "rgba(52,211,153,0.3)",
    accuracyBonus: 5,
  },
  {
    id: "pikachu",
    rank: 3,
    name: "피카츄",
    englishName: "Pikachu",
    emoji: "⚡",
    title: "번개 예언가",
    description: "피카피카! 전기처럼 빠른 직감으로 예언을 적중시키는 주목받는 예언가!",
    minPoints: 5000,
    maxPoints: 14999,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    borderColor: "border-yellow-500/50",
    glowColor: "rgba(250,204,21,0.3)",
    accuracyBonus: 10,
  },
  {
    id: "growlithe",
    rank: 4,
    name: "가디",
    englishName: "Growlithe",
    emoji: "🔥",
    title: "불꽃 예언가",
    description: "타오르는 직감! 뜨거운 예언 본능으로 커뮤니티를 이끄는 실력자입니다.",
    minPoints: 15000,
    maxPoints: 29999,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    borderColor: "border-orange-500/50",
    glowColor: "rgba(251,146,60,0.4)",
    accuracyBonus: 15,
  },
  {
    id: "mew",
    rank: 5,
    name: "뮤",
    englishName: "Mew",
    emoji: "🌸",
    title: "희귀 예언가",
    description: "환상적인 존재! 모든 기술을 쓸 수 있는 뮤처럼, 완벽한 예언 능력을 갖추고 있습니다.",
    minPoints: 30000,
    maxPoints: 59999,
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
    borderColor: "border-pink-500/50",
    glowColor: "rgba(244,114,182,0.4)",
    accuracyBonus: 20,
  },
  {
    id: "mewtwo",
    rank: 6,
    name: "뮤츠",
    englishName: "Mewtwo",
    emoji: "💜",
    title: "전설 예언가",
    description: "인간이 만든 최강의 존재. 압도적인 예언 적중률과 포인트로 전설의 경지에 올랐습니다.",
    minPoints: 60000,
    maxPoints: 99999,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    borderColor: "border-purple-500/50",
    glowColor: "rgba(192,132,252,0.5)",
    accuracyBonus: 25,
  },
  {
    id: "arceus",
    rank: 7,
    name: "아르세우스",
    englishName: "Arceus",
    emoji: "👑",
    title: "신의 예언가",
    description: "포켓몬의 신이자 최초의 존재. 오라클 페이지의 살아있는 전설. 당신이 바로 예언 그 자체입니다.",
    minPoints: 100000,
    maxPoints: null,
    color: "text-amber-300",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-400/60",
    glowColor: "rgba(252,211,77,0.6)",
    accuracyBonus: 30,
  },
];

/** 혜택 문구는 perksFor 가 이 규칙들에서 직접 생성한다. */
export const GRADES: Grade[] = BASE_GRADES.map((g) => ({ ...g, perks: perksFor(g) }));

/**
 * 등급별 하루 예언 생성 한도. (잉어킹은 생성 불가 → 0)
 */
export function dailyOracleLimit(rank: number): number {
  if (rank <= 1) return 0;
  if (rank === 2) return 3;
  if (rank === 3) return 5;
  if (rank === 4) return 10;
  return Infinity;
}

/** 등급별 일일 출석 보너스 포인트. */
export function dailyBonusFor(rank: number): number {
  return 200 + (rank - 1) * 150;
}

/** 포인트가 이 아래로 떨어지면 재기 지원금을 받을 수 있다. */
export const RELIEF_THRESHOLD = 50;
/** 재기 지원금 수령 후 보장되는 최소 잔고. */
export const RELIEF_FLOOR = 100;

/** 연승 구간별 추가 배당 비율. 3연승부터 붙는다. */
export function streakBonusRate(streak: number): number {
  if (streak >= 7) return 0.15;
  if (streak >= 5) return 0.1;
  if (streak >= 3) return 0.05;
  return 0;
}

/** 등급별 최소 포인트 기준. 관리자 페이지에서 변경 가능. */
export type GradeThresholds = Record<GradeId, number>;

export const DEFAULT_THRESHOLDS: GradeThresholds = GRADES.reduce((acc, g) => {
  acc[g.id] = g.minPoints;
  return acc;
}, {} as GradeThresholds);

/**
 * 임계값을 적용한 등급 목록을 만든다.
 * 최하위 등급은 항상 0P로 고정되고, 각 등급의 maxPoints는 다음 등급 기준에서 파생된다.
 * 입력이 순서에 어긋나도(예: 상위 등급이 하위보다 낮게 지정) rank 순으로 단조 증가하도록 보정한다.
 */
export function resolveGrades(thresholds?: Partial<GradeThresholds>): Grade[] {
  const byRank = [...GRADES].sort((a, b) => a.rank - b.rank);

  // 1) 임계값 정규화: 0 이상, rank 순으로 단조 증가
  let prev = -1;
  const mins = byRank.map((g, i) => {
    if (i === 0) {
      prev = 0;
      return 0; // 최하위 등급은 0P 고정
    }
    const raw = thresholds?.[g.id] ?? DEFAULT_THRESHOLDS[g.id];
    const min = Math.max(prev + 1, Math.max(0, Math.floor(raw)));
    prev = min;
    return min;
  });

  // 2) maxPoints는 다음 등급의 min - 1, 최상위는 null
  return byRank.map((g, i) => ({
    ...g,
    minPoints: mins[i],
    maxPoints: i === byRank.length - 1 ? null : mins[i + 1] - 1,
  }));
}

/** 포인트로 등급 조회 */
export function getGradeByPoints(points: number, grades: Grade[] = GRADES): Grade {
  return (
    [...grades].sort((a, b) => b.rank - a.rank).find((g) => points >= g.minPoints) ??
    grades[0]
  );
}

/** 등급 ID로 등급 조회 */
export function getGradeById(id: GradeId, grades: Grade[] = GRADES): Grade {
  return grades.find((g) => g.id === id) ?? grades[0];
}

/** 다음 등급까지 남은 포인트 */
export function getNextGradeProgress(
  points: number,
  grades: Grade[] = GRADES
): {
  current: Grade;
  next: Grade | null;
  progress: number;       // 0-100
  pointsNeeded: number;
} {
  const byRank = [...grades].sort((a, b) => a.rank - b.rank);
  const current = getGradeByPoints(points, byRank);
  const nextIndex = byRank.findIndex((g) => g.id === current.id) + 1;
  const next = nextIndex < byRank.length ? byRank[nextIndex] : null;

  if (!next || current.maxPoints === null) {
    return { current, next: null, progress: 100, pointsNeeded: 0 };
  }

  const rangeTotal = next.minPoints - current.minPoints;
  const rangeProgress = points - current.minPoints;
  const progress =
    rangeTotal > 0
      ? Math.max(0, Math.min(100, Math.round((rangeProgress / rangeTotal) * 100)))
      : 100;
  const pointsNeeded = Math.max(0, next.minPoints - points);

  return { current, next, progress, pointsNeeded };
}
