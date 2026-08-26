"use client";

import { useEffect, useState } from "react";

/**
 * 현재 시각을 주기적으로 갱신해 돌려준다.
 *
 * SSR 과 첫 렌더에서는 null 이다. 서버와 클라이언트의 `Date.now()` 가 다르기 때문에
 * "3시간 남음" 같은 시간 의존 텍스트를 렌더 중에 계산하면 하이드레이션 미스매치가 난다.
 * 시간에 기대는 표시는 반드시 이 훅을 거쳐, 마운트 이후에만 그린다.
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
