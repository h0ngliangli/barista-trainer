"use client";

interface Props {
  correct: number;
  total: number;
}

export default function StatsBar({ correct, total }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) + "%" : "—";
  return (
    <div className="flex gap-3 mb-5">
      {[
        { label: "Correct", value: correct },
        { label: "Total", value: total },
        { label: "Accuracy", value: pct },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="flex-1 bg-white border border-neutral-200 rounded-xl p-3 text-center"
        >
          <div className="text-2xl font-semibold text-neutral-900">{value}</div>
          <div className="text-xs text-neutral-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
