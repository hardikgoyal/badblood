import React, { useState } from "react";
import type { BloodMarker } from "../types";
import { GaugeBar } from "./GaugeBar";

const statusConfig = {
  normal: {
    border: "border-green-200 dark:border-green-900",
    bg: "bg-green-50 dark:bg-green-950/20",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    dot: "bg-green-500",
    label: "Normal",
  },
  borderline: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Borderline",
  },
  abnormal: {
    border: "border-red-200 dark:border-red-900",
    bg: "bg-red-50 dark:bg-red-950/20",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
    label: "Abnormal",
  },
};

interface MarkerCardProps {
  marker: BloodMarker;
}

export const MarkerCard: React.FC<MarkerCardProps> = ({ marker }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[marker.status];
  const hasGauge =
    marker.referenceRangeLow !== null && marker.referenceRangeHigh !== null;

  return (
    <div
      className={`rounded-xl p-3 border ${cfg.border} ${cfg.bg} transition-all duration-200 ${
        hasGauge ? "cursor-pointer select-none" : ""
      }`}
      onClick={() => hasGauge && setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-default truncate">{marker.name}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-default">{marker.value}</span>
            <span className="text-xs text-secondary">{marker.unit}</span>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Ref: {marker.referenceRangeText}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {hasGauge && (
            <span className="text-secondary" style={{ fontSize: 9 }}>
              {expanded ? "▲ hide" : "▼ gauge"}
            </span>
          )}
        </div>
      </div>

      {expanded && <GaugeBar marker={marker} />}
    </div>
  );
};
