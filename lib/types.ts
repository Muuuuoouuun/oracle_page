export type OracleCategory =
  | "경제/주식"
  | "스포츠"
  | "정치"
  | "엔터테인먼트"
  | "기술/AI"
  | "날씨/자연"
  | "사회/문화";

export type OracleStatus = "live" | "upcoming" | "closed";

export interface BetOption {
  id: string;
  label: string;
  percentage: number;      // current vote share
  totalBets: number;
  odds: number;            // payout multiplier
}

export interface Oracle {
  id: string;
  title: string;
  description: string;
  category: OracleCategory;
  status: OracleStatus;
  options: BetOption[];
  totalParticipants: number;
  totalPool: number;       // total points in pool
  endsAt: Date;
  createdAt: Date;
  isHot: boolean;         // high activity
  isTrending: boolean;    // fast growing
  isNew: boolean;
  tags: string[];
  commentCount: number;
  creatorName: string;
  creatorAvatar: string;
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
