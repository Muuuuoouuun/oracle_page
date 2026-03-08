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

export const GRADES: Grade[] = [
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
    perks: ["커뮤니티 피드 열람", "기본 예언 참여"],
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
    perks: ["커뮤니티 댓글 작성", "예언 북마크", "기본 배팅 참여"],
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
    perks: ["예언 생성 (일 3개)", "특별 배팅 옵션", "커뮤니티 좋아요 강화", "주간 보너스 포인트"],
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
    perks: ["예언 생성 (일 10개)", "하이배팅 참여", "예언 편집 권한", "월간 보너스 이벤트", "전용 뱃지"],
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
    perks: ["무제한 예언 생성", "VIP 예언 채널 접근", "포인트 2배 이벤트 참여", "커뮤니티 투표 가중치 x2", "희귀 뱃지"],
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
    perks: ["전설 전용 예언 카테고리", "포인트 3배 이벤트", "다른 유저 예언 추천 기능", "관리자 예언 검토 요청", "전설 전용 뱃지 + 테두리"],
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
    perks: ["모든 기능 무제한 사용", "포인트 5배 이벤트", "신의 예언 채널", "홈 피처드 노출", "황금 테두리 + 특별 이펙트", "관리자 소통 채널"],
    accuracyBonus: 30,
  },
];

/** 포인트로 등급 조회 */
export function getGradeByPoints(points: number): Grade {
  return (
    [...GRADES].reverse().find((g) => points >= g.minPoints) ?? GRADES[0]
  );
}

/** 등급 ID로 등급 조회 */
export function getGradeById(id: GradeId): Grade {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/** 다음 등급까지 남은 포인트 */
export function getNextGradeProgress(points: number): {
  current: Grade;
  next: Grade | null;
  progress: number;       // 0-100
  pointsNeeded: number;
} {
  const current = getGradeByPoints(points);
  const nextIndex = GRADES.findIndex((g) => g.id === current.id) + 1;
  const next = nextIndex < GRADES.length ? GRADES[nextIndex] : null;

  if (!next || current.maxPoints === null) {
    return { current, next: null, progress: 100, pointsNeeded: 0 };
  }

  const rangeTotal = next.minPoints - current.minPoints;
  const rangeProgress = points - current.minPoints;
  const progress = Math.min(100, Math.round((rangeProgress / rangeTotal) * 100));
  const pointsNeeded = next.minPoints - points;

  return { current, next, progress, pointsNeeded };
}
