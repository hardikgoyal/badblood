import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RelevantMarker } from "../types";

interface SpiderChartProps {
  markers: RelevantMarker[];
}

const scoreColor = (score: number) =>
  score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

export const SpiderChart: React.FC<SpiderChartProps> = ({ markers }) => {
  const data = markers.map((m) => ({
    subject: m.name.length > 13 ? m.name.slice(0, 12) + "…" : m.name,
    fullName: m.name,
    score: m.score,
    fullMark: 100,
  }));

  const avg = Math.round(
    markers.reduce((sum, m) => sum + m.score, 0) / markers.length
  );
  const avgColor = scoreColor(avg);

  return (
    <div className="space-y-3">
      {/* Average score chip */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">
          Biomarker Health Scores
        </span>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            color: avgColor,
            backgroundColor: avgColor + "1a",
          }}
        >
          Avg {avg}/100
        </span>
      </div>

      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 10, right: 35, bottom: 10, left: 35 }}>
          <PolarGrid stroke="#6b728040" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "#9ca3af" }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={avgColor}
            fill={avgColor}
            fillOpacity={0.2}
            strokeWidth={2.5}
            dot={{ r: 4, fill: avgColor, strokeWidth: 0 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const subject = payload[0]?.payload?.subject as string;
              const marker = markers.find(
                (m) =>
                  m.name === payload[0]?.payload?.fullName ||
                  m.name.slice(0, 12) + "…" === subject ||
                  m.name === subject
              );
              if (!marker) return null;
              const c = scoreColor(marker.score);
              return (
                <div
                  style={{
                    background: "var(--color-surface-elevated, #fff)",
                    border: "1px solid var(--color-border-default, #e5e7eb)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                    maxWidth: 200,
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--color-text-default, #111)",
                      marginBottom: 4,
                    }}
                  >
                    {marker.name}
                  </p>
                  <p style={{ color: "var(--color-text-secondary, #6b7280)" }}>
                    Value: {marker.value}
                  </p>
                  <p style={{ color: "var(--color-text-secondary, #6b7280)" }}>
                    Ref: {marker.referenceRange}
                  </p>
                  <p style={{ color: c, fontWeight: 600, marginTop: 2 }}>
                    Score: {marker.score}/100
                  </p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Optimal (75–100)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Borderline (50–74)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Abnormal (0–49)
        </span>
      </div>
    </div>
  );
};
