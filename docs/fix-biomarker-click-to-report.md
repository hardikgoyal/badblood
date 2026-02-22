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

**Step 1 — Add imports for biomarker report types and sub-components**

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

**Step 2 — Replace `biomarkerCall` with destructured `callToolAsync` + add report state**

```diff
   const [selectedMarker, setSelectedMarker] = useState<RelevantMarker | null>(null);
-  const biomarkerCall = useCallTool("generate-biomarker-report");
+  const { callToolAsync, isPending: isReportLoading } = useCallTool("generate-biomarker-report");
+  const [biomarkerReport, setBiomarkerReport] = useState<BiomarkerReportProps | null>(null);
```

**Step 3 — Update the Escape key handler to also clear the report**

```diff
   useEffect(() => {
     const onKey = (e: KeyboardEvent) => {
-      if (e.key === "Escape") setSelectedMarker(null);
+      if (e.key === "Escape") {
+        setSelectedMarker(null);
+        setBiomarkerReport(null);
+      }
     };
     window.addEventListener("keydown", onKey);
     return () => window.removeEventListener("keydown", onKey);
   }, []);
```

**Step 4 — Rewrite `handleMarkerClick` to fetch data and store locally**

> **IMPORTANT:** `reportText` is now `optional` in `ProblemAnalysisProps` (changed to `z.string().optional()`). The `generate-biomarker-report` tool requires `reportText` as a non-optional string. Must guard against `undefined`.

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
+    if (!reportText) return;  // guard: tool requires reportText
+    callToolAsync({ markerName: marker.name, reportText, problem })
+      .then((result) => {
+        const data = result.structuredContent as BiomarkerReportProps | undefined;
+        if (data) setBiomarkerReport(data);
+      })
+      .catch((err) => console.error("generate-biomarker-report failed:", err));
   };
```

**Step 5 — Update `onClose` callbacks to also clear the report**

Everywhere `onClose` is used (chart view line ~153, list view line ~207):

```diff
-                  onClose={() => setSelectedMarker(null)}
+                  onClose={() => { setSelectedMarker(null); setBiomarkerReport(null); }}
```

**Step 6 — Update MarkerInfoCard `isLoading` wiring**

In chart view (line ~148-155):
```diff
               {selectedMarker && (
                 <MarkerInfoCard
                   key={selectedMarker.name}
                   marker={selectedMarker}
-                  isLoading={biomarkerCall.isPending}
+                  isLoading={isReportLoading}
-                  onClose={() => setSelectedMarker(null)}
+                  onClose={() => { setSelectedMarker(null); setBiomarkerReport(null); }}
                 />
               )}
```

In list view (line ~201-208):
```diff
                     {isSelected && (
                       <MarkerInfoCard
                         key={marker.name}
                         marker={marker}
-                        isLoading={biomarkerCall.isPending}
+                        isLoading={isReportLoading}
-                        onClose={() => setSelectedMarker(null)}
+                        onClose={() => { setSelectedMarker(null); setBiomarkerReport(null); }}
                       />
                     )}
```

**Step 7 — Render the biomarker report inline**

Add after the `MarkerInfoCard` block inside the chart view container (after line ~155).

All component props verified against actual interfaces:
- `ResultGauge`: `{ result: ResultAnalysis }` ✅
- `OverviewSection`: `{ overview: MarkerOverview }` ✅
- `AnalysisSection`: `{ result: ResultAnalysis; problem?: string }` ✅
- `CausesSection`: `{ causes: CommonCauses; status: "normal"|"borderline"|"abnormal"; referenceRangeLow?: number|null; referenceRangeHigh?: number|null; value?: number }` ✅
- `RelatedMarkers`: `{ markers: RelatedMarker[] }` ✅ (note: this is `RelatedMarker` from `biomarker-report/types`, NOT `RelevantMarker` from `problem-analysis/types`)
- `RecommendationsGrid`: `{ recommendations: Recommendation[] }` ✅
- `DoctorSection`: `{ doctor: DoctorSectionType }` ✅

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
        {problem && (
          <p style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)", marginTop: 2 }}>
            In context of: <em>{problem}</em>
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

**Step 8 — Same inline report block in list view**

Add the same inline report block after the `MarkerInfoCard` in the list view (after line ~208), but wrapped differently since each list item has its own card:

```tsx
{/* inside the list item div, after MarkerInfoCard */}
{isSelected && biomarkerReport && !isReportLoading && (
  <div className="bb-panel-fade" style={{ marginTop: 8 }}>
    {/* ... same report content as Step 7 ... */}
  </div>
)}
```

To avoid duplicating the report JSX, extract it into a local component:

```tsx
const InlineBiomarkerReport: React.FC<{ report: BiomarkerReportProps }> = ({ report }) => (
  <div className="bb-panel-fade" style={{ marginTop: 16 }}>
    <div className="rounded-2xl border border-default bg-surface-elevated p-5 space-y-5">
      {/* ... all 7 sections ... */}
    </div>
  </div>
);
```

Then use `<InlineBiomarkerReport report={biomarkerReport} />` in both the chart and list views.

---

### File 2: `resources/problem-analysis/components/MarkerInfoCard.tsx`

No structural changes — `isLoading` prop stays, wired to the new `isReportLoading`.

One text update to reflect inline rendering:

```diff
-            Report generated — scroll down in chat
+            Report ready — see below
```

---

### File 3: `index.ts` (server) — No changes needed for primary approach

The `generate-biomarker-report` tool stays as-is. It still returns `widget()` so it works when the AI calls it directly.

---

## Fallback: If `structuredContent` Doesn't Contain Widget Props

If `callToolAsync` doesn't return widget props in `structuredContent`, there are two clean fallbacks:

### Option A: Return data alongside the widget (recommended)

Keep the human-readable `output` and add the props as a separate content block in the tool response:

```diff
 // In index.ts, generate-biomarker-report handler:
+      const reportData = {
+        overview: parsed.markerOverview,
+        result: parsed.resultAnalysis,
+        causes: parsed.commonCauses,
+        relatedMarkers: parsed.relatedMarkers ?? [],
+        recommendations: parsed.foodAndLifestyle ?? [],
+        doctor: parsed.whenToSeeDoctor,
+        problem,
+      };
+
       return widget({
-        props: {
-          overview: parsed.markerOverview,
-          result: parsed.resultAnalysis,
-          causes: parsed.commonCauses,
-          relatedMarkers: parsed.relatedMarkers ?? [],
-          recommendations: parsed.foodAndLifestyle ?? [],
-          doctor: parsed.whenToSeeDoctor,
-          problem,
-        },
+        props: reportData,
         output: text(
           `Biomarker report for ${markerName} generated. Score: ${parsed.resultAnalysis?.score ?? "N/A"}/100. ${parsed.resultAnalysis?.interpretation?.substring(0, 150) ?? ""}...`
         ),
+        structuredContent: reportData,
       });
```

Then in the widget:
```tsx
.then((result) => {
  const data = result.structuredContent as BiomarkerReportProps | undefined;
  if (data?.overview && data?.result) setBiomarkerReport(data);
})
```

> **Note:** Check if `widget()` in mcp-use/server accepts a `structuredContent` field. If not, see Option B.

### Option B: Create a data-only sibling tool

Add a second tool that returns JSON data (not a widget) for widget-to-widget consumption:

```typescript
server.tool(
  {
    name: "get-biomarker-data",
    description: "Internal tool: returns biomarker analysis data as JSON for inline rendering. Prefer generate-biomarker-report for user-facing requests.",
    schema: z.object({
      reportText: z.string(),
      markerName: z.string(),
      problem: z.string().optional(),
    }),
    annotations: { readOnlyHint: true },
  },
  async ({ reportText, markerName, problem }) => {
    // ... same GPT-4o analysis logic ...
    return text(JSON.stringify(reportData));
  }
);
```

Then in the widget use `useCallTool("get-biomarker-data")` and `JSON.parse()` the result.

This keeps `generate-biomarker-report` (with widget rendering) untouched for direct AI usage, while providing a clean data endpoint for widget consumption.

---

## Issues Found & Addressed in This Revision

| # | Issue | Status |
|---|-------|--------|
| 1 | `reportText` is now optional in `ProblemAnalysisProps` but required by `generate-biomarker-report` tool | Fixed — added `if (!reportText) return;` guard in Step 4 |
| 2 | Escape key handler didn't clear `biomarkerReport` state | Fixed — Step 3 |
| 3 | `onClose` callbacks didn't clear `biomarkerReport` state | Fixed — Step 5 |
| 4 | Toggling off a marker didn't clear `biomarkerReport` state | Fixed — Step 4 adds `setBiomarkerReport(null)` in toggle-off branch |
| 5 | List view missing inline report block | Fixed — Step 8 covers list view and suggests extracting shared component |
| 6 | Original fallback replaced human-readable output with JSON (breaks AI flow) | Fixed — new fallback Option A adds `structuredContent` alongside output; Option B uses a separate data-only tool |
| 7 | Component prop types not verified | Fixed — all 7 component interfaces verified against source files |

---

## Summary

| File | What Changes |
|------|-------------|
| `widget.tsx` | Import biomarker report types + 7 sub-components |
| `widget.tsx` | Add `biomarkerReport` state, use `callToolAsync` to fetch data |
| `widget.tsx` | Guard against `reportText` being `undefined` |
| `widget.tsx` | Clear `biomarkerReport` on escape, close, toggle-off, and marker switch |
| `widget.tsx` | Render full report inline in both chart and list views |
| `widget.tsx` | Extract `InlineBiomarkerReport` component to avoid duplication |
| `MarkerInfoCard.tsx` | Update "done" message text |
| `index.ts` | No changes (fallback only if `structuredContent` doesn't work) |

## Expected Behavior After Fix

1. User clicks a biomarker dot or label on the spider chart
2. The marker highlights (pulsing dot, status color); MarkerInfoCard slides in with spinner
3. `callToolAsync` fetches the deep-dive data in the background
4. When data arrives, the full biomarker report renders **inline below the spider chart** — with gauge, overview, analysis, causes, related markers, recommendations, and doctor section
5. User sees everything in one place without scrolling through chat
6. Clicking a different marker replaces the report; clicking same marker collapses it
7. Escape key or close button dismisses both the info card and the report
8. Spider chart remains fully visible and interactive throughout
