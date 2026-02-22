import React from "react";
import type { CommonCauses } from "../types";

interface CausesSectionProps {
  causes: CommonCauses;
  status: "normal" | "borderline" | "abnormal";
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  value?: number;
}

export const CausesSection: React.FC<CausesSectionProps> = ({
  causes,
  status,
  referenceRangeLow,
  referenceRangeHigh,
  value,
}) => {
  // Determine which column to highlight: low or high
  let highlight: "low" | "high" | "none" = "none";
  if (status !== "normal") {
    if (value !== undefined && referenceRangeLow !== null && referenceRangeLow !== undefined) {
      highlight = value < referenceRangeLow ? "low" : "high";
    }
  }

  const colStyle = (side: "low" | "high"): React.CSSProperties => ({
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid var(--color-border-default, #e5e7eb)",
    background:
      highlight === side
        ? "var(--color-surface-elevated, #fff)"
        : "transparent",
    opacity: highlight !== "none" && highlight !== side ? 0.45 : 1,
    transition: "opacity 0.2s ease",
  });

  const headerStyle = (side: "low" | "high"): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 10,
    color: side === "low" ? "#2563eb" : "#ea580c",
  });

  const renderCauses = (items: string[]) => (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((cause, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 6,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--color-text-secondary, #6b7280)",
            marginBottom: i < items.length - 1 ? 6 : 0,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 2 }}>•</span>
          {cause}
        </li>
      ))}
    </ul>
  );

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
        Common Causes
      </h3>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={colStyle("low")}>
          <div style={headerStyle("low")}>⬇ If Low</div>
          {causes.ifLow.length > 0 ? (
            renderCauses(causes.ifLow)
          ) : (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
              N/A
            </p>
          )}
        </div>

        <div style={colStyle("high")}>
          <div style={headerStyle("high")}>⬆ If High</div>
          {causes.ifHigh.length > 0 ? (
            renderCauses(causes.ifHigh)
          ) : (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
              N/A
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
