import React from "react";
import type { BloodMarker } from "../types";

interface SummaryBannerProps {
  markers: BloodMarker[];
}

export const SummaryBanner: React.FC<SummaryBannerProps> = ({ markers }) => {
  const total = markers.length;
  const normal = markers.filter((m) => m.status === "normal").length;
  const borderline = markers.filter((m) => m.status === "borderline").length;
  const abnormal = markers.filter((m) => m.status === "abnormal").length;
  const score = Math.round(((normal + borderline * 0.5) / total) * 100);

  const scoreColor =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-elevated border border-default">
      {/* Score ring */}
      <div
        className="shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center border-4"
        style={{ borderColor: scoreColor }}
      >
        <span className="text-lg font-bold text-default leading-none">{score}</span>
        <span className="text-xs text-secondary">score</span>
      </div>

      {/* Stats */}
      <div className="flex-1 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {normal}
          </div>
          <div className="text-xs text-secondary">Normal</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {borderline}
          </div>
          <div className="text-xs text-secondary">Borderline</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {abnormal}
          </div>
          <div className="text-xs text-secondary">Abnormal</div>
        </div>
      </div>

      {/* Total */}
      <div className="shrink-0 text-right">
        <div className="text-2xl font-bold text-default">{total}</div>
        <div className="text-xs text-secondary">total</div>
      </div>
    </div>
  );
};
