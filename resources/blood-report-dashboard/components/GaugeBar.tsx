import React from "react";
import type { BloodMarker } from "../types";

interface GaugeBarProps {
  marker: BloodMarker;
}

export const GaugeBar: React.FC<GaugeBarProps> = ({ marker }) => {
  const { value, referenceRangeLow: refLow, referenceRangeHigh: refHigh, unit } = marker;

  if (refLow === null || refHigh === null) return null;

  // Scale: extend 50% of the normal range width on each side so the gauge
  // shows "danger zones" on both ends and the optimal range sits in the middle.
  const rangeWidth = refHigh - refLow;
  const scaleMin   = refLow  - rangeWidth * 0.5;
  const scaleMax   = refHigh + rangeWidth * 0.5;

  // Needle position as a percentage of the bar width, clamped to stay visible
  const pct = Math.max(2, Math.min(98, ((value - scaleMin) / (scaleMax - scaleMin)) * 100));

  // Shift the floating label toward the center when near the edges
  const labelStyle: React.CSSProperties =
    pct < 15 ? { left: 0 } :
    pct > 85 ? { right: 0 } :
               { left: `${pct}%`, transform: "translateX(-50%)" };

  return (
    <div style={{ paddingTop: 14 }}>

      {/* Floating value label above the needle */}
      <div style={{ position: "relative", height: 24, marginBottom: 6 }}>
        <div
          style={{
            position: "absolute",
            ...labelStyle,
            background: "#111827",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 5,
            whiteSpace: "nowrap",
            lineHeight: 1.6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          }}
        >
          {value} {unit}
        </div>
        {/* Connector line from label to needle */}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            bottom: 0,
            transform: "translateX(-50%)",
            width: 1.5,
            height: 6,
            background: "#374151",
          }}
        />
      </div>

      {/* Gradient bar */}
      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 6,
          // Red → amber → green (optimal) → amber → red
          background:
            "linear-gradient(to right, #b91c1c 0%, #f59e0b 22%, #22c55e 50%, #f59e0b 78%, #b91c1c 100%)",
        }}
      >
        {/* Normal range left boundary — always at 25% */}
        <div
          style={{
            position: "absolute",
            left: "25%",
            top: -3,
            bottom: -3,
            width: 2,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 1,
          }}
        />
        {/* Normal range right boundary — always at 75% */}
        <div
          style={{
            position: "absolute",
            left: "75%",
            top: -3,
            bottom: -3,
            width: 2,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 1,
          }}
        />

        {/* Needle */}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            border: "2.5px solid #111827",
            boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
            zIndex: 2,
          }}
        />
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: 8,
          fontSize: 10,
        }}
      >
        <span style={{ color: "#b91c1c", fontWeight: 600 }}>
          &lt;{refLow}
        </span>
        <span style={{ color: "#15803d", fontWeight: 700, textAlign: "center" }}>
          {refLow}–{refHigh}
          {unit ? ` ${unit}` : ""}
        </span>
        <span style={{ color: "#b91c1c", fontWeight: 600 }}>
          &gt;{refHigh}
        </span>
      </div>
    </div>
  );
};
