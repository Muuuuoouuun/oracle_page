import type { GradeId } from "./grades";

export type OracleCategory =
  | "경제/주식"
  | "스포츠"
  | "정치"
  | "엔터테인먼트"
  | "기술/AI"
  | "날씨/자연"
  | "사회/문화";

export type OracleStatus = "live" | "upcoming" | "closed";

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
