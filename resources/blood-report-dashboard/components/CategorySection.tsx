import React, { useState } from "react";
import type { BloodMarker } from "../types";
import { MarkerCard } from "./MarkerCard";

const CATEGORY_ICONS: Record<string, string> = {
  CBC: "🩸",
  Lipids: "💧",
  Thyroid: "🦋",
  Liver: "🫀",
  Kidney: "🫘",
  Vitamins: "✨",
  Metabolic: "⚡",
  Hormones: "🔬",
  Other: "📊",
};

interface CategorySectionProps {
  category: string;
  markers: BloodMarker[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  markers,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const abnormal = markers.filter((m) => m.status === "abnormal").length;
  const borderline = markers.filter((m) => m.status === "borderline").length;

  return (
    <div className="rounded-xl border border-default overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{CATEGORY_ICONS[category] ?? "📊"}</span>
          <span className="font-semibold text-sm text-default">{category}</span>
          <span className="text-xs text-secondary">({markers.length})</span>
          {abnormal > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {abnormal} abnormal
            </span>
          )}
          {borderline > 0 && abnormal === 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {borderline} borderline
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="p-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {markers.map((marker, i) => (
            <MarkerCard key={i} marker={marker} />
          ))}
        </div>
      )}
    </div>
  );
};
