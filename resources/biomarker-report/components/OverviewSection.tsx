import React from "react";
import type { MarkerOverview } from "../types";

interface OverviewSectionProps {
  overview: MarkerOverview;
}

const ORGAN_ICONS: Record<string, string> = {
  "Bones":          "🦴",
  "Liver":          "🫀",
  "Kidneys":        "🫘",
  "Heart":          "❤️",
  "Immune system":  "🛡️",
  "Muscles":        "💪",
  "Brain":          "🧠",
  "Mood":           "🧠",
  "Thyroid":        "🦋",
  "Skin":           "🧴",
  "Eyes":           "👁️",
  "Blood":          "🩸",
  "Lungs":          "🫁",
  "Pancreas":       "🔬",
};

function getOrganIcon(organ: string): string {
  // Exact match first
  if (ORGAN_ICONS[organ]) return ORGAN_ICONS[organ];
  // Partial match
  const key = Object.keys(ORGAN_ICONS).find((k) =>
    organ.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ORGAN_ICONS[key] : "🔬";
}

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3
    style={{
      fontSize: 13,
      fontWeight: 700,
      color: "var(--color-text-default, #111)",
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: "1px solid var(--color-border-default, #e5e7eb)",
    }}
  >
    {children}
  </h3>
);

export const OverviewSection: React.FC<OverviewSectionProps> = ({ overview }) => {
  return (
    <div>
      <SectionHeader>What Is {overview.commonName}?</SectionHeader>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--color-text-secondary, #6b7280)",
          marginBottom: 8,
        }}
      >
        {overview.whatItMeasures}
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--color-text-secondary, #6b7280)",
          marginBottom: 12,
        }}
      >
        {overview.whyItMatters}
      </p>

      {/* Organ chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {overview.organsInvolved.map((organ) => (
          <span
            key={organ}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              background: "rgba(99,102,241,0.08)",
              color: "var(--color-text-default, #111)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            <span>{getOrganIcon(organ)}</span>
            <span>{organ}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
