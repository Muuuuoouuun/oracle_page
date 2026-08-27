"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * 클라이언트에는 Database 제네릭을 붙이지 않는다.
 *
 * 손으로 쓴 스키마 타입은 실제 DB 와 어긋나도 아무도 알려주지 않는 허상이라,
 * 대신 lib/supabase/types.ts 의 Row 인터페이스로 매핑 지점에서만 모양을 고정한다.
 * 프로젝트를 만든 뒤 `npm run types:supabase` 로 진짜 타입을 생성해 붙이면 된다.
 */
export type OracleSupabase = SupabaseClient;

let cached: OracleSupabase | null = null;

/**
 * 브라우저용 Supabase 클라이언트.
 * 설정이 없으면 null 을 돌려주고, 호출부는 localStorage 모드로 넘어간다.
 */
export function getSupabaseBrowser(): OracleSupabase | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
