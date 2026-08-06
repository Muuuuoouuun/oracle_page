"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Oracle, UserProfile, UserBet } from "./types";
import { MOCK_ORACLES } from "./mockData";
import { getGradeByPoints } from "./grades";

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
  status: "pending" | "won" | "lost";
  payout?: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  emoji: string;
  type: "success" | "info" | "error";
}

interface OracleContextValue {
  oracles: Oracle[];
  addOracle: (oracle: Oracle) => void;
  updateOracle: (id: string, patch: Partial<Oracle>) => void;
  closeOracle: (id: string, winningOptionId: string) => void;
}

interface UserContextValue {
  me: UserProfile;
  myBets: MyBetRecord[];
  notifications: Notification[];
  toast: ToastMessage | null;
  placeBet: (oracleId: string, optionId: string, optionLabel: string, amount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  adjustPoints: (delta: number) => void;
  showToast: (text: string, emoji?: string, type?: ToastMessage["type"]) => void;
  updateUser: (userId: string, patch: Partial<UserProfile>) => void;
}

/* ── Contexts ── */
const OracleContext = createContext<OracleContextValue | null>(null);
const UserContext = createContext<UserContextValue | null>(null);

/* ── Initial data ── */
const INITIAL_ME: UserProfile = {
  id: "me",
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

/* ── Date reviver for JSON.parse ── */
function dateReviver(_: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}

/* ── Toast UI ── */
function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const bgMap = {
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500/50",
    info:    "bg-gradient-to-r from-oracle-purple to-oracle-violet border-oracle-purple/50",
    error:   "bg-gradient-to-r from-red-600 to-rose-600 border-red-500/50",
  };

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ animation: "slideUp 0.25s ease-out" }}
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-2xl text-white text-sm font-bold whitespace-nowrap ${bgMap[toast.type]}`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        <span className="text-base">{toast.emoji}</span>
        {toast.text}
      </div>
    </div>
  );
}

/* ── Provider ── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [oracles, setOracles] = useState<Oracle[]>(MOCK_ORACLES);
  const [me, setMe] = useState<UserProfile>(INITIAL_ME);
  const [myBets, setMyBets] = useState<MyBetRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Always-current refs for use inside callbacks (avoids stale closures)
  const oraclesRef = useRef(oracles);
  const myBetsRef = useRef(myBets);
  oraclesRef.current = oracles;
  myBetsRef.current = myBets;

  /* ── Persist: load from localStorage on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oracle_app_state");
      if (saved) {
        const data = JSON.parse(saved, dateReviver);
        if (Array.isArray(data.oracles) && data.oracles.length) setOracles(data.oracles);
        if (data.me) setMe(data.me);
        if (Array.isArray(data.myBets)) setMyBets(data.myBets);
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
      }
    } catch {}
    setLoaded(true);
  }, []);

  /* ── Persist: save to localStorage on change ── */
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("oracle_app_state", JSON.stringify({ oracles, me, myBets, notifications }));
    } catch {}
  }, [oracles, me, myBets, notifications, loaded]);

  /* ── Auto-expiry: close oracles past endsAt every 60s ── */
  useEffect(() => {
    const check = () => {
      setOracles((prev) => {
        const now = Date.now();
        if (!prev.some((o) => o.status === "live" && o.endsAt.getTime() < now)) return prev;
        return prev.map((o) =>
          o.status === "live" && o.endsAt.getTime() < now ? { ...o, status: "closed" } : o
        );
      });
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((text: string, emoji = "✨", type: ToastMessage["type"] = "success") => {
    setToast({ id: `toast-${Date.now()}`, text, emoji, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  /* ── Oracle actions ── */
  const addOracle = useCallback((oracle: Oracle) => {
    setOracles((prev) => [oracle, ...prev]);
  }, []);

  const updateOracle = useCallback((id: string, patch: Partial<Oracle>) => {
    setOracles((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const closeOracle = useCallback((id: string, winningOptionId: string) => {
    const oracle = oraclesRef.current.find((o) => o.id === id);
    const winningOption = oracle?.options.find((o) => o.id === winningOptionId);
    const myBet = myBetsRef.current.find((b) => b.oracleId === id);

    // Close the oracle
    setOracles((prev) => prev.map((o) => (o.id === id ? { ...o, status: "closed" } : o)));

    // Update all bet statuses with payouts
    setMyBets((prev) =>
      prev.map((b) => {
        if (b.oracleId !== id) return b;
        const won = b.optionId === winningOptionId;
        const payout = won ? Math.floor(b.amount * (winningOption?.odds ?? 2)) : 0;
        return { ...b, status: (won ? "won" : "lost") as "won" | "lost", payout };
      })
    );

    // Distribute payout and notify if my bet is involved
    if (myBet) {
      const won = myBet.optionId === winningOptionId;
      const payout = won ? Math.floor(myBet.amount * (winningOption?.odds ?? 2)) : 0;

      if (won && payout > 0) {
        setMe((prev) => ({
          ...prev,
          points: prev.points + payout,
          wonBets: prev.wonBets + 1,
          accuracy: prev.totalBets > 0
            ? Math.round(((prev.wonBets + 1) / prev.totalBets) * 100)
            : 100,
        }));
        showToast(`+${payout.toLocaleString()}P 당첨! 🎉`, "💰", "success");
      }

      setNotifications((prev) => [
        {
          id: `n-result-${id}`,
          type: "bet_result",
          title: won ? "예언 적중! 🎉" : "예언 실패 😢",
          body: won
            ? `"${oracle?.title}" 예언 적중! +${payout.toLocaleString()}P 획득!`
            : `"${oracle?.title}" 예언이 빗나갔어요. 다음엔 꼭!`,
          isRead: false,
          createdAt: new Date(),
          oracleId: id,
        },
        ...prev,
      ]);
    }
  }, [showToast]);

  /* ── User actions ── */
  const placeBet = useCallback((
    oracleId: string, optionId: string, optionLabel: string, amount: number
  ) => {
    // Look up oracle title from always-current ref
    const oracle = oraclesRef.current.find((o) => o.id === oracleId);
    const oracleTitle = oracle?.title ?? "예언";

    // Update oracle's live stats and recalculate percentages/odds
    setOracles((prev) =>
      prev.map((o) => {
        if (o.id !== oracleId) return o;
        const newParticipants = o.totalParticipants + 1;
        const newPool = o.totalPool + amount;
        const rawOptions = o.options.map((opt) => ({
          ...opt,
          totalBets: opt.id === optionId ? opt.totalBets + 1 : opt.totalBets,
        }));
        const totalBettors = rawOptions.reduce((s, opt) => s + opt.totalBets, 0);
        const updatedOptions = rawOptions.map((opt) => ({
          ...opt,
          percentage: totalBettors > 0
            ? Math.round((opt.totalBets / totalBettors) * 100)
            : Math.round(100 / rawOptions.length),
          odds: opt.totalBets > 0
            ? Math.max(1.1, parseFloat(((totalBettors / opt.totalBets) * 0.9).toFixed(1)))
            : opt.odds,
        }));
        // Fix rounding drift so percentages sum to exactly 100
        const pctSum = updatedOptions.reduce((s, opt) => s + opt.percentage, 0);
        if (pctSum !== 100 && updatedOptions.length > 0) {
          updatedOptions[0] = { ...updatedOptions[0], percentage: updatedOptions[0].percentage + (100 - pctSum) };
        }
        return { ...o, totalParticipants: newParticipants, totalPool: newPool, options: updatedOptions };
      })
    );

    // Deduct points and update grade
    setMe((prev) => {
      const newPoints = prev.points - amount;
      const newGrade = getGradeByPoints(newPoints);
      return { ...prev, points: newPoints, totalBets: prev.totalBets + 1, gradeId: newGrade.id };
    });

    // Record the bet
    setMyBets((prev) => [
      {
        id: `bet-${Date.now()}`,
        oracleId,
        optionId,
        optionLabel,
        oracleTitle,
        amount,
        placedAt: new Date(),
        status: "pending",
      },
      ...prev,
    ]);

    showToast(`${optionLabel} 예언 완료! (${amount}P)`, "🎯", "success");
  }, [showToast]);

  const adjustPoints = useCallback((delta: number) => {
    setMe((prev) => {
      const newPoints = Math.max(0, prev.points + delta);
      const newGrade = getGradeByPoints(newPoints);
      const oldGrade = getGradeByPoints(prev.points);
      const didUpgrade = newGrade.rank > oldGrade.rank;
      if (didUpgrade) {
        setNotifications((n) => [
          {
            id: `n-grade-${Date.now()}`,
            type: "grade_up",
            title: `등급 승급! ${newGrade.emoji} ${newGrade.name}`,
            body: `축하합니다! ${newGrade.title}(으)로 승급했습니다!`,
            isRead: false,
            createdAt: new Date(),
          },
          ...n,
        ]);
        showToast(`${newGrade.emoji} ${newGrade.name} 승급!`, "🎊", "success");
      } else if (delta > 0) {
        showToast(`+${delta.toLocaleString()}P 획득!`, "💰", "success");
      }
      return { ...prev, points: newPoints, gradeId: newGrade.id };
    });
  }, [showToast]);

  const updateUser = useCallback((userId: string, patch: Partial<UserProfile>) => {
    if (userId === "me") {
      setMe((prev) => {
        const next = { ...prev, ...patch };
        // Auto-recalculate grade from points unless grade is explicitly overridden
        if (patch.points !== undefined && patch.gradeId === undefined && !next.gradeOverride) {
          next.gradeId = getGradeByPoints(patch.points).id;
        }
        return next;
      });
    }
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return (
    <OracleContext.Provider value={{ oracles, addOracle, updateOracle, closeOracle }}>
      <UserContext.Provider value={{ me, myBets, notifications, toast, placeBet, markNotificationRead, markAllRead, adjustPoints, showToast, updateUser }}>
        {children}
        {toast && <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />}
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
