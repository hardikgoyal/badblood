# Fix: Spider Chart Click → Biomarker Report Not Rendering

## Problem

Clicking a biomarker on the spider chart calls `generate-biomarker-report` via `useCallTool`, but only the text output appears in chat. The biomarker report widget never renders.

## Root Cause

`useCallTool()` calls the MCP tool **directly** (bypassing the AI). When the tool returns `widget({ props, output })`, only the `output: text(...)` portion is surfaced. The widget rendering pipeline is only triggered when the **AI itself** initiates the tool call.

**Evidence from mcp-use docs:** Every `useCallTool` example pairs with tools that return `text()` (CRUD ops). No example uses `useCallTool` with a tool that returns `widget()`.

---

## Recommended Fix: Render Biomarker Report Inline

Instead of relying on a separate widget rendered in the chat, **render the biomarker report directly inside the problem-analysis widget**. This:

- Eliminates the cross-tool widget rendering problem entirely
- Gives better UX — the report appears right below the chart, not "scroll down in chat"
- Keeps `generate-biomarker-report` as a server-side tool (for direct AI usage too)

### How It Works

1. User clicks a biomarker on the spider chart
2. `callToolAsync("generate-biomarker-report")` fetches the data
3. The response data is stored in local state
4. The biomarker report sub-components render **inline** within the problem-analysis widget

The key insight: `useCallTool` **does** return the data via `result.structuredContent` — we just can't rely on it to render a separate widget. But we can use the data ourselves.

---

## Implementation Plan

### File 1: `resources/problem-analysis/widget.tsx`

**Step 1 — Add state for the biomarker report data**

```diff
 import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
+import type { BiomarkerReportProps } from "../biomarker-report/types";
+import { ResultGauge } from "../biomarker-report/components/ResultGauge";
+import { OverviewSection } from "../biomarker-report/components/OverviewSection";
+import { AnalysisSection } from "../biomarker-report/components/AnalysisSection";
+import { CausesSection } from "../biomarker-report/components/CausesSection";
+import { RelatedMarkers } from "../biomarker-report/components/RelatedMarkers";
+import { RecommendationsGrid } from "../biomarker-report/components/RecommendationsGrid";
+import { DoctorSection } from "../biomarker-report/components/DoctorSection";
```

```diff
   const [selectedMarker, setSelectedMarker] = useState<RelevantMarker | null>(null);
-  const biomarkerCall = useCallTool("generate-biomarker-report");
+  const { callToolAsync, isPending: isReportLoading } = useCallTool("generate-biomarker-report");
+  const [biomarkerReport, setBiomarkerReport] = useState<BiomarkerReportProps | null>(null);
```

**Step 2 — Rewrite `handleMarkerClick` to fetch data and store locally**

```diff
   const handleMarkerClick = (marker: RelevantMarker) => {
     if (selectedMarker?.name === marker.name) {
       setSelectedMarker(null);
+      setBiomarkerReport(null);
       return;
     }
     setSelectedMarker(marker);
-    try {
-      biomarkerCall.callTool(
-        { markerName: marker.name, reportText, problem },
-        {
-          onError: (err) => console.error("generate-biomarker-report failed:", err),
-        }
-      );
-    } catch (err) {
-      console.error("callTool threw synchronously:", err);
-    }
+    setBiomarkerReport(null); // clear previous report
+    callToolAsync({ markerName: marker.name, reportText, problem })
+      .then((result) => {
+        // structuredContent contains the widget props returned by the tool
+        const data = result.structuredContent as BiomarkerReportProps | undefined;
+        if (data) setBiomarkerReport(data);
+      })
+      .catch((err) => console.error("generate-biomarker-report failed:", err));
   };
```

**Step 3 — Update MarkerInfoCard to use `isReportLoading`**

```diff
               {selectedMarker && (
                 <MarkerInfoCard
                   key={selectedMarker.name}
                   marker={selectedMarker}
-                  isLoading={biomarkerCall.isPending}
+                  isLoading={isReportLoading}
                   onClose={() => setSelectedMarker(null)}
                 />
               )}
```

(Same change in the list view around line 201-208.)

**Step 4 — Render the biomarker report inline below the MarkerInfoCard**

Add this after the `MarkerInfoCard` block inside the chart view container (after line ~155), and similarly in the list view:

```tsx
{/* Inline biomarker deep-dive report */}
{biomarkerReport && selectedMarker && !isReportLoading && (
  <div className="bb-panel-fade" style={{ marginTop: 16 }}>
    <div className="rounded-2xl border border-default bg-surface-elevated p-5 space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
          Biomarker Report
        </p>
        <h3 className="heading-xl text-default" style={{ marginBottom: 2 }}>
          {biomarkerReport.overview.commonName}
        </h3>
        {biomarkerReport.overview.fullName !== biomarkerReport.overview.commonName && (
          <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
            {biomarkerReport.overview.fullName}
          </p>
        )}
      </div>

      {/* Result Gauge */}
      <div className="rounded-2xl border border-default bg-surface-elevated"
           style={{ padding: "16px 20px" }}>
        <ResultGauge result={biomarkerReport.result} />
      </div>

      {/* Overview */}
      <OverviewSection overview={biomarkerReport.overview} />

      {/* Analysis */}
      <AnalysisSection result={biomarkerReport.result} problem={problem} />

      {/* Causes */}
      <CausesSection
        causes={biomarkerReport.causes}
        status={biomarkerReport.result.status}
        referenceRangeLow={biomarkerReport.result.referenceRangeLow}
        referenceRangeHigh={biomarkerReport.result.referenceRangeHigh}
        value={biomarkerReport.result.value}
      />

      {/* Related Markers */}
      {biomarkerReport.relatedMarkers.length > 0 && (
        <RelatedMarkers markers={biomarkerReport.relatedMarkers} />
      )}

      {/* Recommendations */}
      <RecommendationsGrid recommendations={biomarkerReport.recommendations} />

      {/* Doctor Section */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10,
                     color: "var(--color-text-default, #111)" }}>
          When to See a Doctor
        </h3>
        <DoctorSection doctor={biomarkerReport.doctor} />
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-secondary text-center italic">
        For informational purposes only. Always consult a qualified healthcare professional.
      </p>
    </div>
  </div>
)}
```

---

### File 2: `resources/problem-analysis/components/MarkerInfoCard.tsx`

No changes needed — `isLoading` prop is still used, just wired to `isReportLoading` from the updated `useCallTool` destructuring.

Update the "done" message to reflect inline rendering:

```diff
-            Report generated — scroll down in chat
+            Report ready — see below
```

---

### No changes to: `index.ts` (server)

The `generate-biomarker-report` tool stays exactly as-is. It still returns `widget()` so it works when the AI calls it directly (e.g., user types "analyze my Vitamin D"). The problem-analysis widget just reads the data from the response instead of relying on the framework to render a separate widget.

---

## Fallback: If `structuredContent` Doesn't Contain Widget Props

If `callToolAsync` doesn't return widget props in `structuredContent`, we have a simple fallback — modify the tool to **also** return the props as structured data alongside the widget:

```diff
 // In index.ts, generate-biomarker-report handler:
       return widget({
         props: {
           overview: parsed.markerOverview,
           result: parsed.resultAnalysis,
           causes: parsed.commonCauses,
           relatedMarkers: parsed.relatedMarkers ?? [],
           recommendations: parsed.foodAndLifestyle ?? [],
           doctor: parsed.whenToSeeDoctor,
           problem,
         },
-        output: text(
-          `Biomarker report for ${markerName} generated. Score: ${parsed.resultAnalysis?.score ?? "N/A"}/100. ${parsed.resultAnalysis?.interpretation?.substring(0, 150) ?? ""}...`
-        ),
+        output: text(JSON.stringify({
+          overview: parsed.markerOverview,
+          result: parsed.resultAnalysis,
+          causes: parsed.commonCauses,
+          relatedMarkers: parsed.relatedMarkers ?? [],
+          recommendations: parsed.foodAndLifestyle ?? [],
+          doctor: parsed.whenToSeeDoctor,
+          problem,
+        })),
       });
```

Then in the widget, parse the text content from the result:

```tsx
.then((result) => {
  // Try structuredContent first, fall back to parsing text content
  let data = result.structuredContent as BiomarkerReportProps | undefined;
  if (!data && result.content) {
    const textBlock = result.content.find((c: any) => c.type === "text");
    if (textBlock) data = JSON.parse(textBlock.text);
  }
  if (data) setBiomarkerReport(data);
})
```

**Note:** This fallback changes the tool's text output from a human-readable summary to JSON. If you want to keep human-readable output for the AI, you can add a second text block or use a separate content type. The cleanest option is to check whether `structuredContent` works first before applying this fallback.

---

## Summary

| File | What Changes |
|------|-------------|
| `widget.tsx` | Import biomarker report sub-components |
| `widget.tsx` | Add `biomarkerReport` state, use `callToolAsync` |
| `widget.tsx` | Render report inline below the chart when data arrives |
| `MarkerInfoCard.tsx` | Update "done" message text |
| `index.ts` | No changes (fallback only if needed) |

## Expected Behavior After Fix

1. User clicks a biomarker dot or label on the spider chart
2. The marker highlights; MarkerInfoCard slides in with spinner
3. `callToolAsync` fetches the deep-dive data in the background
4. When data arrives, the full biomarker report renders **inline below the spider chart** — with gauge, overview, analysis, causes, related markers, recommendations, and doctor section
5. User sees everything in one place without scrolling through chat
6. Clicking a different marker replaces the report; clicking same marker collapses it
