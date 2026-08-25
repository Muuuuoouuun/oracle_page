/**
 * localStorage 기반 영속성 헬퍼.
 *
 * 백엔드가 없으므로 앱 상태를 브라우저에 저장한다. 저장 대상에 Date 가 섞여 있어서
 * JSON.stringify/parse 만으로는 문자열이 되어 돌아오기 때문에, ISO 문자열을 감지해
 * Date 로 되살리는 reviver 를 함께 쓴다.
 */

const PREFIX = "oracle-page:";

/** 2026-08-25T12:34:56.789Z 형태만 Date 로 되살린다. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function reviveDates(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return value;
}

/**
 * 저장된 값을 읽는다. 서버(SSR)에서는 항상 null 을 돌려주므로,
 * 호출부는 마운트 이후(useEffect)에만 사용해야 하이드레이션 미스매치가 없다.
 */
export function loadState<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw, reviveDates) as T;
  } catch {
    // 손상된 값 / 접근 차단(프라이빗 모드 등) — 기본값으로 진행
    return null;
  }
}

/** 값을 저장한다. 실패해도 앱이 죽지 않도록 조용히 무시한다. */
export function saveState(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 용량 초과 / 접근 차단 — 무시
  }
}

/** 저장된 앱 상태를 전부 지운다. */
export function clearState(keys: readonly string[]): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of keys) window.localStorage.removeItem(PREFIX + key);
  } catch {
    // 무시
  }
}

export const STORAGE_KEYS = {
  oracles: "oracles",
  users: "users",
  myBets: "myBets",
  notifications: "notifications",
  comments: "comments",
  following: "following",
  gradeThresholds: "gradeThresholds",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
