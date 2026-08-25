"use client";

import { useState } from "react";
import { X, Plus, Trash2, Eye, Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import { Oracle, OracleCategory, BetOption } from "@/lib/types";
import { useGrades, useOracles, useUser } from "@/lib/context";
import { dailyOracleLimit } from "@/lib/grades";
import { recalcOptions } from "@/lib/betting";
import OracleCard from "./OracleCard";
import clsx from "clsx";

const CATEGORIES: OracleCategory[] = [
  "경제/주식", "스포츠", "정치", "엔터테인먼트", "기술/AI", "날씨/자연", "사회/문화",
];

interface Props { onClose: () => void }

export default function CreateOracleModal({ onClose }: Props) {
  const { addOracle, myOraclesToday } = useOracles();
  const { me } = useUser();
  const { grades } = useGrades();
  const grade = grades.find((g) => g.id === me.gradeId) ?? grades[0];

  // Grade-based daily limit (규칙은 lib/grades.ts 한 곳에서 관리)
  const maxPerDay = dailyOracleLimit(grade.rank);
  const canCreate = maxPerDay > 0; // 이상해씨(rank 2) 이상
  const remainingToday = maxPerDay === Infinity ? Infinity : maxPerDay - myOraclesToday;
  const reachedDailyLimit = remainingToday <= 0;

  const [step, setStep] = useState<"form" | "preview">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<OracleCategory>("경제/주식");
  const [options, setOptions] = useState([
    { id: "opt-a", label: "" },
    { id: "opt-b", label: "" },
  ]);
  const [daysUntilEnd, setDaysUntilEnd] = useState(7);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions([...options, { id: `opt-${Date.now()}`, label: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, label: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "제목을 입력해주세요";
    if (title.length > 80) e.title = "제목은 80자 이내로 입력해주세요";
    if (!description.trim()) e.description = "설명을 입력해주세요";
    options.forEach((o, i) => {
      if (!o.label.trim()) e[`opt-${i}`] = `옵션 ${i + 1}을 입력해주세요`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePreview = () => {
    if (validate()) setStep("preview");
  };

  const handleSubmit = () => {
    // 미리보기 화면에서도 다시 들어올 수 있으므로 한도를 한 번 더 확인한다.
    if (!canCreate || reachedDailyLimit) return;

    const betOptions: BetOption[] = recalcOptions(
      options.map((o) => ({ id: o.id, label: o.label, percentage: 0, totalBets: 0, odds: 1 }))
    );

    const newOracle: Oracle = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      status: "live",
      options: betOptions,
      totalParticipants: 0,
      totalPool: 0,
      endsAt: new Date(Date.now() + daysUntilEnd * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      isHot: false,
      isTrending: false,
      isNew: true,
      tags: [],
      commentCount: 0,
      creatorName: me.name,
      creatorAvatar: me.avatar,
    };

    addOracle(newOracle);
    onClose();
  };

  // Preview oracle object
  const previewOracle: Oracle = {
    id: "preview",
    title: title || "예언 제목",
    description: description || "예언 설명",
    category,
    status: "live",
    options: recalcOptions(
      options.map((o, i) => ({
        id: o.id,
        label: o.label || `옵션 ${i + 1}`,
        percentage: 0,
        totalBets: 0,
        odds: 1,
      }))
    ),
    totalParticipants: 0,
    totalPool: 0,
    endsAt: new Date(Date.now() + daysUntilEnd * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    isHot: false,
    isTrending: false,
    isNew: true,
    tags: [],
    commentCount: 0,
    creatorName: me.name,
    creatorAvatar: me.avatar,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-oracle-card border border-oracle-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-oracle-card/95 backdrop-blur-sm border-b border-oracle-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">새 예언 등록</h2>
            <p className="text-xs text-slate-500">
              {grade.emoji} {grade.name} 등급 ·{" "}
              {maxPerDay === Infinity
                ? "무제한 생성 가능"
                : `오늘 ${myOraclesToday}/${maxPerDay}개 사용`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button
                onClick={() => setStep("form")}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
              >
                편집으로
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grade lock */}
        {!canCreate ? (
          <div className="p-6 text-center space-y-3">
            <div className="text-4xl">🐟</div>
            <p className="text-white font-bold">잉어킹은 예언을 만들 수 없어요</p>
            <p className="text-sm text-slate-400">
              🌱 이상해씨 (1,000P) 이상 등급부터 예언 생성이 가능합니다.
            </p>
            <div className="rounded-xl bg-slate-800 p-3 text-xs text-slate-400">
              현재 포인트: <span className="font-bold text-white">{me.points.toLocaleString()}P</span>
              <br />
              필요 포인트:{" "}
              <span className="font-bold text-emerald-400">{Math.max(0, 1000 - me.points).toLocaleString()}P 더</span>
            </div>
          </div>
        ) : reachedDailyLimit ? (
          /* Daily limit reached */
          <div className="p-6 text-center space-y-3">
            <div className="text-4xl">⏳</div>
            <p className="text-white font-bold">오늘의 예언 생성 한도를 모두 사용했어요</p>
            <p className="text-sm text-slate-400">
              {grade.emoji} {grade.name} 등급은 하루에 {maxPerDay}개까지 생성할 수 있습니다.
              <br />
              내일 다시 도전하거나, 등급을 올려 한도를 늘려보세요!
            </p>
            <div className="rounded-xl bg-slate-800 p-3 text-xs text-slate-400">
              오늘 생성한 예언:{" "}
              <span className="font-bold text-white">{myOraclesToday}개</span>
            </div>
          </div>
        ) : step === "preview" ? (
          /* Preview */
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-500 text-center">미리보기 — 실제와 동일하게 표시됩니다</p>
            <OracleCard oracle={previewOracle} />
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              ✨ 예언 등록하기
            </button>
          </div>
        ) : (
          /* Form */
          <div className="p-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">예언 제목 *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex) 삼성전자 주가, 내년에도 오를까?"
                maxLength={80}
                className={clsx(
                  "w-full bg-slate-800 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors",
                  errors.title ? "border-oracle-hot" : "border-slate-700 focus:border-oracle-purple"
                )}
              />
              <div className="flex items-center justify-between">
                {errors.title && <p className="text-xs text-oracle-hot">{errors.title}</p>}
                <p className="text-xs text-slate-600 ml-auto">{title.length}/80</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">설명 *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예언의 배경과 맥락을 설명해주세요..."
                rows={3}
                className={clsx(
                  "w-full bg-slate-800 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-colors",
                  errors.description ? "border-oracle-hot" : "border-slate-700 focus:border-oracle-purple"
                )}
              />
              {errors.description && <p className="text-xs text-oracle-hot">{errors.description}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">카테고리</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OracleCategory)}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-oracle-purple"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">예언 선택지 (2~4개) *</label>
                {options.length < 4 && (
                  <button onClick={addOption} className="flex items-center gap-1 text-xs text-oracle-purple hover:text-oracle-glow">
                    <Plus className="w-3 h-3" /> 선택지 추가
                  </button>
                )}
              </div>
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                  <input
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    placeholder={`선택지 ${i + 1} (예: 상승 📈)`}
                    className={clsx(
                      "flex-1 bg-slate-800 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-colors",
                      errors[`opt-${i}`] ? "border-oracle-hot" : "border-slate-700 focus:border-oracle-purple"
                    )}
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(opt.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-oracle-hot">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {Object.entries(errors).filter(([k]) => k.startsWith("opt-")).map(([k, v]) => (
                <p key={k} className="text-xs text-oracle-hot">{v}</p>
              ))}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">마감 기간</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysUntilEnd(d)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      daysUntilEnd === d
                        ? "bg-oracle-purple border-oracle-purple text-white"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-oracle-purple/50"
                    )}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePreview}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-oracle-purple text-oracle-purple font-bold text-sm hover:bg-oracle-purple/10 transition-colors"
              >
                <Eye className="w-4 h-4" /> 미리보기
              </button>
              <button
                onClick={() => { if (validate()) handleSubmit(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-oracle-purple to-oracle-glow text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" /> 등록
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
