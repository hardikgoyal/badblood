import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import "../styles.css";
import { propSchema, type ProblemAnalysisProps, type RelevantMarker } from "./types";
import type { BiomarkerReportProps } from "../biomarker-report/types";
import { SpiderChart } from "./components/SpiderChart";
import { ChartSummary } from "./components/ChartSummary";
import { RecommendationsList } from "./components/RecommendationsList";
import { ResultGauge } from "../biomarker-report/components/ResultGauge";
import { OverviewSection } from "../biomarker-report/components/OverviewSection";
import { AnalysisSection } from "../biomarker-report/components/AnalysisSection";
import { CausesSection } from "../biomarker-report/components/CausesSection";
import { RelatedMarkers } from "../biomarker-report/components/RelatedMarkers";
import { RecommendationsGrid } from "../biomarker-report/components/RecommendationsGrid";
import { DoctorSection } from "../biomarker-report/components/DoctorSection";

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

const SectionDivider: React.FC = () => (
  <div style={{ height: 1, background: "var(--color-border-default, #e5e7eb)" }} />
);

const ProblemAnalysis: React.FC = () => {
  const { props, isPending } = useWidget<ProblemAnalysisProps>();
  const [view, setView] = useState<ViewMode>("chart");
  const [selectedMarker, setSelectedMarker] = useState<RelevantMarker | null>(null);
  const [biomarkerReport, setBiomarkerReport] = useState<BiomarkerReportProps | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const biomarkerCall = useCallTool("generate-biomarker-report");

  // Escape key closes detail view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleBack();
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
    if (selectedMarker?.name === marker.name && biomarkerReport) {
      // Already showing this marker's report — do nothing
      return;
    }
    setSelectedMarker(marker);
    setBiomarkerReport(null);
    setReportError(null);
    try {
      biomarkerCall.callTool(
        { markerName: marker.name, reportText, problem },
        {
          onSuccess: (data) => {
            setBiomarkerReport(data.structuredContent as unknown as BiomarkerReportProps);
          },
          onError: (err) => {
            console.error("generate-biomarker-report failed:", err);
            setReportError(
              "Deep-dive requires the ChatGPT environment and is not available in the inspector."
            );
          },
        }
      );
    } catch (err) {
      console.error("callTool threw synchronously:", err);
      setReportError(
        "Deep-dive requires the ChatGPT environment and is not available in the inspector."
      );
    }
  };

  const handleBack = () => {
    setSelectedMarker(null);
    setBiomarkerReport(null);
    setReportError(null);
  };

  // ── Deep-dive detail view ─────────────────────────────────────────────────
  if (selectedMarker) {
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
            </div>

            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-default transition-colors"
            >
              ← Back to chart
            </button>

            {reportError ? (
              <div className="rounded-xl border border-default bg-surface-elevated p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-default">Available in ChatGPT only</p>
                <p className="text-xs text-secondary leading-relaxed">{reportError}</p>
              </div>
            ) : biomarkerCall.isPending || !biomarkerReport ? (
              /* Loading skeleton */
              <div className="space-y-4">
                <div className="h-24 rounded-2xl bg-default/10 animate-pulse" />
                <div className="h-5 w-40 rounded bg-default/10 animate-pulse" />
                <div className="h-16 rounded-xl bg-default/10 animate-pulse" />
                <div className="h-20 rounded-xl bg-default/10 animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 w-36 rounded-xl bg-default/10 animate-pulse flex-shrink-0" />
                  ))}
                </div>
                <div className="h-16 rounded-xl bg-default/10 animate-pulse" />
                <div className="h-24 rounded-xl bg-default/10 animate-pulse" />
              </div>
            ) : (
              /* Full biomarker report rendered inline */
              <div className="space-y-5">
                {/* Marker name */}
                <div>
                  <h3 className="text-lg font-bold text-default">
                    {biomarkerReport.overview.commonName}
                  </h3>
                  {biomarkerReport.overview.fullName !== biomarkerReport.overview.commonName && (
                    <p className="text-xs text-secondary">{biomarkerReport.overview.fullName}</p>
                  )}
                </div>

                {/* Result Gauge */}
                <div className="rounded-2xl border border-default bg-surface-elevated p-4">
                  <ResultGauge result={biomarkerReport.result} />
                </div>

                <SectionDivider />
                <OverviewSection overview={biomarkerReport.overview} />

                <SectionDivider />
                <AnalysisSection result={biomarkerReport.result} problem={biomarkerReport.problem} />

                <SectionDivider />
                <CausesSection
                  causes={biomarkerReport.causes}
                  status={biomarkerReport.result.status}
                  referenceRangeLow={biomarkerReport.result.referenceRangeLow}
                  referenceRangeHigh={biomarkerReport.result.referenceRangeHigh}
                  value={biomarkerReport.result.value}
                />

                {biomarkerReport.relatedMarkers.length > 0 && (
                  <>
                    <SectionDivider />
                    <RelatedMarkers markers={biomarkerReport.relatedMarkers} />
                  </>
                )}

                <SectionDivider />
                <RecommendationsGrid recommendations={biomarkerReport.recommendations} />

                <SectionDivider />
                <div>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-text-default, #111)",
                      marginBottom: 10,
                    }}
                  >
                    When to See a Doctor
                  </h3>
                  <DoctorSection doctor={biomarkerReport.doctor} />
                </div>

                <p className="text-xs text-secondary text-center italic pb-1">
                  For informational purposes only. Always consult a qualified healthcare professional.
                </p>
              </div>
            )}
          </div>
        </AppsSDKUIProvider>
      </McpUseProvider>
    );
  }

  // ── Main chart / list view ────────────────────────────────────────────────
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

          {/* Spider Chart */}
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
                  style={{ borderLeft: "1px solid var(--color-border-default, #e5e7eb)", paddingLeft: 16 }}
                  className="hidden sm:block"
                >
                  <ChartSummary markers={relevantMarkers} problem={problem} />
                </div>
              </div>
              <div className="sm:hidden mt-4 pt-4 border-t border-default">
                <ChartSummary markers={relevantMarkers} problem={problem} />
              </div>
            </div>
          )}

          {/* Detail List */}
          {view === "list" && (
            <div className="space-y-2">
              {relevantMarkers.map((marker, i) => {
                const cfg = statusConfig[marker.status];
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-default p-3 flex items-start gap-3 cursor-pointer hover:bg-surface-elevated transition-colors"
                    onClick={() => handleMarkerClick(marker)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-default">{marker.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-default">
                        {marker.value}{" "}
                        <span className="text-secondary">(ref: {marker.referenceRange})</span>
                      </p>
                      <p className="text-xs text-secondary mt-1 leading-relaxed">
                        {marker.relevanceNote}
                      </p>
                    </div>
                    <span className="text-secondary text-xs shrink-0 self-center">→</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interpretation */}
          <div className="rounded-2xl border border-default bg-surface-elevated p-4">
            <h3 className="text-sm font-semibold text-default mb-2">AI Interpretation</h3>
            <p className="text-sm text-secondary leading-relaxed">{interpretation}</p>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-semibold text-default mb-3">Recommendations</h3>
            <RecommendationsList recommendations={recommendations} />
          </div>

          <p className="text-xs text-secondary text-center italic pb-1">
            For informational purposes only. Always consult a qualified healthcare professional.
          </p>
        </div>
      </AppsSDKUIProvider>
    </McpUseProvider>
  );
};

export default ProblemAnalysis;
