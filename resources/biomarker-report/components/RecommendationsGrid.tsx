import React from "react";
import type { Recommendation } from "../types";

interface RecommendationsGridProps {
  recommendations: Recommendation[];
}

const CATEGORY_CONFIG = {
  food:       { icon: "🐟", label: "Food", color: "#16a34a", bg: "#dcfce7" },
  supplement: { icon: "💊", label: "Supplement", color: "#7c3aed", bg: "#ede9fe" },
  lifestyle:  { icon: "☀️", label: "Lifestyle", color: "#0284c7", bg: "#e0f2fe" },
  avoid:      { icon: "🚫", label: "Avoid", color: "#dc2626", bg: "#fee2e2" },
} as const;

export const RecommendationsGrid: React.FC<RecommendationsGridProps> = ({
  recommendations,
}) => {
  if (recommendations.length === 0) return null;

  // Group by category to render in blocks
  const order: Array<"food" | "supplement" | "lifestyle" | "avoid"> = [
    "food",
    "supplement",
    "lifestyle",
    "avoid",
  ];

  const grouped = order.reduce<Record<string, Recommendation[]>>((acc, cat) => {
    acc[cat] = recommendations.filter((r) => r.category === cat);
    return acc;
  }, {});

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
        What You Can Do
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {order.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <React.Fragment key={cat}>
              {items.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--color-border-default, #e5e7eb)",
                    background: "var(--color-surface-elevated, #fff)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Category icon chip */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: cfg.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {cfg.icon}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--color-text-default, #111)",
                        marginBottom: 3,
                      }}
                    >
                      {rec.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: "var(--color-text-secondary, #6b7280)",
                        margin: 0,
                      }}
                    >
                      {rec.detail}
                    </p>
                  </div>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
