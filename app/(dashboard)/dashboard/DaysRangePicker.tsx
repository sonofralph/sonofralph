"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export function DaysRangePicker({ activeDays }: { activeDays: number }) {
  const router = useRouter();

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => router.push(`/dashboard?days=${opt.value}`)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            activeDays === opt.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
