/**
 * Supabase 설정 여부 판별.
 *
 * 환경변수가 없으면 앱은 기존처럼 localStorage 모드로 돈다. 계정 없이도
 * 바로 실행해볼 수 있고, 설정을 넣는 순간 서버 모드로 넘어간다.
 * (셋업 절차는 README 참고)
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 두 값이 모두 있어야 서버 모드로 동작한다. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
