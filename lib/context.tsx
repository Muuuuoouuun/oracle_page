"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Comment, Oracle, UserBet, UserProfile } from "./types";
import { recalcOptions } from "./betting";
import { MOCK_COMMENTS, MOCK_ORACLES } from "./mockData";
import { MOCK_USERS } from "./adminData";
import {
  DEFAULT_THRESHOLDS,
  getGradeByPoints,
  getNextGradeProgress,
  resolveGrades,
  type Grade,
  type GradeId,
  type GradeThresholds,
} from "./grades";
import { STORAGE_KEYS, loadState, saveState } from "./storage";

/** 로그인한 "나"의 고정 id. 백엔드가 없으므로 세션당 한 명. */
export const ME_ID = "me";

/* ── Types ── */
export interface Notification {
  id: string;
  type: "bet_result" | "grade_up" | "deadline" | "comment" | "system";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  oracleId?: string;
}

export interface MyBetRecord extends UserBet {
  id: string;
  oracleTitle: string;
  optionLabel: string;
  /** 배팅 시점에 확정된 배당률. 이후 시장 배당이 변해도 정산은 이 값으로 한다. */
  odds: number;
  status: "pending" | "won" | "lost";
  payout?: number;
}

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
  /** 옵션 라벨/예언 제목은 oracleId+optionId 로부터 직접 해석한다. */
  placeBet: (oracleId: string, optionId: string, amount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  adjustPoints: (delta: number) => void;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  toggleBan: (id: string) => void;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
}

interface GradeContextValue {
  /** 현재 임계값이 반영된 등급 목록 */
  grades: Grade[];
  thresholds: GradeThresholds;
  saveThresholds: (next: GradeThresholds) => void;
  gradeByPoints: (points: number) => Grade;
  nextGradeProgress: (points: number) => ReturnType<typeof getNextGradeProgress>;
}

interface CommentContextValue {
  commentsFor: (oracleId: string) => Comment[];
  addComment: (oracleId: string, text: string) => void;
  toggleCommentLike: (commentId: string) => void;
}

/* ── Contexts ── */
const OracleContext = createContext<OracleContextValue | null>(null);
const UserContext = createContext<UserContextValue | null>(null);
const GradeContext = createContext<GradeContextValue | null>(null);
const CommentContext = createContext<CommentContextValue | null>(null);

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
};

const INITIAL_USERS: UserProfile[] = [INITIAL_ME, ...MOCK_USERS];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "system",
    title: "Oracle Page에 오신걸 환영합니다! 🔮",
    body: "첫 예언에 참여하고 이상해씨 등급으로 승급하세요!",
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "n2",
    type: "deadline",
    title: "마감임박 예언이 있어요 ⏰",
    body: "내일 서울 기온 예언이 20시간 뒤 마감됩니다!",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    oracleId: "4",
  },
  {
    id: "n3",
    type: "system",
    title: "신규 HOT 예언 등록 🔥",
    body: "손흥민 월드컵 출전 예언이 4,000명을 돌파했습니다!",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    oracleId: "2",
  },
];

/**
 * localStorage 와 동기화되는 state.
 * SSR 에서는 항상 initial 로 렌더하고, 마운트 이후에만 저장값을 덮어씌워
 * 하이드레이션 미스매치를 피한다.
 */
function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadState<T>(key);
    if (stored !== null) setState(stored);
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    // 하이드레이션 전에 저장하면 기본값이 저장값을 덮어쓴다.
    if (hydrated) saveState(key, state);
  }, [key, hydrated, state]);

  return [state, setState] as const;
}

/* ── Provider ── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [oracles, setOracles] = usePersistentState<Oracle[]>(
    STORAGE_KEYS.oracles,
    MOCK_ORACLES
  );
  const [users, setUsers] = usePersistentState<UserProfile[]>(
    STORAGE_KEYS.users,
    INITIAL_USERS
  );
  const [myBets, setMyBets] = usePersistentState<MyBetRecord[]>(STORAGE_KEYS.myBets, []);
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

  const grades = useMemo(() => resolveGrades(thresholds), [thresholds]);
  const me = useMemo(
    () => users.find((u) => u.id === ME_ID) ?? INITIAL_ME,
    [users]
  );

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

  /** 포인트 변화로 등급이 올랐으면 승급 알림을 남긴다. */
  const notifyGradeUp = useCallback(
    (user: UserProfile, oldPoints: number, newPoints: number) => {
      if (user.gradeOverride) return;
      const before = getGradeByPoints(oldPoints, grades);
      const after = getGradeByPoints(newPoints, grades);
      if (after.rank <= before.rank) return;
      pushNotification({
        type: "grade_up",
        title: `등급 승급! ${after.emoji} ${after.name}`,
        body: `축하합니다! ${after.title}(으)로 승급했습니다!`,
      });
    },
    [grades, pushNotification]
  );

  /* ── Oracle actions ── */
  const addOracle = useCallback(
    (oracle: Oracle) => {
      setOracles((prev) => [oracle, ...prev]);
    },
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
      if (amount <= 0 || me.points < amount) return;

      const isFirstBetOnThisOracle = !myBets.some((b) => b.oracleId === oracleId);
      const lockedOdds = option.odds;

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
            totalParticipants: o.totalParticipants + (isFirstBetOnThisOracle ? 1 : 0),
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

      // 3) 배팅 내역 기록 (배당률을 이 시점 값으로 고정)
      setMyBets((prev) => [
        {
          id: nextId("bet"),
          oracleId,
          optionId,
          optionLabel: option.label,
          oracleTitle: oracle.title,
          amount,
          odds: lockedOdds,
          placedAt: new Date(),
          status: "pending",
        },
        ...prev,
      ]);
    },
    [oracles, myBets, me.points, grades, setOracles, setUsers, setMyBets]
  );

  /* ── Settlement ── */
  const closeOracle = useCallback(
    (id: string, winningOptionId: string) => {
      const oracle = oracles.find((o) => o.id === id);
      if (!oracle) return;
      if (!oracle.options.some((o) => o.id === winningOptionId)) return;

      // 1) 예언 종료 + 정답 저장
      setOracles((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "closed" as const, winningOptionId } : o
        )
      );

      // 2) 아직 정산되지 않은 내 배팅만 정산 (재정산으로 이중 지급되지 않도록)
      const pending = myBets.filter((b) => b.oracleId === id && b.status === "pending");
      if (pending.length === 0) return;

      const settled = new Map<string, MyBetRecord>();
      let totalPayout = 0;
      for (const bet of pending) {
        const won = bet.optionId === winningOptionId;
        const payout = won ? Math.floor(bet.amount * bet.odds) : 0;
        totalPayout += payout;
        settled.set(bet.id, {
          ...bet,
          status: won ? ("won" as const) : ("lost" as const),
          payout,
        });
      }

      const nextBets = myBets.map((b) => settled.get(b.id) ?? b);
      const decided = nextBets.filter((b) => b.status !== "pending");
      const wonCount = decided.filter((b) => b.status === "won").length;
      const accuracy = decided.length
        ? Math.round((wonCount / decided.length) * 100)
        : 0;

      setMyBets(nextBets);

      // 3) 당첨금 자동 지급 + 적중 통계 갱신
      setUsers((prev) =>
        prev.map((u) =>
          u.id === ME_ID
            ? {
                ...applyPoints(u, u.points + totalPayout, grades),
                wonBets: wonCount,
                accuracy,
              }
            : u
        )
      );

      const iWon = totalPayout > 0;
      pushNotification({
        type: "bet_result",
        title: iWon ? "예언 적중! 🎉" : "예언 실패 😢",
        body: iWon
          ? `"${oracle.title}" 예언이 적중했습니다! ${totalPayout.toLocaleString()}P를 획득했습니다.`
          : `"${oracle.title}" 예언이 빗나갔습니다. 다음엔 꼭!`,
        oracleId: id,
      });

      notifyGradeUp(me, me.points, me.points + totalPayout);
    },
    [oracles, myBets, me, grades, setOracles, setMyBets, setUsers, pushNotification, notifyGradeUp]
  );

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

  const isFollowing = useCallback(
    (userId: string) => following.includes(userId),
    [following]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
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
      // 임계값이 바뀌면 수동 지정되지 않은 유저의 등급을 다시 계산한다.
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
      // 카드에 노출되는 댓글 수도 같이 올린다.
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
      (o) => o.creatorName === me.name && isSameDay(new Date(o.createdAt), today)
    ).length;
  }, [oracles, me.name]);

  /* ── Context values ── */
  const oracleValue = useMemo<OracleContextValue>(
    () => ({ oracles, addOracle, updateOracle, closeOracle, myOraclesToday }),
    [oracles, addOracle, updateOracle, closeOracle, myOraclesToday]
  );

  const userValue = useMemo<UserContextValue>(
    () => ({
      me,
      users,
      myBets,
      notifications,
      following,
      placeBet,
      markNotificationRead,
      markAllRead,
      adjustPoints,
      updateUser,
      toggleBan,
      toggleFollow,
      isFollowing,
    }),
    [
      me, users, myBets, notifications, following, placeBet,
      markNotificationRead, markAllRead, adjustPoints, updateUser,
      toggleBan, toggleFollow, isFollowing,
    ]
  );

  const gradeValue = useMemo<GradeContextValue>(
    () => ({ grades, thresholds, saveThresholds, gradeByPoints, nextGradeProgress }),
    [grades, thresholds, saveThresholds, gradeByPoints, nextGradeProgress]
  );

  const commentValue = useMemo<CommentContextValue>(
    () => ({ commentsFor, addComment, toggleCommentLike }),
    [commentsFor, addComment, toggleCommentLike]
  );

  return (
    <OracleContext.Provider value={oracleValue}>
      <UserContext.Provider value={userValue}>
        <GradeContext.Provider value={gradeValue}>
          <CommentContext.Provider value={commentValue}>{children}</CommentContext.Provider>
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

export type { GradeId };
