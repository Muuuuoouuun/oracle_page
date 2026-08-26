/**
 * DB 스키마 타입.
 *
 * `supabase gen types typescript` 로 생성할 수도 있지만, 프로젝트가 없어도
 * 타입 검사가 되도록 손으로 유지한다. supabase/migrations 와 함께 고칠 것.
 */

import type { GradeId } from "../grades";
import type { OracleCategory, OracleStatus, UserRole } from "../types";

export interface ProfileRow {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  points: number;
  accuracy: number;
  total_bets: number;
  won_bets: number;
  current_streak: number;
  best_streak: number;
  grade_id: GradeId;
  grade_override: boolean;
  last_daily_bonus_at: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  joined_at: string;
  last_active: string;
}

export interface OracleRow {
  id: string;
  title: string;
  description: string;
  category: OracleCategory;
  status: OracleStatus;
  total_participants: number;
  total_pool: number;
  ends_at: string;
  created_at: string;
  is_hot: boolean;
  is_trending: boolean;
  is_new: boolean;
  tags: string[];
  comment_count: number;
  creator_id: string | null;
  creator_name: string;
  creator_avatar: string;
  winning_option_id: string | null;
  settled_at: string | null;
  awaiting_since: string | null;
}

export interface BetOptionRow {
  id: string;
  oracle_id: string;
  label: string;
  position: number;
  total_bets: number;
  percentage: number;
  odds: number;
}

export interface BetRow {
  id: string;
  user_id: string;
  oracle_id: string;
  option_id: string;
  amount: number;
  odds: number;
  grade_bonus: number;
  streak_bonus: number;
  status: "pending" | "won" | "lost";
  payout: number | null;
  placed_at: string;
  settled_at: string | null;
}

export interface CommentRow {
  id: string;
  oracle_id: string;
  author_id: string;
  text: string;
  likes: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: "bet_result" | "grade_up" | "deadline" | "comment" | "system";
  title: string;
  body: string;
  oracle_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  user_name: string;
  avatar: string;
  grade_id: GradeId;
  oracle_id: string;
  oracle_title: string;
  option_label: string;
  amount: number;
  created_at: string;
}

export interface SettlementReviewRow {
  id: string;
  oracle_id: string;
  decided_by: string | null;
  action: "settle" | "void";
  winning_option_id: string | null;
  note: string;
  affected_bets: number;
  points_moved: number;
  decided_at: string;
}

export interface GradeSettingsRow {
  id: boolean;
  thresholds: Record<GradeId, number>;
  updated_at: string;
  updated_by: string | null;
}

/**
 * NOTE: supabase-js 의 Database 제네릭은 여기 두지 않는다.
 * 손으로 맞춘 제네릭은 실제 DB 와 어긋나도 드러나지 않아 오히려 위험하다.
 * 프로젝트를 만든 뒤 아래로 생성해서 클라이언트에 붙이는 것이 옳다.
 *
 *   npm run types:supabase   (supabase gen types typescript --linked)
 *
 * 그 전까지는 위 Row 인터페이스로 매핑 지점에서만 모양을 고정한다.
 */
