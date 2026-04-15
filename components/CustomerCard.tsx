"use client";

import { CustomerProfile } from "@/lib/gemini";

interface DiffWord {
  word: string;
  missed: boolean;
}

interface Props {
  customer: CustomerProfile | null;
  diffWords: DiffWord[] | null;
  revealed: boolean;
}

const AVATAR_COLORS: [string, string][] = [
  ["#fbeaf0", "#993556"],
  ["#e6f1fb", "#185fa5"],
  ["#eaf3de", "#3b6d11"],
  ["#faeeda", "#854f0b"],
  ["#e1f5ee", "#0f6e56"],
  ["#eeedfe", "#533ab7"],
  ["#fcebeb", "#a32d2d"],
];

function colorFor(name: string): [string, string] {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function CustomerCard({ customer, diffWords, revealed }: Props) {
  const [bg, fg] = customer ? colorFor(customer.name) : ["#e6f4ee", "#00704a"];
  const initials = customer ? customer.name[0].toUpperCase() : "?";

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: bg, color: fg }}
        >
          {initials}
        </div>
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {customer
              ? `${customer.name} (${customer.age}, ${customer.region})`
              : "Press \u201cNew Customer\u201d to start"}
          </div>
          <div className="text-xs text-neutral-400 mt-0.5">
            {customer ? `${customer.gender} customer` : "A new customer will walk up to the counter"}
          </div>
        </div>
      </div>

      {customer && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {customer.personality.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 min-h-11 flex flex-wrap items-center gap-1 text-sm leading-relaxed">
        {!revealed && (
          <span className="text-neutral-400 italic">
            Order will appear here after you answer
          </span>
        )}
        {revealed && diffWords && diffWords.map((dw, i) => (
          <span
            key={i}
            className={
              dw.missed
                ? "bg-amber-100 text-amber-800 rounded px-0.5"
                : "text-neutral-800"
            }
          >
            {dw.word}
          </span>
        ))}
      </div>
    </div>
  );
}
