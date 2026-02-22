import React from "react";
import type { DoctorSection as DoctorSectionType } from "../types";

interface DoctorSectionProps {
  doctor: DoctorSectionType;
}

const URGENCY_CONFIG = {
  routine: {
    icon: "✓",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac",
    label: "Routine — mention at next visit",
  },
  soon: {
    icon: "⚡",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fcd34d",
    label: "Soon — schedule within 2–4 weeks",
  },
  urgent: {
    icon: "⚠️",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#fca5a5",
    label: "Urgent — see a doctor this week",
  },
} as const;

export const DoctorSection: React.FC<DoctorSectionProps> = ({ doctor }) => {
  const cfg = URGENCY_CONFIG[doctor.urgency];

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
      }}
    >
      {/* Urgency badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          color: cfg.color,
          background: "rgba(255,255,255,0.6)",
          marginBottom: 10,
        }}
      >
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
      </div>

      {/* Reasoning */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: cfg.color,
          marginBottom: 12,
        }}
      >
        {doctor.reasoning}
      </p>

      {/* Questions to ask */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: cfg.color,
            marginBottom: 8,
            opacity: 0.8,
          }}
        >
          Questions to ask your doctor:
        </p>
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {doctor.questionsToAsk.map((q, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 8,
                fontSize: 12,
                lineHeight: 1.5,
                color: cfg.color,
                marginBottom: i < doctor.questionsToAsk.length - 1 ? 6 : 0,
              }}
            >
              <span style={{ fontWeight: 700, flexShrink: 0, opacity: 0.7 }}>
                {i + 1}.
              </span>
              {q}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
