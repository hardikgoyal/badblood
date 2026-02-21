import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import React from "react";
import { Link } from "react-router";
import "../styles.css";
import { propSchema, type BloodReportDashboardProps } from "./types";
import { SummaryBanner } from "./components/SummaryBanner";
import { CategorySection } from "./components/CategorySection";

export const widgetMetadata: WidgetMetadata = {
  description:
    "Visual blood test report dashboard with color-coded markers grouped by category",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Analyzing your blood report...",
    invoked: "Blood report ready",
  },
};

const CATEGORY_ORDER = [
  "CBC",
  "Lipids",
  "Thyroid",
  "Liver",
  "Kidney",
  "Vitamins",
  "Metabolic",
  "Hormones",
  "Other",
];

const BloodReportDashboard: React.FC = () => {
  const { props, isPending } = useWidget<BloodReportDashboardProps>();

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div className="p-5 space-y-4">
          <div className="h-7 w-40 rounded-lg bg-default/10 animate-pulse" />
          <div className="h-5 w-64 rounded-lg bg-default/10 animate-pulse" />
          <div className="h-20 rounded-2xl bg-default/10 animate-pulse" />
          <div className="h-36 rounded-xl bg-default/10 animate-pulse" />
          <div className="h-36 rounded-xl bg-default/10 animate-pulse" />
        </div>
      </McpUseProvider>
    );
  }

  const { markers, extractedAt, patientInfo } = props;

  const byCategory = CATEGORY_ORDER.reduce<
    Record<string, typeof markers>
  >((acc, cat) => {
    const catMarkers = markers.filter((m) => m.category === cat);
    if (catMarkers.length > 0) acc[cat] = catMarkers;
    return acc;
  }, {});

  const dateLabel = patientInfo?.date
    ? patientInfo.date
    : new Date(extractedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <McpUseProvider autoSize>
      <AppsSDKUIProvider linkComponent={Link}>
        <div className="p-5 space-y-4">
          {/* Header */}
          <div>
            <h2 className="heading-xl text-default">Blood Report</h2>
            <p className="text-sm text-secondary mt-0.5">
              {patientInfo?.name ? `${patientInfo.name} · ` : ""}
              {dateLabel} · {markers.length} markers extracted
            </p>
          </div>

          {/* Summary */}
          <SummaryBanner markers={markers} />

          {/* Category sections */}
          <div className="space-y-3">
            {Object.entries(byCategory).map(([category, catMarkers]) => (
              <CategorySection
                key={category}
                category={category}
                markers={catMarkers}
              />
            ))}
          </div>

          {/* Footer */}
          <p className="text-xs text-secondary text-center italic pb-1">
            For informational purposes only. Always consult a qualified healthcare professional.
          </p>
        </div>
      </AppsSDKUIProvider>
    </McpUseProvider>
  );
};

export default BloodReportDashboard;
