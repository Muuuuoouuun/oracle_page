import type { GradeId } from "./grades";

export type OracleCategory =
  | "경제/주식"
  | "스포츠"
  | "정치"
  | "엔터테인먼트"
  | "기술/AI"
  | "날씨/자연"
  | "사회/문화";

/**
 * 예언의 생애.
 *
 *   upcoming → live → awaiting → closed
 *                        └──────→ voided
 *
 * - `awaiting` : 마감됐지만 관리자가 아직 정답을 확정하지 않음
 * - `closed`   : 정답이 확정되고 정산까지 끝남
 * - `voided`   : 판정 불가로 무효 처리되어 전원 환불됨
 */
export type OracleStatus = "live" | "upcoming" | "awaiting" | "closed" | "voided";

export type UserRole = "user" | "admin";

export interface BetOption {
  id: string;
  label: string;
  percentage: number;
  totalBets: number;
  odds: number;
}

export interface Oracle {
  id: string;
  title: string;
  description: string;
  category: OracleCategory;
  status: OracleStatus;
  options: BetOption[];
  totalParticipants: number;
  totalPool: number;
  endsAt: Date;
  createdAt: Date;
  isHot: boolean;
  isTrending: boolean;
  isNew: boolean;
  tags: string[];
  commentCount: number;
  creatorName: string;
  creatorAvatar: string;
  /** 종료된 예언의 정답 옵션 id. status === "closed" 일 때만 설정됨. */
  winningOptionId?: string;
  /** 승인 큐에 들어온 시각. status === "awaiting" 일 때만 설정됨. */
  awaitingSince?: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  points: number;
  accuracy: number;
  totalBets: number;
  wonBets: number;
  gradeId: GradeId;
  gradeOverride: boolean;
  joinedAt: Date;
  lastActive: Date;
  isBanned: boolean;
  banReason?: string;
  /** 현재 연승 (적중 시 +1, 실패 시 0) */
  currentStreak: number;
  /** 역대 최고 연승 */
  bestStreak: number;
  /** 마지막 일일 보너스 수령 시각 */
  lastDailyBonusAt?: Date;
}

/** 커뮤니티 활동 티커에 흐르는 배팅 기록 */
export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  gradeId: GradeId;
  oracleId: string;
  oracleTitle: string;
  optionLabel: string;
  amount: number;
  createdAt: Date;
}

export interface UserBet {
  oracleId: string;
  optionId: string;
  amount: number;
  placedAt: Date;
}

/** `refunded` 는 예언이 무효 처리되어 원금을 돌려받은 상태 (승패가 아니다) */
export type BetStatus = "pending" | "won" | "lost" | "refunded";

export interface MyBetRecord extends UserBet {
  id: string;
  oracleTitle: string;
  optionLabel: string;
  /** 배팅 시점에 확정된 배당률. 이후 시장 배당이 변해도 정산은 이 값으로 한다. */
  odds: number;
  /** 배팅 시점 등급의 배당 보너스 (0.15 = +15%) */
  gradeBonus: number;
  /** 배팅 시점 연승의 배당 보너스 */
  streakBonus: number;
  status: BetStatus;
  payout?: number;
}

export interface Notification {
  id: string;
  type: "bet_result" | "grade_up" | "deadline" | "comment" | "system";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  oracleId?: string;
}

export interface Comment {
  id: string;
  oracleId: string;
  author: string;
  avatar: string;
  gradeId: GradeId;
  text: string;
  likes: number;
  /** 내가 좋아요를 눌렀는지 */
  likedByMe: boolean;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalOracles: number;
  liveOracles: number;
  totalBetsToday: number;
  totalPointsCirculating: number;
  newUsersThisWeek: number;
  avgAccuracy: number;
}
