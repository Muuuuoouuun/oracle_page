"use client";

import { recalcOptions } from "../betting";
import {
  DEFAULT_THRESHOLDS,
  RELIEF_FLOOR,
  RELIEF_THRESHOLD,
  dailyBonusFor,
  dailyOracleLimit,
  getGradeByPoints,
  resolveGrades,
  streakBonusRate,
  type Grade,
  type GradeId,
  type GradeThresholds,
} from "../grades";
import { MOCK_COMMENTS, MOCK_ORACLES } from "../mockData";
import { MOCK_USERS } from "../adminData";
import { settleBets } from "../settlement";
import { STORAGE_KEYS, loadState, saveState } from "../storage";
import type {
  ActivityEvent,
  Comment,
  MyBetRecord,
  Notification,
  Oracle,
  UserProfile,
} from "../types";
import { DataError, type AppSnapshot, type CreateOracleInput, type DataSource } from "./types";

/** 로그인이 없으므로 세션당 유저는 이 한 명뿐이다. */
export const ME_ID = "me";
/** 첫 방문자에게 주어지는 연습 예언 id. */
export const TUTORIAL_ID = "tutorial";

const INITIAL_ME: UserProfile = {
  id: ME_ID,
  name: "나의예언",
  avatar: "🌟",
  role: "user",
  points: 1500,
  accuracy: 0,
  totalBets: 0,
  wonBets: 0,
  gradeId: "bulbasaur",
  gradeOverride: false,
  joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  lastActive: new Date(),
  isBanned: false,
  currentStreak: 0,
  bestStreak: 0,
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "system",
    title: "Oracle Page에 오신걸 환영합니다! 🔮",
    body: "연습 예언에 참여하면 90초 뒤 바로 결과를 볼 수 있어요.",
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 1000),
    oracleId: TUTORIAL_ID,
  },
  {
    id: "n2",
    type: "deadline",
    title: "마감임박 예언이 있어요 ⏰",
    body: "10분짜리 초단기 예언이 곧 마감됩니다!",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    oracleId: "s1",
  },
];

/** 티커에 흐를 가짜 활동을 만들 때 쓰는 후보 (나 제외) */
const TICKER_USERS = MOCK_USERS.filter((u) => !u.isBanned && u.role !== "admin");

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq.toString(36)}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 포인트를 반영하되, 관리자가 등급을 수동 지정한 유저는 등급을 건드리지 않는다. */
function applyPoints(user: UserProfile, points: number, grades: Grade[]): UserProfile {
  const safe = Math.max(0, Math.round(points));
  return {
    ...user,
    points: safe,
    gradeId: user.gradeOverride ? user.gradeId : getGradeByPoints(safe, grades).id,
  };
}

/**
 * 마감된 예언의 정답을 고른다. 선택률이 높은 쪽이 맞을 확률이 높되 확정은 아니게.
 * (Supabase 모드에서는 서버의 settle_due_oracles() 가 같은 일을 한다)
 */
function pickWinner(oracle: Oracle): string {
  const weights = oracle.options.map((o) => Math.max(1, o.percentage));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < oracle.options.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return oracle.options[i].id;
  }
  return oracle.options[oracle.options.length - 1].id;
}

function makeTutorialOracle(): Oracle {
  const created = new Date();
  return {
    id: TUTORIAL_ID,
    title: "[연습] 이 예언은 90초 뒤에 결과가 나옵니다",
    description:
      "포인트를 걸고 결과를 기다리는 흐름을 한 번 체험해보세요. 어느 쪽을 골라도 괜찮습니다 — 90초 뒤 자동으로 정산됩니다.",
    category: "사회/문화",
    status: "live",
    options: [
      { id: "tut-a", label: "왼쪽 🌙", percentage: 50, totalBets: 0, odds: 1.8 },
      { id: "tut-b", label: "오른쪽 ☀️", percentage: 50, totalBets: 0, odds: 1.8 },
    ],
    totalParticipants: 0,
    totalPool: 0,
    endsAt: new Date(created.getTime() + 90 * 1000),
    createdAt: created,
    isHot: false,
    isTrending: false,
    isNew: true,
    tags: ["연습"],
    commentCount: 0,
    creatorName: "Oracle Page",
    creatorAvatar: "🔮",
  };
}

/**
 * localStorage 기반 저장소.
 *
 * 로그인이 없으므로 클라이언트가 곧 서버다. 포인트 계산도 여기서 한다.
 * 값이 걸린 계산은 lib/settlement.ts · lib/betting.ts 의 (테스트된) 순수 함수를 쓴다.
 */
export function createLocalDataSource(): DataSource {
  /* ── 상태 ── */
  let oracles = loadState<Oracle[]>(STORAGE_KEYS.oracles) ?? MOCK_ORACLES;
  let users = loadState<UserProfile[]>(STORAGE_KEYS.users) ?? [INITIAL_ME, ...MOCK_USERS];
  let myBets = loadState<MyBetRecord[]>(STORAGE_KEYS.myBets) ?? [];
  let notifications =
    loadState<Notification[]>(STORAGE_KEYS.notifications) ?? INITIAL_NOTIFICATIONS;
  let comments = loadState<Comment[]>(STORAGE_KEYS.comments) ?? MOCK_COMMENTS;
  let following = loadState<string[]>(STORAGE_KEYS.following) ?? [];
  let thresholds =
    loadState<GradeThresholds>(STORAGE_KEYS.gradeThresholds) ?? DEFAULT_THRESHOLDS;
  const onboarded = loadState<boolean>(STORAGE_KEYS.onboarded) ?? false;

  // 활동 티커는 휘발성 — 저장하지 않는다
  let activity: ActivityEvent[] = [];

  // 첫 방문자에게 연습 예언을 지급
  if (!onboarded && !oracles.some((o) => o.id === TUTORIAL_ID)) {
    oracles = [makeTutorialOracle(), ...oracles];
  }

  const listeners = new Set<() => void>();
  function changed() {
    listeners.forEach((fn) => fn());
  }

  function persist() {
    saveState(STORAGE_KEYS.oracles, oracles);
    saveState(STORAGE_KEYS.users, users);
    saveState(STORAGE_KEYS.myBets, myBets);
    saveState(STORAGE_KEYS.notifications, notifications);
    saveState(STORAGE_KEYS.comments, comments);
    saveState(STORAGE_KEYS.following, following);
    saveState(STORAGE_KEYS.gradeThresholds, thresholds);
    changed();
  }

  const grades = () => resolveGrades(thresholds);
  const me = () => users.find((u) => u.id === ME_ID) ?? INITIAL_ME;

  function patchMe(fn: (u: UserProfile) => UserProfile) {
    users = users.map((u) => (u.id === ME_ID ? fn(u) : u));
  }

  function notify(n: Omit<Notification, "id" | "isRead" | "createdAt">) {
    notifications = [
      { ...n, id: nextId("n"), isRead: false, createdAt: new Date() },
      ...notifications,
    ];
  }

  /** 포인트 변화로 등급이 올랐으면 승급 알림을 남긴다. */
  function notifyGradeUp(user: UserProfile, oldPoints: number, newPoints: number) {
    if (user.gradeOverride) return;
    const g = grades();
    const before = getGradeByPoints(oldPoints, g);
    const after = getGradeByPoints(newPoints, g);
    if (after.rank <= before.rank) return;
    notify({
      type: "grade_up",
      title: `등급 승급! ${after.emoji} ${after.name}`,
      body: `축하합니다! ${after.title}(으)로 승급했습니다!`,
    });
  }

  /** 예언 여러 개를 한 번에 정산한다. 정산 계산은 lib/settlement.ts 가 한다. */
  function settleMany(entries: Array<{ oracleId: string; winningOptionId: string }>) {
    const winnerBy = new Map<string, string>();
    for (const e of entries) {
      const o = oracles.find((x) => x.id === e.oracleId);
      if (!o || o.status === "closed") continue;
      if (!o.options.some((op) => op.id === e.winningOptionId)) continue;
      winnerBy.set(e.oracleId, e.winningOptionId);
    }
    if (winnerBy.size === 0) return;

    oracles = oracles.map((o) =>
      winnerBy.has(o.id)
        ? { ...o, status: "closed" as const, winningOptionId: winnerBy.get(o.id) }
        : o
    );

    const current = me();
    const result = settleBets(myBets, winnerBy, current.currentStreak, current.bestStreak);

    if (result.settledCount === 0) {
      for (const oracleId of Array.from(winnerBy.keys())) {
        const o = oracles.find((x) => x.id === oracleId);
        if (o) {
          notify({
            type: "system",
            title: "예언이 마감되었습니다 ⏱",
            body: `"${o.title}" 의 결과가 확정되었습니다.`,
            oracleId,
          });
        }
      }
      persist();
      return;
    }

    myBets = result.bets;
    patchMe((u) => ({
      ...applyPoints(u, u.points + result.totalPayout, grades()),
      wonBets: result.wonBets,
      accuracy: result.accuracy,
      currentStreak: result.currentStreak,
      bestStreak: result.bestStreak,
    }));

    const won = result.totalPayout > 0;
    const first = oracles.find((o) => winnerBy.has(o.id));
    notify({
      type: "bet_result",
      title: won ? "예언 적중! 🎉" : "예언 실패 😢",
      body: won
        ? `"${first?.title}" ${
            result.currentStreak >= 3 ? `${result.currentStreak}연승! ` : ""
          }${result.totalPayout.toLocaleString()}P를 획득했습니다.`
        : `"${first?.title}" 예언이 빗나갔습니다. 다음엔 꼭!`,
      oracleId: first?.id,
    });

    notifyGradeUp(current, current.points, current.points + result.totalPayout);
    persist();
  }

  /* ── 활동 티커 시뮬레이션 ── */
  let tickerTimer: ReturnType<typeof setInterval> | null = null;

  function startTicker() {
    if (tickerTimer !== null) return;
    tickerTimer = setInterval(() => {
      const live = oracles.filter((o) => o.status === "live");
      if (live.length === 0 || TICKER_USERS.length === 0) return;
      const oracle = live[Math.floor(Math.random() * live.length)];
      const user = TICKER_USERS[Math.floor(Math.random() * TICKER_USERS.length)];
      const option = oracle.options[Math.floor(Math.random() * oracle.options.length)];
      const amount = [10, 50, 100, 300, 500][Math.floor(Math.random() * 5)];
      activity = [
        {
          id: nextId("act"),
          userId: user.id,
          userName: user.name,
          avatar: user.avatar,
          gradeId: user.gradeId,
          oracleId: oracle.id,
          oracleTitle: oracle.title,
          optionLabel: option.label,
          amount,
          createdAt: new Date(),
        },
        ...activity,
      ].slice(0, 40);
      changed();
    }, 6000);
  }

  return {
    mode: "local",

    async load(): Promise<AppSnapshot> {
      return {
        oracles,
        users,
        me: me(),
        myBets,
        notifications,
        comments,
        following,
        activity,
        thresholds,
      };
    },

    subscribe(onChange: () => void) {
      listeners.add(onChange);
      startTicker();
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0 && tickerTimer !== null) {
          clearInterval(tickerTimer);
          tickerTimer = null;
        }
      };
    },

    async placeBet(oracleId, optionId, amount) {
      const oracle = oracles.find((o) => o.id === oracleId);
      const option = oracle?.options.find((o) => o.id === optionId);
      if (!oracle || !option) throw new DataError("예언을 찾을 수 없습니다.");
      if (oracle.status === "closed") throw new DataError("이미 종료된 예언입니다.");
      if (new Date(oracle.endsAt).getTime() <= Date.now()) {
        throw new DataError("마감된 예언입니다.");
      }
      if (amount <= 0) throw new DataError("배팅 금액은 1P 이상이어야 합니다.");

      const current = me();
      if (current.points < amount) throw new DataError("포인트가 부족합니다.");
      if (myBets.some((b) => b.oracleId === oracleId)) {
        throw new DataError("이미 참여한 예언입니다.");
      }

      const g = grades();
      const grade = g.find((x) => x.id === current.gradeId) ?? g[0];

      oracles = oracles.map((o) => {
        if (o.id !== oracleId) return o;
        const bumped = o.options.map((opt) =>
          opt.id === optionId ? { ...opt, totalBets: opt.totalBets + 1 } : opt
        );
        return {
          ...o,
          options: recalcOptions(bumped),
          totalPool: o.totalPool + amount,
          totalParticipants: o.totalParticipants + 1,
        };
      });

      patchMe((u) => ({
        ...applyPoints(u, u.points - amount, g),
        totalBets: u.totalBets + 1,
      }));

      myBets = [
        {
          id: nextId("bet"),
          oracleId,
          optionId,
          optionLabel: option.label,
          oracleTitle: oracle.title,
          amount,
          odds: option.odds,
          gradeBonus: grade.accuracyBonus / 100,
          streakBonus: streakBonusRate(current.currentStreak),
          placedAt: new Date(),
          status: "pending",
        },
        ...myBets,
      ];

      activity = [
        {
          id: nextId("act"),
          userId: ME_ID,
          userName: current.name,
          avatar: current.avatar,
          gradeId: current.gradeId,
          oracleId,
          oracleTitle: oracle.title,
          optionLabel: option.label,
          amount,
          createdAt: new Date(),
        },
        ...activity,
      ].slice(0, 40);

      persist();
    },

    async cancelBet(betId) {
      const bet = myBets.find((b) => b.id === betId);
      if (!bet || bet.status !== "pending") {
        throw new DataError("취소할 수 있는 배팅이 아닙니다.");
      }
      const oracle = oracles.find((o) => o.id === bet.oracleId);
      if (!oracle || oracle.status === "closed") {
        throw new DataError("마감된 예언은 취소할 수 없습니다.");
      }
      if (new Date(oracle.endsAt).getTime() <= Date.now()) {
        throw new DataError("마감된 예언은 취소할 수 없습니다.");
      }

      oracles = oracles.map((o) => {
        if (o.id !== bet.oracleId) return o;
        const reduced = o.options.map((opt) =>
          opt.id === bet.optionId ? { ...opt, totalBets: Math.max(0, opt.totalBets - 1) } : opt
        );
        return {
          ...o,
          options: recalcOptions(reduced),
          totalPool: Math.max(0, o.totalPool - bet.amount),
          totalParticipants: Math.max(0, o.totalParticipants - 1),
        };
      });

      patchMe((u) => ({
        ...applyPoints(u, u.points + bet.amount, grades()),
        totalBets: Math.max(0, u.totalBets - 1),
      }));

      myBets = myBets.filter((b) => b.id !== betId);
      activity = activity.filter((a) => !(a.userId === ME_ID && a.oracleId === bet.oracleId));
      persist();
    },

    async createOracle(input: CreateOracleInput) {
      const current = me();
      const g = grades();
      const grade = g.find((x) => x.id === current.gradeId) ?? g[0];
      const limit = dailyOracleLimit(grade.rank);

      if (limit === 0) throw new DataError("이 등급은 예언을 만들 수 없습니다.");
      if (limit !== Infinity) {
        const today = oracles.filter(
          (o) =>
            o.creatorName === current.name &&
            o.id !== TUTORIAL_ID &&
            isSameDay(new Date(o.createdAt), new Date())
        ).length;
        if (today >= limit) {
          throw new DataError(`오늘의 예언 생성 한도(${limit}개)를 모두 사용했습니다.`);
        }
      }

      oracles = [
        {
          id: nextId("user"),
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category,
          status: "live",
          options: recalcOptions(
            input.optionLabels.map((label, i) => ({
              id: `opt-${i}-${nextId("o")}`,
              label,
              percentage: 0,
              totalBets: 0,
              odds: 1,
            }))
          ),
          totalParticipants: 0,
          totalPool: 0,
          endsAt: input.endsAt,
          createdAt: new Date(),
          isHot: false,
          isTrending: false,
          isNew: true,
          tags: input.tags ?? [],
          commentCount: 0,
          creatorName: current.name,
          creatorAvatar: current.avatar,
        },
        ...oracles,
      ];
      persist();
    },

    async addComment(oracleId, text) {
      const body = text.trim();
      if (!body) return;
      const current = me();
      comments = [
        {
          id: nextId("c"),
          oracleId,
          author: current.name,
          avatar: current.avatar,
          gradeId: current.gradeId,
          text: body,
          likes: 0,
          likedByMe: false,
          createdAt: new Date(),
        },
        ...comments,
      ];
      oracles = oracles.map((o) =>
        o.id === oracleId ? { ...o, commentCount: o.commentCount + 1 } : o
      );
      persist();
    },

    async toggleCommentLike(commentId) {
      comments = comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              likedByMe: !c.likedByMe,
              likes: c.likedByMe ? Math.max(0, c.likes - 1) : c.likes + 1,
            }
          : c
      );
      persist();
    },

    async toggleFollow(userId) {
      if (userId === ME_ID) return;
      following = following.includes(userId)
        ? following.filter((id) => id !== userId)
        : [...following, userId];
      persist();
    },

    async markNotificationRead(id) {
      notifications = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      persist();
    },

    async markAllNotificationsRead() {
      notifications = notifications.map((n) => ({ ...n, isRead: true }));
      persist();
    },

    async claimDailyBonus() {
      const current = me();
      if (
        current.lastDailyBonusAt &&
        isSameDay(new Date(current.lastDailyBonusAt), new Date())
      ) {
        throw new DataError("오늘 보너스는 이미 받았습니다.");
      }
      const g = grades();
      const grade = g.find((x) => x.id === current.gradeId) ?? g[0];
      const amount = dailyBonusFor(grade.rank);

      patchMe((u) => ({
        ...applyPoints(u, u.points + amount, g),
        lastDailyBonusAt: new Date(),
      }));
      notify({
        type: "system",
        title: `일일 보너스 +${amount.toLocaleString()}P 🎁`,
        body: `${grade.emoji} ${grade.name} 등급 보너스를 받았습니다. 내일 또 받을 수 있어요!`,
      });
      notifyGradeUp(current, current.points, current.points + amount);
      persist();
    },

    async claimRelief() {
      const current = me();
      if (current.points >= RELIEF_THRESHOLD) {
        throw new DataError("아직 재기 지원금을 받을 수 없습니다.");
      }
      patchMe((u) => applyPoints(u, RELIEF_FLOOR, grades()));
      notify({
        type: "system",
        title: "재기 지원금 지급 💪",
        body: `포인트가 ${RELIEF_FLOOR}P로 채워졌습니다. 다시 예언해보세요!`,
      });
      persist();
    },

    /** 마감된 예언을 따라잡는다. Supabase 모드에서는 서버 크론이 대신 한다. */
    async settleDue() {
      const now = Date.now();
      const due = oracles.filter(
        (o) => o.status !== "closed" && new Date(o.endsAt).getTime() <= now
      );
      if (due.length === 0) return;
      settleMany(due.map((o) => ({ oracleId: o.id, winningOptionId: pickWinner(o) })));
    },

    async settleOracle(oracleId, winningOptionId) {
      settleMany([{ oracleId, winningOptionId }]);
    },

    async updateOracle(oracleId, patch) {
      oracles = oracles.map((o) => (o.id === oracleId ? { ...o, ...patch } : o));
      persist();
    },

    async updateUser(userId, patch) {
      users = users.map((u) =>
        u.id === userId
          ? {
              ...u,
              points: patch.points ?? u.points,
              gradeId: (patch.gradeId ?? u.gradeId) as GradeId,
              gradeOverride: patch.gradeOverride ?? u.gradeOverride,
            }
          : u
      );
      persist();
    },

    async toggleBan(userId) {
      users = users.map((u) =>
        u.id === userId
          ? {
              ...u,
              isBanned: !u.isBanned,
              banReason: u.isBanned ? undefined : "관리자 수동 제재",
            }
          : u
      );
      persist();
    },

    async saveThresholds(next) {
      thresholds = next;
      const g = resolveGrades(next);
      users = users.map((u) =>
        u.gradeOverride ? u : { ...u, gradeId: getGradeByPoints(u.points, g).id }
      );
      persist();
    },
  };
}
