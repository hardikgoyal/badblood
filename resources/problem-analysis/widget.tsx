import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import "../styles.css";
import { propSchema, type ProblemAnalysisProps, type RelevantMarker } from "./types";
import { SpiderChart } from "./components/SpiderChart";
import { ChartSummary } from "./components/ChartSummary";
import { RecommendationsList } from "./components/RecommendationsList";
import { MarkerInfoCard } from "./components/MarkerInfoCard";

export const widgetMetadata: WidgetMetadata = {
  description:
    "Spider/radar chart showing blood marker scores relevant to a specific health condition",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Mapping your markers to your condition...",
    invoked: "Problem analysis ready",
  },
};

const statusConfig = {
  normal: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    label: "Normal",
  },
  borderline: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    label: "Borderline",
  },
  abnormal: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    label: "Abnormal",
  },
};

type ViewMode = "chart" | "list";

const ProblemAnalysis: React.FC = () => {
  const { props, isPending } = useWidget<ProblemAnalysisProps>();
  const [view, setView] = useState<ViewMode>("chart");
  const [selectedMarker, setSelectedMarker] = useState<RelevantMarker | null>(null);
  const biomarkerCall = useCallTool("generate-biomarker-report");

  // Escape key dismisses the info card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMarker(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div className="p-5 space-y-4">
          <div className="h-5 w-32 rounded-lg bg-default/10 animate-pulse" />
          <div className="h-7 w-52 rounded-lg bg-default/10 animate-pulse" />
          <div className="h-72 rounded-2xl bg-default/10 animate-pulse" />
          <div className="h-24 rounded-xl bg-default/10 animate-pulse" />
        </div>
      </McpUseProvider>
    );
  }

  const { problem, relevantMarkers, interpretation, recommendations, reportText } = props;

  const handleMarkerClick = (marker: RelevantMarker) => {
    // Toggle off if same marker clicked again
    if (selectedMarker?.name === marker.name) {
      setSelectedMarker(null);
      return;
    }
    setSelectedMarker(marker);
    try {
      biomarkerCall.callTool(
        { markerName: marker.name, reportText, problem },
        {
          onError: (err) => console.error("generate-biomarker-report failed:", err),
        }
      );
    } catch (err) {
      console.error("callTool threw synchronously:", err);
    }
  };

  return (
    <McpUseProvider autoSize>
      <AppsSDKUIProvider linkComponent={Link}>
        <div className="p-5 space-y-5">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
              Problem Analysis
            </p>
            <h2 className="heading-xl text-default capitalize">{problem}</h2>
            <p className="text-sm text-secondary">
              {relevantMarkers.length} relevant blood markers identified
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-surface-elevated border border-default w-fit">
            {(["chart", "list"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === v
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm"
                    : "text-secondary hover:text-default"
                }`}
              >
                {v === "chart" ? "🕸️ Spider Chart" : "📋 Detail List"}
              </button>
            ))}
          </div>

          {/* Spider Chart + Summary side by side */}
          {view === "chart" && (
            <div className="rounded-2xl border border-default bg-surface-elevated p-4">
              <p className="text-xs text-secondary mb-3">Click a marker to get a deep-dive report</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[3fr_2fr]">
                <SpiderChart
                  markers={relevantMarkers}
                  problem={problem}
                  onMarkerClick={handleMarkerClick}
                />
                <div
                  style={{
                    borderLeft: "1px solid var(--color-border-default, #e5e7eb)",
                    paddingLeft: 16,
                  }}
                  className="hidden sm:block"
                >
                  <ChartSummary markers={relevantMarkers} problem={problem} />
                </div>
              </div>
              {/* On narrow screens, summary stacks below */}
              <div className="sm:hidden mt-4 pt-4 border-t border-default">
                <ChartSummary markers={relevantMarkers} problem={problem} />
              </div>

              {/* Info card — slides in below chart when a marker is selected */}
              {selectedMarker && (
                <MarkerInfoCard
                  key={selectedMarker.name}
                  marker={selectedMarker}
                  isLoading={biomarkerCall.isPending}
                  onClose={() => setSelectedMarker(null)}
                />
              )}
            </div>
          )}

          {/* Detail List */}
          {view === "list" && (
            <div className="space-y-2">
              {relevantMarkers.map((marker, i) => {
                const cfg = statusConfig[marker.status];
                const isSelected = selectedMarker?.name === marker.name;
                return (
                  <div key={i}>
                    <div
                      className={`rounded-xl border p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-default bg-surface-elevated"
                          : "border-default hover:bg-surface-elevated"
                      }`}
                      onClick={() => handleMarkerClick(marker)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-default">
                            {marker.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-default">
                          {marker.value}{" "}
                          <span className="text-secondary">
                            (ref: {marker.referenceRange})
                          </span>
                        </p>
                        <p className="text-xs text-secondary mt-1 leading-relaxed">
                          {marker.relevanceNote}
                        </p>
                      </div>
                      <span className="text-secondary text-xs shrink-0 self-center">
                        {isSelected ? "↓" : "→"}
                      </span>
                    </div>
                    {/* Info card inline in list view */}
                    {isSelected && (
                      <MarkerInfoCard
                        key={marker.name}
                        marker={marker}
                        isLoading={biomarkerCall.isPending}
                        onClose={() => setSelectedMarker(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Interpretation */}
          <div className="rounded-2xl border border-default bg-surface-elevated p-4">
            <h3 className="text-sm font-semibold text-default mb-2">
              AI Interpretation
            </h3>
            <p className="text-sm text-secondary leading-relaxed">{interpretation}</p>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-semibold text-default mb-3">
              Recommendations
            </h3>
            <RecommendationsList recommendations={recommendations} />
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-secondary text-center italic pb-1">
            For informational purposes only. Always consult a qualified healthcare professional.
          </p>
        </div>
      </AppsSDKUIProvider>
    </McpUseProvider>
  );
};

export default ProblemAnalysis;
