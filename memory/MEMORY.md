# BadBlood Project Memory

## Project Overview
MCP server (`mcp-use`) for blood health analysis. Widgets rendered in ChatGPT/Claude.

## Tech Stack
- `mcp-use/server` for MCP tool/widget definitions
- `mcp-use/react` (`McpUseProvider`, `useWidget`) for widget components
- `@openai/apps-sdk-ui` (AppsSDKUIProvider, Link)
- Tailwind v4 + CSS variables for theming
- Recharts for the spider chart
- OpenAI GPT-4o for AI analysis

## Tools in index.ts
1. `generate-basic-report` → `blood-report-dashboard` widget
2. `generate-problem-analysis` → `problem-analysis` widget (spider chart)
3. `generate-biomarker-report` → `biomarker-report` widget (deep-dive; takes reportText + markerName + problem?)

## Widget Resources
- `resources/blood-report-dashboard/` — basic markers dashboard
- `resources/problem-analysis/` — spider chart + marker list
  - `components/SpiderChart.tsx` — has onMarkerClick prop
  - `components/MarkerInfoCard.tsx` — info card + clipboard CTA (shown on marker click)
  - `components/ChartSummary.tsx`, `RecommendationsList.tsx`
- `resources/biomarker-report/` — full 7-section clinical deep-dive
  - `types.ts` — all Zod schemas
  - `widget.tsx` — main widget shell
  - `components/ResultGauge.tsx`, `OverviewSection.tsx`, `AnalysisSection.tsx`,
    `CausesSection.tsx`, `RelatedMarkers.tsx`, `RecommendationsGrid.tsx`, `DoctorSection.tsx`

## Marker Click Flow (problem-analysis)
Spider chart marker click → `MarkerInfoCard` slides in below chart → user clicks
"🔬 Analyze {marker} in detail →" → prompt copied to clipboard → user pastes in chat →
AI calls `generate-biomarker-report` → `biomarker-report` widget renders as new message.

## Styling Conventions
- CSS variables: `var(--color-text-default)`, `var(--color-text-secondary)`, `var(--color-surface-elevated)`, `var(--color-border-default)`
- Status colors: normal=#16a34a, borderline=#d97706, abnormal=#dc2626
- Tailwind classes for layout; inline styles for dynamic/theme-sensitive values
- `bb-panel-fade` keyframe in `resources/styles.css` for card slide-in animation
