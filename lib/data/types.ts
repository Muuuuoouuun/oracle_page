import type {
  ActivityEvent,
  Comment,
  MyBetRecord,
  Notification,
  Oracle,
  UserProfile,
} from "../types";
import type { GradeId, GradeThresholds } from "../grades";

/**
 * 앱이 저장소에 요구하는 것.
 *
 * 구현은 두 가지다.
 * - `local`    : localStorage. 계정 없이 이 브라우저에서만 (기본값)
 * - `supabase` : Postgres + 인증. 포인트가 걸린 계산은 전부 서버 함수가 한다
 *
 * 두 구현의 가장 큰 차이는 **신뢰 경계**다. local 모드는 클라이언트가 곧 서버라
 * 계산을 여기서 하지만, supabase 모드에서는 클라이언트가 결과를 받아쓰기만 한다.
 */

export interface AppSnapshot {
  oracles: Oracle[];
  users: UserProfile[];
  me: UserProfile;
  myBets: MyBetRecord[];
  notifications: Notification[];
  comments: Comment[];
  following: string[];
  activity: ActivityEvent[];
  thresholds: GradeThresholds;
}

export interface CreateOracleInput {
  title: string;
  description: string;
  category: Oracle["category"];
  optionLabels: string[];
  endsAt: Date;
  tags?: string[];
}

export interface DataSource {
  /** 어떤 모드로 돌고 있는지 — UI 가 안내 문구를 바꾸는 데 쓴다 */
  readonly mode: "local" | "supabase";

  /** 전체 상태를 한 번에 읽는다. 앱 시작과 변경 후 갱신에 쓴다. */
  load(): Promise<AppSnapshot>;

  /** 다른 곳에서 상태가 바뀌면 알려준다. 구독 해제 함수를 돌려준다. */
  subscribe?(onChange: () => void): () => void;

  placeBet(oracleId: string, optionId: string, amount: number): Promise<void>;
  cancelBet(betId: string): Promise<void>;
  createOracle(input: CreateOracleInput): Promise<void>;

  addComment(oracleId: string, text: string): Promise<void>;
  toggleCommentLike(commentId: string): Promise<void>;
  toggleFollow(userId: string): Promise<void>;

  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;

  claimDailyBonus(): Promise<void>;
  claimRelief(): Promise<void>;

  /** 마감된 예언 정산. local 모드는 클라이언트가, supabase 모드는 서버 크론이 한다. */
  settleDue(): Promise<void>;

  /* 관리자 */
  settleOracle(oracleId: string, winningOptionId: string): Promise<void>;
  updateOracle(oracleId: string, patch: Partial<Oracle>): Promise<void>;
  updateUser(
    userId: string,
    patch: { points?: number; gradeId?: GradeId; gradeOverride?: boolean }
  ): Promise<void>;
  toggleBan(userId: string): Promise<void>;
  saveThresholds(next: GradeThresholds): Promise<void>;
}

/** 서버가 거절했을 때 사용자에게 보여줄 메시지를 담는다. */
export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataError";
  }
}
