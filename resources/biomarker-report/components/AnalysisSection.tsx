import React from "react";
import type { ResultAnalysis } from "../types";

interface AnalysisSectionProps {
  result: ResultAnalysis;
  problem?: string;
}

const SEVERITY_CONFIG = {
  optimal:     { color: "#15803d", bg: "#dcfce7", label: "Optimal" },
  mild:        { color: "#92400e", bg: "#fef3c7", label: "Mild deviation" },
  moderate:    { color: "#c2410c", bg: "#ffedd5", label: "Moderate deviation" },
  significant: { color: "#991b1b", bg: "#fee2e2", label: "Significant deviation" },
} as const;

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ result, problem }) => {
  const sev = SEVERITY_CONFIG[result.severity];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-text-default, #111)",
          }}
        >
          Your Result{problem ? ` & ${problem}` : ""}
        </h3>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: sev.color,
            background: sev.bg,
          }}
        >
          {sev.label}
        </span>
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--color-text-secondary, #6b7280)",
          borderLeft: "3px solid var(--color-border-default, #e5e7eb)",
          paddingLeft: 12,
        }}
      >
        {result.interpretation}
      </p>
    </div>
  );
};
