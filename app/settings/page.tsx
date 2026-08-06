"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, RotateCcw, Settings } from "lucide-react";
import { useUser } from "@/lib/context";
import GradeBadge from "@/components/GradeBadge";
import clsx from "clsx";

const AVATAR_OPTIONS = [
  "🌟", "🔮", "⚡", "🎯", "🌙", "🌸",
  "💎", "🔥", "🌊", "🦋", "🎲", "🏆",
  "🦊", "🐉", "🌈", "🎭", "🦅", "💫",
  "🌺", "🎪", "🧿", "🎋", "🌌", "🦄",
];

export default function SettingsPage() {
  const { me, updateUser, showToast } = useUser();
  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState(me.avatar);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    updateUser("me", { name: trimmed || me.name, avatar });
    setSaved(true);
    showToast("설정 저장 완료!", "✅", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetData = () => {
    if (!confirm("정말로 모든 데이터를 초기화하시겠어요? 되돌릴 수 없습니다.")) return;
    localStorage.removeItem("oracle_app_state");
    localStorage.removeItem("oracle_onboarded");
    localStorage.removeItem("oracle_daily_bonus");
    window.location.reload();
  };

  const isDirty = name !== me.name || avatar !== me.avatar;

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-oracle-dark/85 backdrop-blur-xl border-b border-oracle-border/60 px-4 py-3 flex items-center gap-3">
        <Link
          href="/profile/me"
          className="w-8 h-8 rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Settings className="w-4 h-4 text-oracle-purple" />
          <h1 className="text-sm font-bold text-white">설정</h1>
        </div>
        {isDirty && (
          <button
            onClick={handleSave}
            className="text-xs text-oracle-purple hover:text-oracle-glow font-semibold transition-colors"
          >
            저장
          </button>
        )}
      </div>

      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Profile settings */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">프로필 설정</h2>

          {/* Preview */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-12 h-12 rounded-2xl bg-oracle-dark border border-oracle-border flex items-center justify-center text-2xl">
              {avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{name.trim() || me.name}</p>
              <GradeBadge gradeId={me.gradeId} size="xs" isOverride={me.gradeOverride} />
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">닉네임</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder={me.name}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-oracle-purple transition-colors placeholder:text-slate-600"
            />
            <p className="text-xs text-slate-600 text-right">{name.length}/12</p>
          </div>

          {/* Avatar picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">아바타 이모지</label>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_OPTIONS.map((em) => (
                <button
                  key={em}
                  onClick={() => setAvatar(em)}
                  className={clsx(
                    "aspect-square rounded-xl border text-xl flex items-center justify-center transition-all",
                    avatar === em
                      ? "bg-oracle-purple/20 border-oracle-purple scale-110 shadow-glow-sm"
                      : "bg-slate-800/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-700/60"
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className={clsx(
              "w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              saved
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : isDirty
                ? "bg-gradient-to-r from-oracle-purple to-oracle-glow text-white hover:opacity-90"
                : "bg-slate-800 border border-slate-700 text-slate-500 cursor-default"
            )}
            disabled={!isDirty && !saved}
          >
            <Save className="w-4 h-4" />
            {saved ? "저장됨 ✓" : "저장하기"}
          </button>
        </div>

        {/* Stats summary */}
        <div className="rounded-2xl border border-oracle-border bg-oracle-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">나의 통계</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "보유 포인트", value: `${me.points.toLocaleString()}P`, color: "text-oracle-glow" },
              { label: "적중률", value: me.accuracy > 0 ? `${me.accuracy}%` : "—", color: "text-oracle-trending" },
              { label: "총 예언 수", value: `${me.totalBets}건`, color: "text-blue-400" },
              { label: "적중 수", value: `${me.wonBets}건`, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                <p className={clsx("text-lg font-black", s.color)}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> 위험 영역
          </h2>
          <p className="text-xs text-slate-500">
            모든 데이터(포인트, 예언 기록, 설정)가 초기화됩니다. 되돌릴 수 없어요!
          </p>
          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 데이터 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
