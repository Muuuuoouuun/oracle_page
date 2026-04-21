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
  text: string;
  likes: number;
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
