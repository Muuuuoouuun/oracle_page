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
  UserProfile,
} from "./types";
import {
  DEFAULT_THRESHOLDS,
  dailyBonusFor,
  getGradeByPoints,
  getNextGradeProgress,
  resolveGrades,
  RELIEF_THRESHOLD,
  type Grade,
  type GradeId,
  type GradeThresholds,
} from "./grades";
import { createLocalDataSource, ME_ID, TUTORIAL_ID } from "./data/local";
import { createSupabaseDataSource, GUEST_ID } from "./data/supabase";
import {
  DataError,
  type AppSnapshot,
  type CreateOracleInput,
  type DataSource,
  type SettlementMode,
  type SettlementReview,
} from "./data/types";
import { getSupabaseBrowser } from "./supabase/client";
import { STORAGE_KEYS, loadState, saveState } from "./storage";

export { ME_ID, TUTORIAL_ID, GUEST_ID };
export type { MyBetRecord, Notification } from "./types";
export type { SettlementMode, SettlementReview } from "./data/types";

/* ── Context 값 ── */
interface OracleContextValue {
  oracles: Oracle[];
  createOracle: (input: CreateOracleInput) => void;
  updateOracle: (id: string, patch: Partial<Oracle>) => void;
  /** 정답을 확정하고 정산한다 (관리자) */
  closeOracle: (id: string, winningOptionId: string, note?: string) => void;
  /** 판정 불가한 예언을 무효 처리하고 전원 환불한다 (관리자) */
  voidOracle: (id: string, note?: string) => void;
  /** 오늘 내가 만든 예언 수 (등급별 일일 생성 제한에 사용) */
  myOraclesToday: number;
  /** 마감됐지만 아직 결과가 확정되지 않은 예언 (승인 큐) */
  awaitingOracles: Oracle[];
  settlementMode: SettlementMode;
  setSettlementMode: (mode: SettlementMode) => void;
  /** 최근 결재 기록 */
  reviews: SettlementReview[];
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
  updateUser: (
    id: string,
    patch: { points?: number; gradeId?: GradeId; gradeOverride?: boolean }
  ) => void;
  toggleBan: (id: string) => void;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  dailyBonusReady: boolean;
  dailyBonusAmount: number;
  claimDailyBonus: () => void;
  reliefAvailable: boolean;
  claimRelief: () => void;
}

interface GradeContextValue {
  grades: Grade[];
  thresholds: GradeThresholds;
  saveThresholds: (next: GradeThresholds) => void;
  gradeByPoints: (points: number) => Grade;
  nextGradeProgress: (points: number) => ReturnType<typeof getNextGradeProgress>;
  gradeUpEvent: Grade | null;
  clearGradeUp: () => void;
}

interface CommentContextValue {
  commentsFor: (oracleId: string) => Comment[];
  addComment: (oracleId: string, text: string) => void;
  toggleCommentLike: (commentId: string) => void;
}

interface UIContextValue {
  tagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  onboarded: boolean;
  finishOnboarding: () => void;
  /** 저장소 모드 — 안내 문구를 바꾸는 데 쓴다 */
  mode: "local" | "supabase";
  /** 마지막으로 실패한 동작의 메시지 (서버가 거절한 이유) */
  error: string | null;
  dismissError: () => void;
}

const OracleContext = createContext<OracleContextValue | null>(null);
const UserContext = createContext<UserContextValue | null>(null);
const GradeContext = createContext<GradeContextValue | null>(null);
const CommentContext = createContext<CommentContextValue | null>(null);
const UIContext = createContext<UIContextValue | null>(null);

/* ── 초기 스냅샷 : SSR 과 첫 렌더에서 쓰는 빈 상태 ── */
const EMPTY_ME: UserProfile = {
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
  joinedAt: new Date(0),
  lastActive: new Date(0),
  isBanned: false,
  currentStreak: 0,
  bestStreak: 0,
};

const EMPTY: AppSnapshot = {
  oracles: [],
  users: [EMPTY_ME],
  me: EMPTY_ME,
  myBets: [],
  notifications: [],
  comments: [],
  following: [],
  activity: [],
  thresholds: DEFAULT_THRESHOLDS,
  settlementMode: "review",
  reviews: [],
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  // 저장소는 마운트 이후에 정한다. SSR 에서는 localStorage 도 세션도 없기 때문에,
  // 서버와 클라이언트가 같은 빈 스냅샷으로 시작해야 하이드레이션이 깨지지 않는다.
  const [source, setSource] = useState<DataSource | null>(null);
  const [snapshot, setSnapshot] = useState<AppSnapshot>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [gradeUpEvent, setGradeUpEvent] = useState<Grade | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  /* ── 저장소 선택 ── */
  useEffect(() => {
    // 저장소(localStorage / Supabase 세션)는 서버에 존재하지 않는다. 렌더 중에
    // 정하면 서버가 만든 HTML 과 달라져 하이드레이션이 깨지므로, 마운트 이후에
    // 한 번 정한다. 규칙이 경고하는 "연쇄 렌더"는 마운트 직후 한 번뿐이다.
    /* eslint-disable react-hooks/set-state-in-effect */
    const supabase = getSupabaseBrowser();
    setSource(supabase ? createSupabaseDataSource(supabase) : createLocalDataSource());
    setOnboarded(loadState<boolean>(STORAGE_KEYS.onboarded) ?? false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /* ── 스냅샷 로드 + 구독 ── */
  const refresh = useCallback(async (src: DataSource) => {
    try {
      setSnapshot(await src.load());
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    if (!source) return;
    // 저장소를 구독하고 첫 스냅샷을 읽는다 — 바로 이 규칙이 말하는
    // "외부 시스템 구독"에 해당한다. 첫 로드만 동기적으로 상태를 채운다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(source);
    return source.subscribe?.(() => void refresh(source));
  }, [source, refresh]);

  /* ── 승급 감지 ──
     포인트가 오른 결과 등급이 바뀌면 연출을 띄운다. 로컬·서버 어느 쪽에서
     계산했든 스냅샷의 gradeId 변화만 보면 되므로 한 곳에서 처리한다. */
  const prevGradeRef = useRef<GradeId | null>(null);
  const grades = useMemo(() => resolveGrades(snapshot.thresholds), [snapshot.thresholds]);

  useEffect(() => {
    const now = snapshot.me.gradeId;
    const before = prevGradeRef.current;
    prevGradeRef.current = now;
    if (before === null || before === now) return;

    const from = grades.find((g) => g.id === before);
    const to = grades.find((g) => g.id === now);
    if (from && to && to.rank > from.rank) setGradeUpEvent(to);
  }, [snapshot.me.gradeId, grades]);

  /* ── 마감 자동 정산 ──
     로컬 모드에서는 클라이언트가 돌린다. Supabase 모드에서는 서버 크론이
     맡으므로 settleDue() 가 아무 일도 하지 않는다. */
  const settleRef = useRef<() => void>(() => {});
  useEffect(() => {
    settleRef.current = () => {
      if (!source) return;
      void source.settleDue().then(() => refresh(source));
    };
  }, [source, refresh]);

  useEffect(() => {
    if (!source) return;
    const tick = () => settleRef.current();
    tick();
    const timer = setInterval(tick, 4000);
    return () => clearInterval(timer);
  }, [source]);

  /* ── 변경 동작 공통 처리 ──
     실패하면 사용자에게 이유를 보여주고, 성공하면 스냅샷을 다시 읽는다. */
  const run = useCallback(
    (action: (src: DataSource) => Promise<void>) => {
      if (!source) return;
      void (async () => {
        try {
          await action(source);
          setError(null);
        } catch (e) {
          setError(
            e instanceof DataError || e instanceof Error
              ? e.message
              : "요청을 처리하지 못했습니다."
          );
        } finally {
          await refresh(source);
        }
      })();
    },
    [source, refresh]
  );

  /* ── 파생 값 ── */
  const me = snapshot.me;
  const myGrade = useMemo(
    () => grades.find((g) => g.id === me.gradeId) ?? grades[0],
    [grades, me.gradeId]
  );

  const dailyBonusAmount = dailyBonusFor(myGrade.rank);
  const dailyBonusReady = useMemo(
    () => !me.lastDailyBonusAt || !isSameDay(new Date(me.lastDailyBonusAt), new Date()),
    [me.lastDailyBonusAt]
  );
  const reliefAvailable = me.id !== GUEST_ID && me.points < RELIEF_THRESHOLD;

  // 승인 큐 — 오래 기다린 것이 위로
  const awaitingOracles = useMemo(
    () =>
      snapshot.oracles
        .filter((o) => o.status === "awaiting")
        .sort(
          (a, b) =>
            new Date(a.awaitingSince ?? a.endsAt).getTime() -
            new Date(b.awaitingSince ?? b.endsAt).getTime()
        ),
    [snapshot.oracles]
  );

  const myOraclesToday = useMemo(() => {
    const today = new Date();
    return snapshot.oracles.filter(
      (o) =>
        o.creatorName === me.name &&
        o.id !== TUTORIAL_ID &&
        isSameDay(new Date(o.createdAt), today)
    ).length;
  }, [snapshot.oracles, me.name]);

  /* ── Context 값 ── */
  const oracleValue = useMemo<OracleContextValue>(
    () => ({
      oracles: snapshot.oracles,
      createOracle: (input) => run((s) => s.createOracle(input)),
      updateOracle: (id, patch) => run((s) => s.updateOracle(id, patch)),
      closeOracle: (id, winningOptionId, note) =>
        run((s) => s.settleOracle(id, winningOptionId, note)),
      voidOracle: (id, note) => run((s) => s.voidOracle(id, note)),
      myOraclesToday,
      awaitingOracles,
      settlementMode: snapshot.settlementMode,
      setSettlementMode: (mode) => run((s) => s.setSettlementMode(mode)),
      reviews: snapshot.reviews,
    }),
    [snapshot.oracles, snapshot.settlementMode, snapshot.reviews, myOraclesToday, awaitingOracles, run]
  );

  const userValue = useMemo<UserContextValue>(
    () => ({
      me,
      users: snapshot.users,
      myBets: snapshot.myBets,
      notifications: snapshot.notifications,
      following: snapshot.following,
      activity: snapshot.activity,
      placeBet: (oracleId, optionId, amount) =>
        run((s) => s.placeBet(oracleId, optionId, amount)),
      cancelBet: (betId) => run((s) => s.cancelBet(betId)),
      markNotificationRead: (id) => run((s) => s.markNotificationRead(id)),
      markAllRead: () => run((s) => s.markAllNotificationsRead()),
      updateUser: (id, patch) => run((s) => s.updateUser(id, patch)),
      toggleBan: (id) => run((s) => s.toggleBan(id)),
      toggleFollow: (userId) => run((s) => s.toggleFollow(userId)),
      isFollowing: (userId) => snapshot.following.includes(userId),
      dailyBonusReady,
      dailyBonusAmount,
      claimDailyBonus: () => run((s) => s.claimDailyBonus()),
      reliefAvailable,
      claimRelief: () => run((s) => s.claimRelief()),
    }),
    [me, snapshot, dailyBonusReady, dailyBonusAmount, reliefAvailable, run]
  );

  const gradeValue = useMemo<GradeContextValue>(
    () => ({
      grades,
      thresholds: snapshot.thresholds,
      saveThresholds: (next) => run((s) => s.saveThresholds(next)),
      gradeByPoints: (points) => getGradeByPoints(points, grades),
      nextGradeProgress: (points) => getNextGradeProgress(points, grades),
      gradeUpEvent,
      clearGradeUp: () => setGradeUpEvent(null),
    }),
    [grades, snapshot.thresholds, gradeUpEvent, run]
  );

  const commentValue = useMemo<CommentContextValue>(
    () => ({
      commentsFor: (oracleId) => snapshot.comments.filter((c) => c.oracleId === oracleId),
      addComment: (oracleId, text) => run((s) => s.addComment(oracleId, text)),
      toggleCommentLike: (commentId) => run((s) => s.toggleCommentLike(commentId)),
    }),
    [snapshot.comments, run]
  );

  const uiValue = useMemo<UIContextValue>(
    () => ({
      tagFilter,
      setTagFilter,
      onboarded,
      finishOnboarding: () => {
        setOnboarded(true);
        saveState(STORAGE_KEYS.onboarded, true);
      },
      mode: source?.mode ?? "local",
      error,
      dismissError: () => setError(null),
    }),
    [tagFilter, onboarded, source, error]
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
