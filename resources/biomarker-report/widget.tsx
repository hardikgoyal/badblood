import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import React from "react";
import { Link } from "react-router";
import "../styles.css";
import { propSchema, type BiomarkerReportProps } from "./types";
import { ResultGauge } from "./components/ResultGauge";
import { OverviewSection } from "./components/OverviewSection";
import { AnalysisSection } from "./components/AnalysisSection";
import { CausesSection } from "./components/CausesSection";
import { RelatedMarkers } from "./components/RelatedMarkers";
import { RecommendationsGrid } from "./components/RecommendationsGrid";
import { DoctorSection } from "./components/DoctorSection";

export const widgetMetadata: WidgetMetadata = {
  description:
    "Comprehensive clinical deep-dive report for a single blood biomarker — includes range gauge, what the marker measures, personalized result analysis, common causes, related markers, food/lifestyle recommendations, and when to see a doctor.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Generating your biomarker deep-dive...",
    invoked: "Biomarker report ready",
  },
};

const SectionDivider: React.FC = () => (
  <div
    style={{
      height: 1,
      background: "var(--color-border-default, #e5e7eb)",
      margin: "0 -20px",
    }}
  />
);

const BiomarkerReport: React.FC = () => {
  const { props, isPending } = useWidget<BiomarkerReportProps>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 20 }} className="space-y-4">
          {/* Header skeleton */}
          <div>
            <div className="h-3 w-28 rounded-lg bg-default/10 animate-pulse mb-2" />
            <div className="h-6 w-48 rounded-lg bg-default/10 animate-pulse" />
          </div>
          {/* Gauge skeleton */}
          <div className="h-24 rounded-2xl bg-default/10 animate-pulse" />
          {/* Overview skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-default/10 animate-pulse" />
            <div className="h-12 rounded bg-default/10 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-20 rounded-full bg-default/10 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Analysis skeleton */}
          <div className="h-16 rounded-xl bg-default/10 animate-pulse" />
          {/* Causes skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 rounded-xl bg-default/10 animate-pulse" />
            <div className="h-28 rounded-xl bg-default/10 animate-pulse" />
          </div>
          {/* Cards skeleton */}
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 w-36 rounded-xl bg-default/10 animate-pulse flex-shrink-0" />
            ))}
          </div>
          {/* Recs skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-default/10 animate-pulse" />
            ))}
          </div>
          {/* Doctor skeleton */}
          <div className="h-28 rounded-xl bg-default/10 animate-pulse" />
        </div>
      </McpUseProvider>
    );
  }

  const { overview, result, causes, relatedMarkers, recommendations, doctor, problem } = props;

  return (
    <McpUseProvider autoSize>
      <AppsSDKUIProvider linkComponent={Link}>
        <div style={{ padding: 20 }} className="space-y-5">

          {/* ── Header ── */}
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
              Biomarker Report
            </p>
            <h2 className="heading-xl text-default" style={{ marginBottom: 2 }}>
              {overview.commonName}
            </h2>
            {overview.fullName !== overview.commonName && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)", margin: 0 }}>
                {overview.fullName}
              </p>
            )}
            {problem && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)", marginTop: 2 }}>
                In context of: <em>{problem}</em>
              </p>
            )}
          </div>

          {/* ── Result Gauge ── */}
          <div
            className="rounded-2xl border border-default bg-surface-elevated"
            style={{ padding: "16px 20px" }}
          >
            <ResultGauge result={result} />
          </div>

          <SectionDivider />

          {/* ── Overview ── */}
          <OverviewSection overview={overview} />

          <SectionDivider />

          {/* ── Your Result Analysis ── */}
          <AnalysisSection result={result} problem={problem} />

          <SectionDivider />

          {/* ── Common Causes ── */}
          <CausesSection
            causes={causes}
            status={result.status}
            referenceRangeLow={result.referenceRangeLow}
            referenceRangeHigh={result.referenceRangeHigh}
            value={result.value}
          />

          {/* ── Related Markers (conditional) ── */}
          {relatedMarkers.length > 0 && (
            <>
              <SectionDivider />
              <RelatedMarkers markers={relatedMarkers} />
            </>
          )}

          <SectionDivider />

          {/* ── Recommendations ── */}
          <RecommendationsGrid recommendations={recommendations} />

          <SectionDivider />

          {/* ── When to See a Doctor ── */}
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
            <DoctorSection doctor={doctor} />
          </div>

          {/* ── Disclaimer ── */}
          <p className="text-xs text-secondary text-center italic pb-1">
            For informational purposes only. Always consult a qualified healthcare professional.
          </p>
        </div>
      </AppsSDKUIProvider>
    </McpUseProvider>
  );
};

export default BiomarkerReport;
