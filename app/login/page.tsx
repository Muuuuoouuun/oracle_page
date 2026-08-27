"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth, useAuthActions } from "@/lib/supabase/auth";
import clsx from "clsx";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { enabled, loading, user } = useAuth();
  const { signIn, signUp } = useAuthActions();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, name);

    setBusy(false);
    if (!result.ok) {
      setError(result.message ?? "요청을 처리하지 못했습니다.");
      return;
    }
    if (result.message) {
      setNotice(result.message);
      return;
    }
    router.push("/");
  };

  /* Supabase 를 안 쓰는 환경에서는 로그인 자체가 없다 */
  if (!enabled) {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <div className="text-4xl">🔮</div>
          <h1 className="text-xl font-black text-white">로그인 없이 사용 중입니다</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            이 환경에는 Supabase 가 연결되어 있지 않아, 예언 기록이 이 브라우저에만 저장됩니다.
            <br />
            계정을 만들어 기기 간에 이어서 쓰려면 서버 설정이 필요합니다.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white text-sm font-bold"
          >
            그냥 시작하기
          </Link>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 text-slate-400 py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> 확인 중…
        </div>
      </Shell>
    );
  }

  if (user) {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <div className="text-4xl">✨</div>
          <p className="text-white font-bold">이미 로그인되어 있습니다</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white text-sm font-bold"
          >
            예언하러 가기
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl">🔮</div>
          <h1 className="text-2xl font-black gradient-text">Oracle Page</h1>
          <p className="text-sm text-slate-500">당신은 예언가입니까?</p>
        </div>

        {/* 모드 전환 */}
        <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl">
          {(
            [
              { key: "signin", label: "로그인" },
              { key: "signup", label: "회원가입" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setMode(t.key);
                setError(null);
                setNotice(null);
              }}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                mode === t.key ? "bg-oracle-purple text-white" : "text-slate-400 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <Field
              label="예언가 이름"
              value={name}
              onChange={setName}
              placeholder="커뮤니티에 표시될 이름"
              maxLength={20}
              required
            />
          )}
          <Field
            label="이메일"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Field
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="6자 이상"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            required
          />

          {error && (
            <p className="text-xs text-oracle-hot flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          {notice && (
            <p className="text-xs text-emerald-400 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "로그인" : "가입하고 시작하기"}
          </button>
        </form>

        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> 둘러보기
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-oracle-card border border-oracle-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-oracle-purple transition-colors"
      />
    </label>
  );
}
