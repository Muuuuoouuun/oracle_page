"use client";

import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { useUI } from "@/lib/context";

/**
 * 마지막으로 실패한 동작의 이유를 보여준다.
 *
 * 로컬 모드에서는 "포인트가 부족합니다" 같은 앱 규칙이, 서버 모드에서는
 * Postgres 함수가 던진 메시지가 그대로 올라온다. 눌러도 아무 일 없는
 * 화면이 되지 않도록, 거절당한 이유는 반드시 보이게 한다.
 */
export default function ErrorToast() {
  const { error, dismissError } = useUI();

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(dismissError, 5000);
    return () => clearTimeout(timer);
  }, [error, dismissError]);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(28rem,calc(100vw-2rem))] ticker-in"
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-oracle-hot/50 bg-oracle-hot/15 backdrop-blur-md px-4 py-3 shadow-lg shadow-black/40">
        <AlertCircle className="w-4 h-4 text-oracle-hot shrink-0 mt-0.5" />
        <p className="text-sm text-white flex-1 leading-snug">{error}</p>
        <button
          onClick={dismissError}
          aria-label="알림 닫기"
          className="text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
