import React from "react";
import type { RelevantMarker } from "../types";

interface MarkerInfoCardProps {
  marker: RelevantMarker;
  onClose: () => void;
}

const STATUS_COLORS = {
  normal:     "#16a34a",
  borderline: "#d97706",
  abnormal:   "#dc2626",
} as const;

const STATUS_LABELS = {
  normal:     "Normal",
  borderline: "Borderline",
  abnormal:   "Abnormal",
} as const;

export const MarkerInfoCard: React.FC<MarkerInfoCardProps> = ({ marker, onClose }) => {
  const color = STATUS_COLORS[marker.status];
  const statusLabel = STATUS_LABELS[marker.status];
  const def = "var(--color-text-default, #111)";
  const secondary = "var(--color-text-secondary, #6b7280)";

  return (
    <div
      className="bb-panel-fade"
      style={{
        marginTop: 12,
        borderRadius: 14,
        border: `1px solid ${color}30`,
        background: `${color}08`,
        padding: "14px 16px",
        position: "relative",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: secondary,
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Header: name + status + score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 4,
          paddingRight: 24,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: def }}>
          {marker.name}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color,
            background: `${color}1a`,
          }}
        >
          ● {statusLabel}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color, marginLeft: "auto" }}>
          {marker.score}/100
        </span>
      </div>

      {/* Value + ref range */}
      <p style={{ fontSize: 12, color: secondary, marginBottom: 8 }}>
        Your value:{" "}
        <strong style={{ color: def }}>{marker.value}</strong>
        {" · "}
        Ref: <span style={{ color: def }}>{marker.referenceRange}</span>
      </p>

      {/* Relevance note */}
      <p
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: secondary,
          borderLeft: `3px solid ${color}`,
          paddingLeft: 8,
          margin: 0,
        }}
      >
        {marker.relevanceNote}
      </p>
    </div>
  );
};
