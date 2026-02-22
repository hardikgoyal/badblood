import React, { useRef, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { RelevantMarker } from "../types";

interface SpiderChartProps {
  markers: RelevantMarker[];
  problem: string;
  onMarkerClick?: (marker: RelevantMarker) => void;
}

interface TooltipState {
  marker: RelevantMarker;
  x: number;
  y: number;
}

const floorTo = (n: number, step: number) => Math.floor(n / step) * step;
const ceilTo  = (n: number, step: number) => Math.ceil(n / step)  * step;

const STATUS_COLORS = {
  normal:    "#15803d",  // green-700
  borderline: "#b45309", // amber-700
  abnormal:  "#b91c1c",  // red-700
} as const;

function getConcern(abnormal: number, borderline: number) {
  if (abnormal >= 2)                     return { label: "High concern",      color: "#b91c1c", icon: "⚠️" };
  if (abnormal === 1 || borderline >= 2) return { label: "Moderate concern",  color: "#b45309", icon: "⚡" };
  if (borderline === 1)                  return { label: "Worth monitoring",  color: "#4d7c0f", icon: "👁" };
  return                                        { label: "Markers look okay", color: "#15803d", icon: "✓" };
}

/** Split a string into lines of at most maxChars characters, breaking on spaces */
function wrapText(text: string, maxChars = 11): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const SpiderChart: React.FC<SpiderChartProps> = ({ markers, problem, onMarkerClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedMarkerName, setSelectedMarkerName] = useState<string | null>(null);

  // Custom dot renderer — transparent hit area ensures clicks register in Recharts SVG
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined) return null;
    const marker = markers.find((m) => m.name === payload.subject);
    const isSelected = selectedMarkerName === payload.subject;
    const color = marker ? STATUS_COLORS[marker.status] : "#6366f1";

    return (
      <g
        key={`dot-${payload.subject}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!marker || !onMarkerClick) return;
          setSelectedMarkerName((prev) => (prev === marker.name ? null : marker.name));
          onMarkerClick(marker);
        }}
        style={{ cursor: onMarkerClick ? "pointer" : "default" }}
      >
        {/* Wide transparent hit area so clicks register reliably */}
        <circle cx={cx} cy={cy} r={14} fill="transparent" pointerEvents="all" />
        {/* Visible dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 7 : 4}
          fill={isSelected ? color : "#6366f1"}
          stroke={isSelected ? color : "none"}
          strokeWidth={isSelected ? 2 : 0}
          opacity={selectedMarkerName && !isSelected ? 0.3 : 1}
          pointerEvents="none"
        />
      </g>
    );
  };

  // Fallback: Radar-level click (Recharts passes payload.subject, not subject directly)
  const handleRadarClick = (data: any) => {
    if (!onMarkerClick) return;
    const subject = data?.payload?.subject ?? data?.subject;
    if (!subject) return;
    const marker = markers.find((m) => m.name === subject);
    if (!marker) return;
    setSelectedMarkerName((prev) => (prev === marker.name ? null : marker.name));
    onMarkerClick(marker);
  };

  const scores = markers.map((m) => m.score);
  const rawMin = Math.min(...scores);
  const rawMax = Math.max(...scores);
  const pad = Math.max(8, Math.round((rawMax - rawMin) * 0.12));
  const domainMin = Math.max(0,   floorTo(rawMin - pad, 10));
  const domainMax = Math.min(100, ceilTo(rawMax  + pad, 10));

  const abnormalCount   = markers.filter((m) => m.status === "abnormal").length;
  const borderlineCount = markers.filter((m) => m.status === "borderline").length;
  const normalCount     = markers.filter((m) => m.status === "normal").length;
  const concern = getConcern(abnormalCount, borderlineCount);

  const data = markers.map((m) => ({
    subject:  m.name,
    score:    m.score,
    fullMark: domainMax,
  }));

  // Custom axis tick — full name with word-wrap, hover triggers tooltip, click drills in
  const renderAxisTick = (props: any) => {
    const { x, y, payload, textAnchor } = props;
    const marker = markers.find((m) => m.name === payload.value);
    const statusColor = marker ? STATUS_COLORS[marker.status] : "#6b7280";
    const lines = wrapText(payload.value, 11);
    const lineHeight = 13;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    // Build a transparent hit-rect around the full label area.
    // SVG <text> only fires events on the painted glyph pixels, not whitespace —
    // a transparent <rect> with pointerEvents="all" gives a reliable click zone.
    const approxCharW = 6.5;
    const maxLineLen = Math.max(...lines.map((l) => l.length));
    const rectW = Math.max(52, maxLineLen * approxCharW);
    const rectH = lines.length * lineHeight + 10;
    const rectX =
      textAnchor === "end"    ? x - rectW      :
      textAnchor === "middle" ? x - rectW / 2  :
                                x; // "start"
    const rectY = startY - 6;

    const handleClick = () => {
      if (!marker || !onMarkerClick) return;
      setSelectedMarkerName((prev) => (prev === marker.name ? null : marker.name));
      onMarkerClick(marker);
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
      if (!marker) return;
      const bbox = containerRef.current?.getBoundingClientRect();
      if (!bbox) return;
      setTooltip({ marker, x: e.clientX - bbox.left, y: e.clientY - bbox.top });
    };

    return (
      <g
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        style={{ cursor: onMarkerClick && marker ? "pointer" : "default" }}
      >
        {/* Transparent full-area hit target */}
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="transparent"
          stroke="none"
          pointerEvents="all"
        />
        <text
          x={x}
          textAnchor={textAnchor}
          fill={statusColor}
          fontSize={11}
          fontWeight={marker?.status !== "normal" ? 600 : 400}
          style={{ userSelect: "none", pointerEvents: "none" }}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={x} y={startY + i * lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  // Flip tooltip to left side if it would overflow the right edge
  const TOOLTIP_W = 240;
  const TOOLTIP_OFFSET = 12;
  const containerW = containerRef.current?.offsetWidth ?? 500;
  const tooltipLeft = tooltip
    ? tooltip.x + TOOLTIP_OFFSET + TOOLTIP_W > containerW
      ? tooltip.x - TOOLTIP_W - TOOLTIP_OFFSET
      : tooltip.x + TOOLTIP_OFFSET
    : 0;

  return (
    <div className="space-y-3">
      {/* Concern level header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">Relevant biomarkers</span>
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ color: concern.color, backgroundColor: concern.color + "1a" }}
        >
          {concern.icon} {concern.label}
        </span>
      </div>

      {/* Chart wrapper — relative so tooltip is positioned inside it */}
      <div ref={containerRef} style={{ position: "relative" }} onMouseLeave={() => setTooltip(null)}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} margin={{ top: 20, right: 55, bottom: 20, left: 55 }}>
            <PolarGrid stroke="#6b728040" />
            <PolarAngleAxis dataKey="subject" tick={renderAxisTick} />
            <PolarRadiusAxis
              angle={90}
              domain={[domainMin, domainMax]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={false}
              onClick={handleRadarClick}
              style={{ cursor: onMarkerClick ? "pointer" : "default" }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Tooltip — only visible when hovering a label */}
        {tooltip && (() => {
          const m = tooltip.marker;
          const statusColor = STATUS_COLORS[m.status];
          const statusLabel = m.status.charAt(0).toUpperCase() + m.status.slice(1);
          const gray = "var(--color-text-secondary, #6b7280)";
          const def  = "var(--color-text-default, #111)";
          return (
            <div
              style={{
                position: "absolute",
                left: tooltipLeft,
                top: tooltip.y - 10,
                width: TOOLTIP_W,
                background: "var(--color-surface-elevated, #fff)",
                border: "1px solid var(--color-border-default, #e5e7eb)",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                fontSize: 12,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {/* Name + status badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <p style={{ fontWeight: 700, color: def, lineHeight: 1.3 }}>{m.name}</p>
                <span
                  style={{
                    fontWeight: 600,
                    color: statusColor,
                    background: statusColor + "1a",
                    borderRadius: 20,
                    padding: "1px 8px",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Relevance note */}
              <p
                style={{
                  color: def,
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginBottom: 8,
                  borderLeft: `3px solid ${statusColor}`,
                  paddingLeft: 8,
                }}
              >
                {m.relevanceNote}
              </p>

              {/* Raw values */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <p style={{ color: gray }}>
                  <span style={{ color: def, fontWeight: 600 }}>Your value: </span>
                  {m.value}
                </p>
                <p style={{ color: gray }}>
                  <span style={{ color: def, fontWeight: 600 }}>Normal range: </span>
                  {m.referenceRange}
                </p>
                <p style={{ color: gray, marginTop: 4, fontSize: 10, fontStyle: "italic" }}>
                  In context of: {problem}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Status counts */}
      <div className="flex items-center justify-center gap-5 text-xs text-secondary">
        {normalCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {normalCount} normal
          </span>
        )}
        {borderlineCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {borderlineCount} borderline
          </span>
        )}
        {abnormalCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {abnormalCount} abnormal
          </span>
        )}
      </div>
    </div>
  );
};
