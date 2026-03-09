"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Oracle, UserProfile, UserBet } from "./types";
import { MOCK_ORACLES } from "./mockData";
import { MOCK_USERS } from "./adminData";
import { getGradeByPoints, GradeId } from "./grades";

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
  placeBet: (oracleId: string, optionId: string, optionLabel: string, oracleTitle: string, amount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  adjustPoints: (delta: number) => void;
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

/* ── Provider ── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [oracles, setOracles] = useState<Oracle[]>(MOCK_ORACLES);
  const [me, setMe] = useState<UserProfile>(INITIAL_ME);
  const [myBets, setMyBets] = useState<MyBetRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  /* Oracle actions */
  const addOracle = useCallback((oracle: Oracle) => {
    setOracles((prev) => [oracle, ...prev]);
  }, []);

  const updateOracle = useCallback((id: string, patch: Partial<Oracle>) => {
    setOracles((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const closeOracle = useCallback((id: string, winningOptionId: string) => {
    setOracles((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "closed" } : o))
    );
    // Settle bets
    setMyBets((prev) =>
      prev.map((b) => {
        if (b.oracleId !== id) return b;
        const won = b.optionId === winningOptionId;
        return { ...b, status: won ? "won" : "lost" };
      })
    );
    // Add notification
    const oracle = oracles.find((o) => o.id === id);
    const myBet = myBets.find((b) => b.oracleId === id);
    if (myBet) {
      const won = myBet.optionId === winningOptionId;
      setNotifications((prev) => [
        {
          id: `n-result-${id}`,
          type: "bet_result",
          title: won ? "예언 적중! 🎉" : "예언 실패 😢",
          body: won
            ? `"${oracle?.title}" 예언이 적중했습니다! 포인트를 획득했습니다.`
            : `"${oracle?.title}" 예언이 빗나갔습니다. 다음엔 꼭!`,
          isRead: false,
          createdAt: new Date(),
          oracleId: id,
        },
        ...prev,
      ]);
    }
  }, [oracles, myBets]);

  /* User actions */
  const placeBet = useCallback((
    oracleId: string, optionId: string, optionLabel: string, oracleTitle: string, amount: number
  ) => {
    setMe((prev) => {
      const newPoints = prev.points - amount;
      const newTotalBets = prev.totalBets + 1;
      const newGrade = getGradeByPoints(newPoints);
      return { ...prev, points: newPoints, totalBets: newTotalBets, gradeId: newGrade.id };
    });
    setMyBets((prev) => [
      {
        id: `bet-${Date.now()}`,
        oracleId, optionId, optionLabel, oracleTitle,
        amount,
        placedAt: new Date(),
        status: "pending",
      },
      ...prev,
    ]);
  }, []);

  const adjustPoints = useCallback((delta: number) => {
    setMe((prev) => {
      const newPoints = Math.max(0, prev.points + delta);
      const newGrade = getGradeByPoints(newPoints);
      const didUpgrade = newGrade.rank > getGradeByPoints(prev.points).rank;
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
      }
      return { ...prev, points: newPoints, gradeId: newGrade.id };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return (
    <OracleContext.Provider value={{ oracles, addOracle, updateOracle, closeOracle }}>
      <UserContext.Provider value={{ me, myBets, notifications, placeBet, markNotificationRead, markAllRead, adjustPoints }}>
        {children}
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
