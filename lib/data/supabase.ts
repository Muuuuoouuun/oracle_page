"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { OracleSupabase } from "../supabase/client";
import type {
  ActivityRow,
  BetOptionRow,
  BetRow,
  CommentRow,
  GradeSettingsRow,
  NotificationRow,
  OracleRow,
  ProfileRow,
  SettlementReviewRow,
} from "../supabase/types";
import { DEFAULT_THRESHOLDS, type GradeId, type GradeThresholds } from "../grades";
import type {
  ActivityEvent,
  BetOption,
  Comment,
  MyBetRecord,
  Notification,
  Oracle,
  UserProfile,
} from "../types";
import {
  DataError,
  type AppSnapshot,
  type CreateOracleInput,
  type DataSource,
  type SettlementMode,
  type SettlementReview,
} from "./types";

/* ── 로그인하지 않았을 때 자리를 채우는 프로필 ── */
export const GUEST_ID = "guest";

const GUEST: UserProfile = {
  id: GUEST_ID,
  name: "손님",
  avatar: "👤",
  role: "user",
  points: 0,
  accuracy: 0,
  totalBets: 0,
  wonBets: 0,
  gradeId: "magikarp",
  gradeOverride: false,
  joinedAt: new Date(0),
  lastActive: new Date(0),
  isBanned: false,
  currentStreak: 0,
  bestStreak: 0,
};

/* ── row → 앱 타입 ── */

function toProfile(r: ProfileRow): UserProfile {
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    role: r.role,
    points: r.points,
    accuracy: r.accuracy,
    totalBets: r.total_bets,
    wonBets: r.won_bets,
    gradeId: r.grade_id,
    gradeOverride: r.grade_override,
    joinedAt: new Date(r.joined_at),
    lastActive: new Date(r.last_active),
    isBanned: r.is_banned,
    banReason: r.ban_reason ?? undefined,
    currentStreak: r.current_streak,
    bestStreak: r.best_streak,
    lastDailyBonusAt: r.last_daily_bonus_at ? new Date(r.last_daily_bonus_at) : undefined,
  };
}

function toOption(r: BetOptionRow): BetOption {
  return {
    id: r.id,
    label: r.label,
    percentage: r.percentage,
    totalBets: r.total_bets,
    odds: Number(r.odds),
  };
}

function toOracle(r: OracleRow, options: BetOptionRow[]): Oracle {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    options: options
      .filter((o) => o.oracle_id === r.id)
      .sort((a, b) => a.position - b.position)
      .map(toOption),
    totalParticipants: r.total_participants,
    totalPool: r.total_pool,
    endsAt: new Date(r.ends_at),
    createdAt: new Date(r.created_at),
    isHot: r.is_hot,
    isTrending: r.is_trending,
    isNew: r.is_new,
    tags: r.tags,
    commentCount: r.comment_count,
    creatorName: r.creator_name,
    creatorAvatar: r.creator_avatar,
    winningOptionId: r.winning_option_id ?? undefined,
    awaitingSince: r.awaiting_since ? new Date(r.awaiting_since) : undefined,
  };
}

function toBet(r: BetRow, oracles: Oracle[]): MyBetRecord {
  const oracle = oracles.find((o) => o.id === r.oracle_id);
  const option = oracle?.options.find((o) => o.id === r.option_id);
  return {
    id: r.id,
    oracleId: r.oracle_id,
    optionId: r.option_id,
    optionLabel: option?.label ?? "선택지",
    oracleTitle: oracle?.title ?? "예언",
    amount: r.amount,
    odds: Number(r.odds),
    gradeBonus: Number(r.grade_bonus),
    streakBonus: Number(r.streak_bonus),
    status: r.status,
    payout: r.payout ?? undefined,
    placedAt: new Date(r.placed_at),
  };
}

function toNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    isRead: r.is_read,
    createdAt: new Date(r.created_at),
    oracleId: r.oracle_id ?? undefined,
  };
}

function toActivity(r: ActivityRow): ActivityEvent {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    avatar: r.avatar,
    gradeId: r.grade_id,
    oracleId: r.oracle_id,
    oracleTitle: r.oracle_title,
    optionLabel: r.option_label,
    amount: r.amount,
    createdAt: new Date(r.created_at),
  };
}

/** Postgres 가 올린 예외 메시지를 그대로 사용자에게 전한다 (서버에서 한국어로 던진다). */
function fail(error: { message: string } | null, fallback: string): never {
  throw new DataError(error?.message?.trim() || fallback);
}

export function createSupabaseDataSource(supabase: OracleSupabase): DataSource {
  /** 현재 로그인한 유저 id. 없으면 null. */
  async function uid(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  async function requireUid(): Promise<string> {
    const id = await uid();
    if (!id) throw new DataError("로그인이 필요합니다.");
    return id;
  }

  return {
    mode: "supabase",

    async load(): Promise<AppSnapshot> {
      const me = await uid();

      const [oracleRes, optionRes, profileRes, commentRes, activityRes, settingsRes] =
        await Promise.all([
          supabase.from("oracles").select("*").order("created_at", { ascending: false }),
          supabase.from("bet_options").select("*"),
          supabase.from("profiles").select("*").order("points", { ascending: false }),
          supabase.from("comments").select("*").order("created_at", { ascending: false }),
          supabase.from("recent_activity").select("*"),
          supabase.from("grade_settings").select("*").single(),
        ]);

      // 승인 큐 관련 — 실패해도 앱은 떠야 하므로 기본값으로 넘어간다
      const [modeRes, reviewRes] = await Promise.all([
        supabase.from("app_settings").select("settlement_mode").single(),
        supabase
          .from("settlement_reviews")
          .select("*")
          .order("decided_at", { ascending: false })
          .limit(50),
      ]);

      if (oracleRes.error) fail(oracleRes.error, "예언을 불러오지 못했습니다.");
      if (optionRes.error) fail(optionRes.error, "선택지를 불러오지 못했습니다.");
      if (profileRes.error) fail(profileRes.error, "유저를 불러오지 못했습니다.");

      const options = (optionRes.data ?? []) as BetOptionRow[];
      const oracles = ((oracleRes.data ?? []) as OracleRow[]).map((o) => toOracle(o, options));
      const users = ((profileRes.data ?? []) as ProfileRow[]).map(toProfile);

      // 로그인한 경우에만 개인 데이터를 가져온다
      let myBets: MyBetRecord[] = [];
      let notifications: Notification[] = [];
      let following: string[] = [];
      let likedCommentIds = new Set<string>();

      if (me) {
        const [betRes, notiRes, followRes, likeRes] = await Promise.all([
          supabase.from("bets").select("*").eq("user_id", me).order("placed_at", { ascending: false }),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", me)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.from("follows").select("followee_id").eq("follower_id", me),
          supabase.from("comment_likes").select("comment_id").eq("user_id", me),
        ]);

        myBets = ((betRes.data ?? []) as BetRow[]).map((b) => toBet(b, oracles));
        notifications = ((notiRes.data ?? []) as NotificationRow[]).map(toNotification);
        following = (followRes.data ?? []).map((f) => f.followee_id as string);
        likedCommentIds = new Set((likeRes.data ?? []).map((l) => l.comment_id as string));
      }

      const comments: Comment[] = ((commentRes.data ?? []) as CommentRow[]).map((c) => {
        const author = users.find((u) => u.id === c.author_id);
        return {
          id: c.id,
          oracleId: c.oracle_id,
          author: author?.name ?? "탈퇴한 예언가",
          avatar: author?.avatar ?? "👤",
          gradeId: (author?.gradeId ?? "magikarp") as GradeId,
          text: c.text,
          likes: c.likes,
          likedByMe: likedCommentIds.has(c.id),
          createdAt: new Date(c.created_at),
        };
      });

      const settings = settingsRes.data as GradeSettingsRow | null;

      return {
        oracles,
        users,
        me: users.find((u) => u.id === me) ?? GUEST,
        myBets,
        notifications,
        comments,
        following,
        activity: ((activityRes.data ?? []) as ActivityRow[]).map(toActivity),
        thresholds: (settings?.thresholds ?? DEFAULT_THRESHOLDS) as GradeThresholds,
        settlementMode: (modeRes.data?.settlement_mode ?? "review") as SettlementMode,
        reviews: ((reviewRes.data ?? []) as SettlementReviewRow[]).map((r) => {
          const oracle = oracles.find((o) => o.id === r.oracle_id);
          return {
            id: r.id,
            oracleId: r.oracle_id,
            oracleTitle: oracle?.title ?? "예언",
            action: r.action,
            decidedByName:
              users.find((u) => u.id === r.decided_by)?.name ?? "시스템",
            winningOptionLabel: oracle?.options.find((o) => o.id === r.winning_option_id)?.label,
            note: r.note,
            affectedBets: r.affected_bets,
            pointsMoved: r.points_moved,
            decidedAt: new Date(r.decided_at),
          } satisfies SettlementReview;
        }),
      };
    },

    /** 다른 사람의 배팅·정산이 실시간으로 흘러들어오게 한다. */
    subscribe(onChange: () => void) {
      const channel: RealtimeChannel = supabase
        .channel("oracle-page")
        .on("postgres_changes", { event: "*", schema: "public", table: "oracles" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "bet_options" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "settlement_reviews" }, onChange)
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    },

    async placeBet(_oracleId, optionId, amount) {
      await requireUid();
      const { error } = await supabase.rpc("place_bet", {
        p_option_id: optionId,
        p_amount: amount,
      });
      if (error) fail(error, "배팅에 실패했습니다.");
    },

    async cancelBet(betId) {
      const { error } = await supabase.rpc("cancel_bet", { p_bet_id: betId });
      if (error) fail(error, "배팅을 취소하지 못했습니다.");
    },

    async createOracle(input: CreateOracleInput) {
      await requireUid();
      const { error } = await supabase.rpc("create_oracle", {
        p_title: input.title,
        p_description: input.description,
        p_category: input.category,
        p_options: input.optionLabels,
        p_ends_at: input.endsAt.toISOString(),
        p_tags: input.tags ?? [],
      });
      if (error) fail(error, "예언을 만들지 못했습니다.");
    },

    async addComment(oracleId, text) {
      const me = await requireUid();
      const { error } = await supabase
        .from("comments")
        .insert({ oracle_id: oracleId, author_id: me, text: text.trim() });
      if (error) fail(error, "댓글을 남기지 못했습니다.");
    },

    async toggleCommentLike(commentId) {
      const me = await requireUid();
      const { data } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("comment_id", commentId)
        .eq("user_id", me)
        .maybeSingle();

      const { error } = data
        ? await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", me)
        : await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: me });

      if (error) fail(error, "좋아요를 처리하지 못했습니다.");
    },

    async toggleFollow(userId) {
      const me = await requireUid();
      if (me === userId) return;

      const { data } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", me)
        .eq("followee_id", userId)
        .maybeSingle();

      const { error } = data
        ? await supabase.from("follows").delete().eq("follower_id", me).eq("followee_id", userId)
        : await supabase.from("follows").insert({ follower_id: me, followee_id: userId });

      if (error) fail(error, "팔로우를 처리하지 못했습니다.");
    },

    async markNotificationRead(id) {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) fail(error, "알림을 읽음 처리하지 못했습니다.");
    },

    async markAllNotificationsRead() {
      const me = await requireUid();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", me)
        .eq("is_read", false);
      if (error) fail(error, "알림을 읽음 처리하지 못했습니다.");
    },

    async claimDailyBonus() {
      const { error } = await supabase.rpc("claim_daily_bonus", {});
      if (error) fail(error, "보너스를 받지 못했습니다.");
    },

    async claimRelief() {
      const { error } = await supabase.rpc("claim_relief", {});
      if (error) fail(error, "지원금을 받지 못했습니다.");
    },

    /**
     * 서버의 pg_cron(close_due_oracles) 이 매분 마감을 처리하므로
     * 클라이언트가 할 일이 없다. 크론을 켜지 않았다면 관리자가 수동으로 종료해야 한다.
     */
    async settleDue() {},

    async settleOracle(oracleId, winningOptionId, note = "") {
      const { error } = await supabase.rpc("settle_oracle", {
        p_oracle_id: oracleId,
        p_winning_option_id: winningOptionId,
        p_note: note,
      });
      if (error) fail(error, "정산에 실패했습니다. (관리자 권한이 필요합니다)");
    },

    async voidOracle(oracleId, note = "") {
      const { error } = await supabase.rpc("void_oracle", {
        p_oracle_id: oracleId,
        p_note: note,
      });
      if (error) fail(error, "무효 처리에 실패했습니다. (관리자 권한이 필요합니다)");
    },

    async setSettlementMode(mode) {
      const { error } = await supabase.rpc("admin_set_settlement_mode", { p_mode: mode });
      if (error) fail(error, "정산 모드를 바꾸지 못했습니다. (관리자 권한이 필요합니다)");
    },

    async updateOracle(oracleId, patch) {
      const row: Record<string, unknown> = {};
      if (patch.isHot !== undefined) row.is_hot = patch.isHot;
      if (patch.isTrending !== undefined) row.is_trending = patch.isTrending;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.winningOptionId !== undefined) row.winning_option_id = patch.winningOptionId ?? null;
      if (Object.keys(row).length === 0) return;

      const { error } = await supabase.from("oracles").update(row).eq("id", oracleId);
      if (error) fail(error, "예언을 수정하지 못했습니다. (관리자 권한이 필요합니다)");
    },

    async updateUser(userId, patch) {
      const { error } = await supabase.rpc("admin_update_profile", {
        p_user_id: userId,
        p_points: patch.points ?? null,
        p_grade_id: patch.gradeId ?? null,
        p_grade_override: patch.gradeOverride ?? null,
      });
      if (error) fail(error, "유저를 수정하지 못했습니다. (관리자 권한이 필요합니다)");
    },

    async toggleBan(userId) {
      const { data } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .single();

      const { error } = await supabase.rpc("admin_update_profile", {
        p_user_id: userId,
        p_is_banned: !(data?.is_banned ?? false),
        p_ban_reason: data?.is_banned ? null : "관리자 수동 제재",
      });
      if (error) fail(error, "제재 상태를 바꾸지 못했습니다. (관리자 권한이 필요합니다)");
    },

    async saveThresholds(next) {
      const { error } = await supabase.rpc("admin_set_thresholds", { p_thresholds: next });
      if (error) fail(error, "등급 기준을 저장하지 못했습니다. (관리자 권한이 필요합니다)");
    },
  };
}
