"use client";

export type FeedbackLevel = "correct" | "partial" | "wrong" | "revealed";

interface Props {
  level: FeedbackLevel;
  message: string;
}

const STYLES: Record<FeedbackLevel, string> = {
  correct: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  partial: "bg-amber-50 text-amber-800 border border-amber-200",
  wrong: "bg-red-50 text-red-800 border border-red-200",
  revealed: "bg-red-50 text-red-800 border border-red-200",
};

export default function FeedbackPanel({ level, message }: Props) {
  return (
    <div className={`rounded-lg px-4 py-3 mt-4 text-sm leading-relaxed ${STYLES[level]}`}>
      {message}
    </div>
  );
}
