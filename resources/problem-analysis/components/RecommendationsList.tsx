import React from "react";

interface RecommendationsListProps {
  recommendations: string[];
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
}) => {
  return (
    <div className="space-y-2">
      {recommendations.map((rec, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl bg-surface-elevated border border-default"
        >
          <span className="shrink-0 w-5 h-5 rounded-full bg-info/15 text-info flex items-center justify-center text-xs font-bold mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm text-default leading-relaxed">{rec}</p>
        </div>
      ))}
    </div>
  );
};
