import React from "react";
import type { RelatedMarker } from "../types";

interface RelatedMarkersProps {
  markers: RelatedMarker[];
}

const STATUS_CONFIG = {
  normal:     { dot: "#22c55e", badge: { color: "#15803d", bg: "#dcfce7" }, label: "Normal" },
  borderline: { dot: "#f59e0b", badge: { color: "#92400e", bg: "#fef3c7" }, label: "Borderline" },
  abnormal:   { dot: "#ef4444", badge: { color: "#991b1b", bg: "#fee2e2" }, label: "Abnormal" },
} as const;

export const RelatedMarkers: React.FC<RelatedMarkersProps> = ({ markers }) => {
  if (markers.length === 0) return null;

  return (
    <div>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-text-default, #111)",
          marginBottom: 10,
        }}
      >
        Related Markers From Your Report
      </h3>

      {/* Horizontally scrollable row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {markers.map((m) => {
          const cfg = STATUS_CONFIG[m.status];
          return (
            <div
              key={m.name}
              style={{
                flexShrink: 0,
                width: 150,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--color-border-default, #e5e7eb)",
                background: "var(--color-surface-elevated, #fff)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-text-default, #111)",
                  marginBottom: 2,
                }}
              >
                {m.name}
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-default, #111)",
                  marginBottom: 6,
                }}
              >
                {m.value}
              </p>

              {/* Status badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  color: cfg.badge.color,
                  background: cfg.badge.bg,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: cfg.dot,
                    flexShrink: 0,
                  }}
                />
                {cfg.label}
              </span>

              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: "var(--color-text-secondary, #6b7280)",
                  margin: 0,
                }}
              >
                {m.relationship}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
