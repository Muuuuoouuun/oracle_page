"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./client";
import { isSupabaseConfigured } from "./env";

export interface AuthState {
  /** Supabase 설정이 있는지 — 없으면 앱은 localStorage 모드다 */
  enabled: boolean;
  /** 세션을 아직 확인하는 중인지 */
  loading: boolean;
  user: User | null;
  session: Session | null;
}

/**
 * 로그인 상태.
 * Supabase 설정이 없으면 enabled=false 로 즉시 확정되고, 앱은 로그인 없이 돈다.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    enabled: isSupabaseConfigured,
    loading: isSupabaseConfigured,
    user: null,
    session: null,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState({
        enabled: true,
        loading: false,
        user: data.session?.user ?? null,
        session: data.session,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ enabled: true, loading: false, user: session?.user ?? null, session });
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
}

/** Supabase 가 돌려주는 영어 메시지를 사람이 읽을 문장으로 바꾼다. */
function toKorean(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed")) return "이메일 인증을 먼저 완료해주세요.";
  if (m.includes("user already registered")) return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (m.includes("password should be at least")) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("unable to validate email")) return "이메일 형식이 올바르지 않습니다.";
  if (m.includes("rate limit") || m.includes("too many")) {
    return "시도가 너무 잦습니다. 잠시 후 다시 해주세요.";
  }
  return message;
}

export function useAuthActions() {
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { ok: false, message: "Supabase 가 설정되지 않았습니다." };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, message: toKorean(error.message) } : { ok: true };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      const supabase = getSupabaseBrowser();
      if (!supabase) return { ok: false, message: "Supabase 가 설정되지 않았습니다." };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // 프로필은 auth.users 트리거가 이 메타데이터로 만든다
        options: { data: { name: name.trim() } },
      });
      if (error) return { ok: false, message: toKorean(error.message) };

      // 이메일 인증이 켜져 있으면 세션이 바로 생기지 않는다
      if (!data.session) {
        return { ok: true, message: "가입 확인 메일을 보냈습니다. 메일함을 확인해주세요." };
      }
      return { ok: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    await getSupabaseBrowser()?.auth.signOut();
  }, []);

  return { signIn, signUp, signOut };
}
