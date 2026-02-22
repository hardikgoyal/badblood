import React from "react";
import type { ResultAnalysis } from "../types";

interface ResultGaugeProps {
  result: ResultAnalysis;
}

const STATUS_COLORS = {
  normal:     "#16a34a",
  borderline: "#d97706",
  abnormal:   "#dc2626",
} as const;

const SEVERITY_CONFIG = {
  optimal:     { color: "#15803d", bg: "#dcfce7", label: "Optimal" },
  mild:        { color: "#92400e", bg: "#fef3c7", label: "Mild" },
  moderate:    { color: "#c2410c", bg: "#ffedd5", label: "Moderate" },
  significant: { color: "#991b1b", bg: "#fee2e2", label: "Significant" },
} as const;

export const ResultGauge: React.FC<ResultGaugeProps> = ({ result }) => {
  const { score, status, value, unit, referenceRangeText, severity } = result;
  const statusColor = STATUS_COLORS[status];
  const sevCfg = SEVERITY_CONFIG[severity];

  // SVG layout constants
  const W = 300;
  const trackY = 30;
  const trackH = 14;
  const trackRx = 7;

  // Clamp needle so it stays inside the track
  const pct = Math.max(1, Math.min(99, score));
  const needleX = (pct / 100) * W;

  // Score label: keep it from clipping edges
  const labelAnchor =
    pct < 15 ? "start" : pct > 85 ? "end" : "middle";
  const labelX =
    pct < 15 ? 2 : pct > 85 ? W - 2 : needleX;

  // Needle triangle pointing down into the track
  const nw = 8;
  const nh = 9;
  const needlePoints = [
    `${needleX},${trackY}`,
    `${needleX - nw / 2},${trackY - nh}`,
    `${needleX + nw / 2},${trackY - nh}`,
  ].join(" ");

  return (
    <div>
      {/* SVG gauge */}
      <svg
        viewBox={`0 0 ${W} 58`}
        style={{ width: "100%", display: "block", overflow: "visible" }}
        aria-label={`Health score: ${score} out of 100`}
      >
        <defs>
          <linearGradient id="bb-gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#ef4444" />
            <stop offset="25%"  stopColor="#f59e0b" />
            <stop offset="45%"  stopColor="#22c55e" />
            <stop offset="70%"  stopColor="#22c55e" />
            <stop offset="85%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Score label above needle */}
        <text
          x={labelX}
          y={14}
          textAnchor={labelAnchor}
          fontSize={15}
          fontWeight={700}
          fill={statusColor}
        >
          {score}/100
        </text>

        {/* Needle triangle */}
        <polygon points={needlePoints} fill={statusColor} />

        {/* Gradient track */}
        <rect
          x={0}
          y={trackY}
          width={W}
          height={trackH}
          rx={trackRx}
          fill="url(#bb-gauge-grad)"
        />

        {/* Tick labels */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <text
            key={tick}
            x={(tick / 100) * W}
            y={trackY + trackH + 13}
            textAnchor={tick === 0 ? "start" : tick === 100 ? "end" : "middle"}
            fontSize={9}
            fill="#9ca3af"
          >
            {tick}
          </text>
        ))}

      </svg>

      {/* Value + range + badges row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
          fontSize: 12,
          color: "var(--color-text-secondary, #6b7280)",
        }}
      >
        <span>
          Your value:{" "}
          <strong style={{ color: "var(--color-text-default, #111)" }}>
            {value} {unit}
          </strong>
        </span>
        <span>
          Ref:{" "}
          <span style={{ color: "var(--color-text-default, #111)" }}>{referenceRangeText}</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {/* Status badge */}
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            background: statusColor + "1a",
          }}
        >
          ● {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {/* Severity badge */}
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: sevCfg.color,
            background: sevCfg.bg,
          }}
        >
          {sevCfg.label}
        </span>
      </div>
    </div>
  );
};
