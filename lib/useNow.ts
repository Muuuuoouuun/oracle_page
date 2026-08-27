"use client";

import { useSyncExternalStore } from "react";

/**
 * 현재 시각을 주기적으로 갱신해 돌려준다.
 *
 * 서버와 클라이언트의 `Date.now()` 가 다르기 때문에 "3시간 남음" 같은 시간 의존
 * 텍스트를 렌더 중에 계산하면 하이드레이션 미스매치가 난다. 서버 스냅샷을 항상
 * null 로 두어, 그런 표시는 마운트 이후에만 그려지도록 강제한다.
 *
 * 모든 구독자가 타이머 하나를 공유하고, 각자 원하는 정밀도로 값을 내림한다.
 * 내림한 값이 그대로면 React 가 리렌더를 건너뛰므로, 1초 타이머 하나로
 * 초 단위 카운트다운과 분 단위 표시를 함께 굴릴 수 있다.
 */

const TICK_MS = 1000;

const listeners = new Set<() => void>();
let currentMs = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (timer === null) {
    currentMs = Date.now();
    timer = setInterval(() => {
      currentMs = Date.now();
      listeners.forEach((fn) => fn());
    }, TICK_MS);
  }
  // 첫 구독자에게는 즉시 실제 시각을 알려야 "—" 가 오래 남지 않는다.
  onChange();

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** 서버에서는 시간을 모른다고 답한다. */
const serverSnapshot = () => null;

/**
 * @param granularityMs 이 단위로 내림한 시각을 돌려준다.
 *   값이 바뀔 때만 리렌더되므로, 큰 값을 줄수록 리렌더가 줄어든다.
 */
export function useNow(granularityMs = 10_000): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(currentMs / granularityMs) * granularityMs,
    serverSnapshot
  );
}
