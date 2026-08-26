"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActivityEvent,
  Comment,
  MyBetRecord,
  Notification,
  Oracle,
  OracleCategory,
  UserProfile,
} from "./types";
import { settleBets } from "./settlement";
import { recalcOptions } from "./betting";
import { MOCK_COMMENTS, MOCK_ORACLES } from "./mockData";
import { MOCK_USERS } from "./adminData";
import {
  DEFAULT_THRESHOLDS,
  RELIEF_FLOOR,
  RELIEF_THRESHOLD,
  dailyBonusFor,
  getGradeByPoints,
  getNextGradeProgress,
  resolveGrades,
  streakBonusRate,
  type Grade,
  type GradeId,
  type GradeThresholds,
} from "./grades";
import { STORAGE_KEYS, loadState, saveState } from "./storage";

/** 로그인한 "나"의 고정 id. 백엔드가 없으므로 세션당 한 명. */
export const ME_ID = "me";
/** 첫 방문자에게 주어지는 연습 예언 id. */
export const TUTORIAL_ID = "tutorial";

/* ── Types ── */
// 데이터 모양은 lib/types.ts 에, 정산 계산은 lib/settlement.ts 에 있다.
export type { MyBetRecord, Notification } from "./types";

interface OracleContextValue {
  oracles: Oracle[];
  addOracle: (oracle: Oracle) => void;
  updateOracle: (id: string, patch: Partial<Oracle>) => void;
  closeOracle: (id: string, winningOptionId: string) => void;
  /** 오늘 내가 만든 예언 수 (등급별 일일 생성 제한에 사용) */
  myOraclesToday: number;
}

interface UserContextValue {
  me: UserProfile;
  users: UserProfile[];
  myBets: MyBetRecord[];
  notifications: Notification[];
  following: string[];
  activity: ActivityEvent[];
  placeBet: (oracleId: string, optionId: string, amount: number) => void;
  cancelBet: (betId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  adjustPoints: (delta: number) => void;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  toggleBan: (id: string) => void;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  /** 오늘 일일 보너스를 아직 받지 않았는지 */
  dailyBonusReady: boolean;
  dailyBonusAmount: number;
  claimDailyBonus: () => void;
  /** 포인트가 바닥나 재기 지원금을 받을 수 있는지 */
  reliefAvailable: boolean;
  claimRelief: () => void;
}

interface GradeContextValue {
  grades: Grade[];
  thresholds: GradeThresholds;
  saveThresholds: (next: GradeThresholds) => void;
  gradeByPoints: (points: number) => Grade;
  nextGradeProgress: (points: number) => ReturnType<typeof getNextGradeProgress>;
  /** 승급 연출을 띄울 등급 (없으면 null) */
  gradeUpEvent: Grade | null;
  clearGradeUp: () => void;
}

interface CommentContextValue {
  commentsFor: (oracleId: string) => Comment[];
  addComment: (oracleId: string, text: string) => void;
  toggleCommentLike: (commentId: string) => void;
}

interface UIContextValue {
  /** 커뮤니티 피드에 적용할 태그 필터 */
  tagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  onboarded: boolean;
  finishOnboarding: () => void;
}

/* ── Contexts ── */
const OracleContext = createContext<OracleContextValue | null>(null);
const UserContext = createContext<UserContextValue | null>(null);
const GradeContext = createContext<GradeContextValue | null>(null);
const CommentContext = createContext<CommentContextValue | null>(null);
const UIContext = createContext<UIContextValue | null>(null);

/* ── Helpers ── */
let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq.toString(36)}`;
}

/** 포인트를 반영하되, 관리자가 등급을 수동 지정한 유저는 등급을 건드리지 않는다. */
function applyPoints(user: UserProfile, points: number, grades: Grade[]): UserProfile {
  const safePoints = Math.max(0, Math.round(points));
  return {
    ...user,
    points: safePoints,
    gradeId: user.gradeOverride ? user.gradeId : getGradeByPoints(safePoints, grades).id,
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 마감된 예언의 정답을 고른다.
 * 선택률이 높은 쪽이 맞을 확률이 높되 확정은 아니게 — 가중 랜덤.
 * (실서비스에서는 이 자리가 관리자 승인 큐로 대체되어야 한다)
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
    category: "사회/문화" as OracleCategory,
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

/* ── Initial data ── */
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

const INITIAL_USERS: UserProfile[] = [INITIAL_ME, ...MOCK_USERS];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "system",
    title: "Oracle Page에 오신걸 환영합니다! 🔮",
    body: "연습 예언에 참여하면 90초 뒤 바로 결과를 볼 수 있어요.",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 1000),
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

/**
 * localStorage 와 동기화되는 state.
 * SSR 에서는 항상 initial 로 렌더하고, 마운트 이후에만 저장값을 덮어씌워
 * 하이드레이션 미스매치를 피한다.
 */
function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage 는 서버에 없다. 렌더 중이나 useState 초기화에서 읽으면
    // 서버가 만든 HTML 과 달라져 하이드레이션이 깨지므로, 마운트 이후에 한 번
    // 읽어 덮어쓰는 방법밖에 없다. 규칙이 경고하는 "연쇄 렌더"는 마운트 직후
    // 한 번뿐이라 감수한다.
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = loadState<T>(key);
    if (stored !== null) setState(stored);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key]);

  useEffect(() => {
    // 하이드레이션 전에 저장하면 기본값이 저장값을 덮어쓴다.
    if (hydrated) saveState(key, state);
  }, [key, hydrated, state]);

  return [state, setState, hydrated] as const;
}

/* ── Provider ── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [oracles, setOracles, oraclesReady] = usePersistentState<Oracle[]>(
    STORAGE_KEYS.oracles,
    MOCK_ORACLES
  );
  const [users, setUsers, usersReady] = usePersistentState<UserProfile[]>(
    STORAGE_KEYS.users,
    INITIAL_USERS
  );
  const [myBets, setMyBets, betsReady] = usePersistentState<MyBetRecord[]>(
    STORAGE_KEYS.myBets,
    []
  );
  const [notifications, setNotifications] = usePersistentState<Notification[]>(
    STORAGE_KEYS.notifications,
    INITIAL_NOTIFICATIONS
  );
  const [comments, setComments] = usePersistentState<Comment[]>(
    STORAGE_KEYS.comments,
    MOCK_COMMENTS
  );
  const [following, setFollowing] = usePersistentState<string[]>(STORAGE_KEYS.following, []);
  const [thresholds, setThresholds] = usePersistentState<GradeThresholds>(
    STORAGE_KEYS.gradeThresholds,
    DEFAULT_THRESHOLDS
  );
  const [onboarded, setOnboarded, onboardedReady] = usePersistentState<boolean>(
    STORAGE_KEYS.onboarded,
    false
  );

  // 활동 티커는 휘발성 — 저장하지 않는다.
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [gradeUpEvent, setGradeUpEvent] = useState<Grade | null>(null);

  const hydrated = oraclesReady && usersReady && betsReady && onboardedReady;

  const grades = useMemo(() => resolveGrades(thresholds), [thresholds]);
  const me = useMemo(() => users.find((u) => u.id === ME_ID) ?? INITIAL_ME, [users]);

  /* ── Notifications ── */
  const pushNotification = useCallback(
    (n: Omit<Notification, "id" | "isRead" | "createdAt">) => {
      setNotifications((prev) => [
        { ...n, id: nextId("n"), isRead: false, createdAt: new Date() },
        ...prev,
      ]);
    },
    [setNotifications]
  );

  /** 포인트 변화로 등급이 올랐으면 승급 알림 + 연출을 띄운다. */
  const notifyGradeUp = useCallback(
    (user: UserProfile, oldPoints: number, newPoints: number) => {
      if (user.gradeOverride) return;
      const before = getGradeByPoints(oldPoints, grades);
      const after = getGradeByPoints(newPoints, grades);
      if (after.rank <= before.rank) return;
      setGradeUpEvent(after);
      pushNotification({
        type: "grade_up",
        title: `등급 승급! ${after.emoji} ${after.name}`,
        body: `축하합니다! ${after.title}(으)로 승급했습니다!`,
      });
    },
    [grades, pushNotification]
  );

  const clearGradeUp = useCallback(() => setGradeUpEvent(null), []);

  /* ── Oracle actions ── */
  const addOracle = useCallback(
    (oracle: Oracle) => setOracles((prev) => [oracle, ...prev]),
    [setOracles]
  );

  const updateOracle = useCallback(
    (id: string, patch: Partial<Oracle>) => {
      setOracles((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    },
    [setOracles]
  );

  /* ── Betting ── */
  const placeBet = useCallback(
    (oracleId: string, optionId: string, amount: number) => {
      const oracle = oracles.find((o) => o.id === oracleId);
      const option = oracle?.options.find((o) => o.id === optionId);
      if (!oracle || !option) return;
      if (oracle.status === "closed") return;
      if (new Date(oracle.endsAt).getTime() <= Date.now()) return; // 마감된 예언
      if (amount <= 0 || me.points < amount) return;
      if (myBets.some((b) => b.oracleId === oracleId)) return; // 한 예언에 한 번

      const grade = grades.find((g) => g.id === me.gradeId) ?? grades[0];
      const gradeBonus = grade.accuracyBonus / 100;
      const streakBonus = streakBonusRate(me.currentStreak);

      // 1) 예언 통계 반영 — 참여 수, 선택률/배당, 총 풀
      setOracles((prev) =>
        prev.map((o) => {
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
        })
      );

      // 2) 내 포인트 차감 + 배팅 카운트
      setUsers((prev) =>
        prev.map((u) =>
          u.id === ME_ID
            ? { ...applyPoints(u, u.points - amount, grades), totalBets: u.totalBets + 1 }
            : u
        )
      );

      // 3) 배팅 내역 기록 (배당률과 보너스를 이 시점 값으로 고정)
      setMyBets((prev) => [
        {
          id: nextId("bet"),
          oracleId,
          optionId,
          optionLabel: option.label,
          oracleTitle: oracle.title,
          amount,
          odds: option.odds,
          gradeBonus,
          streakBonus,
          placedAt: new Date(),
          status: "pending",
        },
        ...prev,
      ]);

      // 4) 활동 티커
      setActivity((prev) =>
        [
          {
            id: nextId("act"),
            userId: ME_ID,
            userName: me.name,
            avatar: me.avatar,
            gradeId: me.gradeId,
            oracleId,
            oracleTitle: oracle.title,
            optionLabel: option.label,
            amount,
            createdAt: new Date(),
          },
          ...prev,
        ].slice(0, 40)
      );
    },
    [oracles, myBets, me, grades, setOracles, setUsers, setMyBets]
  );

  /** 마감 전이라면 배팅을 되돌린다. */
  const cancelBet = useCallback(
    (betId: string) => {
      const bet = myBets.find((b) => b.id === betId);
      if (!bet || bet.status !== "pending") return;
      const oracle = oracles.find((o) => o.id === bet.oracleId);
      if (!oracle || oracle.status === "closed") return;
      if (new Date(oracle.endsAt).getTime() <= Date.now()) return;

      setOracles((prev) =>
        prev.map((o) => {
          if (o.id !== bet.oracleId) return o;
          const reduced = o.options.map((opt) =>
            opt.id === bet.optionId
              ? { ...opt, totalBets: Math.max(0, opt.totalBets - 1) }
              : opt
          );
          return {
            ...o,
            options: recalcOptions(reduced),
            totalPool: Math.max(0, o.totalPool - bet.amount),
            totalParticipants: Math.max(0, o.totalParticipants - 1),
          };
        })
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === ME_ID
            ? {
                ...applyPoints(u, u.points + bet.amount, grades),
                totalBets: Math.max(0, u.totalBets - 1),
              }
            : u
        )
      );

      setMyBets((prev) => prev.filter((b) => b.id !== betId));
      setActivity((prev) => prev.filter((a) => !(a.userId === ME_ID && a.oracleId === bet.oracleId)));
    },
    [myBets, oracles, grades, setOracles, setUsers, setMyBets]
  );

  /* ── Settlement ── */
  /**
   * 여러 예언을 한 번에 정산한다. 단일 종료(관리자)와 마감 자동 정산이 같은 경로를 쓴다.
   * 이미 정산된 배팅은 건드리지 않으므로 재정산으로 이중 지급되지 않는다.
   */
  const settleOracles = useCallback(
    (entries: Array<{ oracleId: string; winningOptionId: string }>) => {
      const winnerBy = new Map<string, string>();
      for (const e of entries) {
        const o = oracles.find((x) => x.id === e.oracleId);
        if (!o || o.status === "closed") continue;
        if (!o.options.some((op) => op.id === e.winningOptionId)) continue;
        winnerBy.set(e.oracleId, e.winningOptionId);
      }
      if (winnerBy.size === 0) return;

      // 1) 예언 종료 + 정답 저장
      setOracles((prev) =>
        prev.map((o) =>
          winnerBy.has(o.id)
            ? { ...o, status: "closed" as const, winningOptionId: winnerBy.get(o.id) }
            : o
        )
      );

      // 2) 해당 예언의 미정산 배팅을 시간 순으로 정산 (연승 계산 때문에 순서가 중요)
      const pending = myBets
        .filter((b) => b.status === "pending" && winnerBy.has(b.oracleId))
        .sort(
          (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
        );

      if (pending.length === 0) {
        // 내가 참여하지 않은 예언이라면 결과 알림만 남긴다.
        for (const oracleId of Array.from(winnerBy.keys())) {
          const o = oracles.find((x) => x.id === oracleId);
          if (o) {
            pushNotification({
              type: "system",
              title: "예언이 마감되었습니다 ⏱",
              body: `"${o.title}" 의 결과가 확정되었습니다.`,
              oracleId,
            });
          }
        }
        return;
      }

      const result = settleBets(myBets, winnerBy, me.currentStreak, me.bestStreak);
      const { totalPayout, currentStreak: streak } = result;

      setMyBets(result.bets);

      // 3) 당첨금 자동 지급 + 적중·연승 통계 갱신
      setUsers((prev) =>
        prev.map((u) =>
          u.id === ME_ID
            ? {
                ...applyPoints(u, u.points + totalPayout, grades),
                wonBets: result.wonBets,
                accuracy: result.accuracy,
                currentStreak: result.currentStreak,
                bestStreak: result.bestStreak,
              }
            : u
        )
      );

      const iWon = totalPayout > 0;
      const firstOracle = oracles.find((o) => winnerBy.has(o.id));
      pushNotification({
        type: "bet_result",
        title: iWon ? "예언 적중! 🎉" : "예언 실패 😢",
        body: iWon
          ? `"${firstOracle?.title}" ${
              streak >= 3 ? `${streak}연승! ` : ""
            }${totalPayout.toLocaleString()}P를 획득했습니다.`
          : `"${firstOracle?.title}" 예언이 빗나갔습니다. 다음엔 꼭!`,
        oracleId: firstOracle?.id,
      });

      notifyGradeUp(me, me.points, me.points + totalPayout);
    },
    [oracles, myBets, me, grades, setOracles, setMyBets, setUsers, pushNotification, notifyGradeUp]
  );

  const closeOracle = useCallback(
    (id: string, winningOptionId: string) => settleOracles([{ oracleId: id, winningOptionId }]),
    [settleOracles]
  );

  /* ── 마감 시각 자동 정산 ──
     예언이 마감되면 관리자를 기다리지 않고 스스로 결과를 확정한다.
     브라우저가 열려 있을 때만 도는 시뮬레이션이며, 오래 비웠다 돌아와도
     밀린 예언을 한 번에 따라잡는다. */
  const settleDueRef = useRef<() => void>(() => {});
  useEffect(() => {
    settleDueRef.current = () => {
      const now = Date.now();
      const due = oracles.filter(
        (o) => o.status !== "closed" && new Date(o.endsAt).getTime() <= now
      );
      if (due.length === 0) return;
      settleOracles(due.map((o) => ({ oracleId: o.id, winningOptionId: pickWinner(o) })));
    };
  }, [oracles, settleOracles]);

  useEffect(() => {
    if (!hydrated) return;
    const tick = () => settleDueRef.current();
    tick();
    const timer = setInterval(tick, 4000);
    return () => clearInterval(timer);
  }, [hydrated]);

  /* ── 첫 방문자에게 연습 예언 지급 ── */
  useEffect(() => {
    if (!hydrated || onboarded) return;
    setOracles((prev) =>
      prev.some((o) => o.id === TUTORIAL_ID) ? prev : [makeTutorialOracle(), ...prev]
    );
  }, [hydrated, onboarded, setOracles]);

  const finishOnboarding = useCallback(() => setOnboarded(true), [setOnboarded]);

  /* ── 활동 티커 시뮬레이션 ── */
  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => {
      const live = oracles.filter((o) => o.status === "live");
      if (live.length === 0 || TICKER_USERS.length === 0) return;
      const oracle = live[Math.floor(Math.random() * live.length)];
      const user = TICKER_USERS[Math.floor(Math.random() * TICKER_USERS.length)];
      const option = oracle.options[Math.floor(Math.random() * oracle.options.length)];
      const amount = [10, 50, 100, 300, 500][Math.floor(Math.random() * 5)];
      setActivity((prev) =>
        [
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
          ...prev,
        ].slice(0, 40)
      );
    }, 6000);
    return () => clearInterval(timer);
  }, [hydrated, oracles]);

  /* ── User actions ── */
  const adjustPoints = useCallback(
    (delta: number) => {
      const oldPoints = me.points;
      const newPoints = Math.max(0, oldPoints + delta);
      setUsers((prev) =>
        prev.map((u) => (u.id === ME_ID ? applyPoints(u, newPoints, grades) : u))
      );
      notifyGradeUp(me, oldPoints, newPoints);
    },
    [me, grades, setUsers, notifyGradeUp]
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<UserProfile>) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    },
    [setUsers]
  );

  const toggleBan = useCallback(
    (id: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                isBanned: !u.isBanned,
                banReason: u.isBanned ? undefined : "관리자 수동 제재",
              }
            : u
        )
      );
    },
    [setUsers]
  );

  const toggleFollow = useCallback(
    (userId: string) => {
      if (userId === ME_ID) return;
      setFollowing((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    },
    [setFollowing]
  );

  const isFollowing = useCallback((userId: string) => following.includes(userId), [following]);

  /* ── 일일 보너스 / 재기 지원금 ── */
  const myGrade = useMemo(
    () => grades.find((g) => g.id === me.gradeId) ?? grades[0],
    [grades, me.gradeId]
  );
  const dailyBonusAmount = dailyBonusFor(myGrade.rank);
  const dailyBonusReady = useMemo(
    () =>
      !me.lastDailyBonusAt || !isSameDay(new Date(me.lastDailyBonusAt), new Date()),
    [me.lastDailyBonusAt]
  );

  const claimDailyBonus = useCallback(() => {
    if (!dailyBonusReady) return;
    const oldPoints = me.points;
    const newPoints = oldPoints + dailyBonusAmount;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === ME_ID
          ? { ...applyPoints(u, newPoints, grades), lastDailyBonusAt: new Date() }
          : u
      )
    );
    pushNotification({
      type: "system",
      title: `일일 보너스 +${dailyBonusAmount.toLocaleString()}P 🎁`,
      body: `${myGrade.emoji} ${myGrade.name} 등급 보너스를 받았습니다. 내일 또 받을 수 있어요!`,
    });
    notifyGradeUp(me, oldPoints, newPoints);
  }, [dailyBonusReady, dailyBonusAmount, me, myGrade, grades, setUsers, pushNotification, notifyGradeUp]);

  // 포인트가 바닥나면 게임이 끝나버리므로, 최소 잔고까지 받쳐준다.
  const reliefAvailable = me.points < RELIEF_THRESHOLD;
  const claimRelief = useCallback(() => {
    if (!reliefAvailable) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === ME_ID ? applyPoints(u, RELIEF_FLOOR, grades) : u))
    );
    pushNotification({
      type: "system",
      title: "재기 지원금 지급 💪",
      body: `포인트가 ${RELIEF_FLOOR}P로 채워졌습니다. 다시 예언해보세요!`,
    });
  }, [reliefAvailable, grades, setUsers, pushNotification]);

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    [setNotifications]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [setNotifications]);

  /* ── Grade thresholds ── */
  const saveThresholds = useCallback(
    (next: GradeThresholds) => {
      setThresholds(next);
      const nextGrades = resolveGrades(next);
      setUsers((prev) =>
        prev.map((u) =>
          u.gradeOverride ? u : { ...u, gradeId: getGradeByPoints(u.points, nextGrades).id }
        )
      );
    },
    [setThresholds, setUsers]
  );

  const gradeByPoints = useCallback(
    (points: number) => getGradeByPoints(points, grades),
    [grades]
  );

  const nextGradeProgress = useCallback(
    (points: number) => getNextGradeProgress(points, grades),
    [grades]
  );

  /* ── Comments ── */
  const commentsFor = useCallback(
    (oracleId: string) => comments.filter((c) => c.oracleId === oracleId),
    [comments]
  );

  const addComment = useCallback(
    (oracleId: string, text: string) => {
      const body = text.trim();
      if (!body) return;
      setComments((prev) => [
        {
          id: nextId("c"),
          oracleId,
          author: me.name,
          avatar: me.avatar,
          gradeId: me.gradeId,
          text: body,
          likes: 0,
          likedByMe: false,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setOracles((prev) =>
        prev.map((o) => (o.id === oracleId ? { ...o, commentCount: o.commentCount + 1 } : o))
      );
    },
    [me.name, me.avatar, me.gradeId, setComments, setOracles]
  );

  const toggleCommentLike = useCallback(
    (commentId: string) => {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likedByMe: !c.likedByMe,
                likes: c.likedByMe ? Math.max(0, c.likes - 1) : c.likes + 1,
              }
            : c
        )
      );
    },
    [setComments]
  );

  /* ── Derived ── */
  const myOraclesToday = useMemo(() => {
    const today = new Date();
    return oracles.filter(
      (o) =>
        o.creatorName === me.name &&
        o.id !== TUTORIAL_ID &&
        isSameDay(new Date(o.createdAt), today)
    ).length;
  }, [oracles, me.name]);

  /* ── Context values ── */
  const oracleValue = useMemo<OracleContextValue>(
    () => ({ oracles, addOracle, updateOracle, closeOracle, myOraclesToday }),
    [oracles, addOracle, updateOracle, closeOracle, myOraclesToday]
  );

  const userValue = useMemo<UserContextValue>(
    () => ({
      me, users, myBets, notifications, following, activity,
      placeBet, cancelBet, markNotificationRead, markAllRead, adjustPoints,
      updateUser, toggleBan, toggleFollow, isFollowing,
      dailyBonusReady, dailyBonusAmount, claimDailyBonus,
      reliefAvailable, claimRelief,
    }),
    [
      me, users, myBets, notifications, following, activity,
      placeBet, cancelBet, markNotificationRead, markAllRead, adjustPoints,
      updateUser, toggleBan, toggleFollow, isFollowing,
      dailyBonusReady, dailyBonusAmount, claimDailyBonus,
      reliefAvailable, claimRelief,
    ]
  );

  const gradeValue = useMemo<GradeContextValue>(
    () => ({
      grades, thresholds, saveThresholds, gradeByPoints, nextGradeProgress,
      gradeUpEvent, clearGradeUp,
    }),
    [grades, thresholds, saveThresholds, gradeByPoints, nextGradeProgress, gradeUpEvent, clearGradeUp]
  );

  const commentValue = useMemo<CommentContextValue>(
    () => ({ commentsFor, addComment, toggleCommentLike }),
    [commentsFor, addComment, toggleCommentLike]
  );

  const uiValue = useMemo<UIContextValue>(
    () => ({ tagFilter, setTagFilter, onboarded, finishOnboarding }),
    [tagFilter, onboarded, finishOnboarding]
  );

  return (
    <OracleContext.Provider value={oracleValue}>
      <UserContext.Provider value={userValue}>
        <GradeContext.Provider value={gradeValue}>
          <CommentContext.Provider value={commentValue}>
            <UIContext.Provider value={uiValue}>{children}</UIContext.Provider>
          </CommentContext.Provider>
        </GradeContext.Provider>
      </UserContext.Provider>
    </OracleContext.Provider>
  );
}

/* ── Hooks ── */
export function useOracles() {
  const ctx = useContext(OracleContext);
  if (!ctx) throw new Error("useOracles must be used inside AppProvider");
  return ctx;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside AppProvider");
  return ctx;
}

export function useGrades() {
  const ctx = useContext(GradeContext);
  if (!ctx) throw new Error("useGrades must be used inside AppProvider");
  return ctx;
}

export function useComments() {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error("useComments must be used inside AppProvider");
  return ctx;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside AppProvider");
  return ctx;
}

export type { GradeId };
