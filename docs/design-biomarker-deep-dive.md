# Feature Design Doc: Biomarker Click-to-Explore + Deep-Dive Report

**Author:** BadBlood Engineering
**Status:** Draft
**Date:** 2026-02-21
**Scope:** SpiderChart interaction + new MCP tool + new widget

---

## 1. Problem Statement

The SpiderChart maps a patient's biomarkers to a health condition, but it's purely passive. A patient sees their Vitamin D score at 35/100 and naturally asks: *What does this marker actually do? Why is my value bad? What can I do about it?*

Today there's no way to drill in. The hover tooltip shows raw numbers but no intelligence. The detail list tab has slightly more, but loses the spatial context of the radar shape.

**This feature turns every biomarker on the spider chart into a doorway to a full, dedicated clinical report.**

---

## 2. Feature Overview

The feature has two parts:

### Part A: SpiderChart Click Interaction
Clicking a biomarker dot or axis label on the spider chart visually highlights it and surfaces a call-to-action that guides the user to request the deep-dive report.

### Part B: Biomarker Report (New MCP Tool + Widget)
A new `generate-biomarker-report` tool produces a full-page clinical deep-dive widget for a single biomarker, with seven sections covering everything from "what is this marker" to "when to see a doctor."

### User Flow

```
                     Spider Chart Widget
                    ┌─────────────────────┐
                    │      ╱╲             │
                    │    ╱    ╲           │
                    │  ●────────●         │
                    │    ╲    ╱           │
                    │      ╲╱             │
                    │                     │
                    │  User clicks a dot  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Dot pulses +       │
                    │  Info card appears  │
                    │                     │
                    │  "Analyze Vitamin D │
                    │   in detail →"      │
                    └──────────┬──────────┘
                               │
                    User asks AI to analyze
                               │
                               ▼
                    ┌─────────────────────┐
                    │  AI calls           │
                    │  generate-biomarker │
                    │  -report tool       │
                    └──────────┬──────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │   BIOMARKER REPORT WIDGET     │
               │   (full dedicated UI)         │
               │                               │
               │   Range Gauge                 │
               │   What Is This Marker?        │
               │   Your Result Analysis        │
               │   Common Causes               │
               │   Related Markers             │
               │   Food & Lifestyle            │
               │   When to See a Doctor        │
               └───────────────────────────────┘
```

---

## 3. Part A: SpiderChart Click Interaction

### 3.1 State Machine

```
                    click dot/label
    ┌─────────┐  ───────────────────▶  ┌─────────────┐
    │  IDLE   │                         │  SELECTED   │
    │         │  ◀───────────────────  │  marker: X  │
    └─────────┘   click same / Escape   └─────────────┘
                                              │
                                              │ click different marker Y
                                              ▼
                                        ┌─────────────┐
                                        │  SELECTED   │
                                        │  marker: Y  │
                                        └─────────────┘
```

**State:** Single `selectedMarkerName: string | null` in SpiderChart component.

### 3.2 Click Targets

| Target | Element | Current | New |
|--------|---------|---------|-----|
| Axis label | SVG `<text>` in `renderAxisTick` | `cursor: default`, hover only | `cursor: pointer`, `onClick` → `handleMarkerClick` |
| Radar dot | `<circle>` via `dot` prop on `<Radar>` | Static `r=4`, no interaction | Custom render function with `onClick` |

### 3.3 Dot Highlight Animation

**Idle (no selection):**
All dots: `r=4`, `fill=#6366f1`, `opacity=1`

**Selection active:**
- Selected dot: `transform: scale(2)` (effectively `r=8`), plays `bb-dot-pulse` animation (2 iterations, 1.4s each)
- Unselected dots: `opacity: 0.3`, `transition: opacity 0.2s ease`
- Selected axis label: `fontWeight: 700`, `textDecoration: underline`

```css
@keyframes bb-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.25); opacity: 0.7; }
}
```

Uses `transform: scale()` instead of animating SVG `r` because Safari doesn't support CSS transitions on SVG geometric attributes.

### 3.4 Info Card (Below Chart)

When a marker is selected, a compact info card slides in below the chart:

```
┌───────────────────────────────────────────────┐
│  Vitamin D              ● Abnormal    35/100  │
│                                               │
│  Your value: 18 ng/mL · Ref: 30–100 ng/mL    │
│                                               │
│  ▎ Vitamin D deficiency is directly linked    │
│  ▎ to musculoskeletal pain and fatigue.       │
│                                               │
│        ┌─────────────────────────────┐        │
│        │  🔬 Analyze Vitamin D →     │        │
│        │     in detail               │        │
│        └─────────────────────────────┘        │
└───────────────────────────────────────────────┘
```

The card includes:
- Marker name + status badge + score (from existing data, no AI call)
- Raw value + reference range
- Relevance note (already in the data)
- **CTA button**: "Analyze {markerName} in detail →"

**CTA behavior:** The button copies a prompt to the user's clipboard: `"Analyze my {markerName} marker in detail based on my blood report"`. This nudges the user to paste it into the AI chat, which triggers the `generate-biomarker-report` tool. (MCP widgets can't invoke tools directly — the AI assistant is the tool orchestrator.)

**Card transition:**
```css
max-height: 0 → 220px  (300ms ease)
opacity: 0 → 1          (250ms ease)
```

Cross-fade on marker switch via `key={marker.name}` + `bb-panel-fade` animation.

### 3.5 Hover + Click Coexistence

- Hover and click are independent states
- Clicking dismisses the hover tooltip (`setTooltip(null)`)
- Hovering a different label while a marker is selected still shows the tooltip
- Pattern: hover = preview, click = commit

### 3.6 Keyboard

- **Escape** key dismisses selection

---

## 4. Part B: Biomarker Report (New Tool + Widget)

### 4.1 MCP Tool Definition

**Tool name:** `generate-biomarker-report`

**Description:** "Generate a comprehensive clinical deep-dive report for a specific blood biomarker. Shows what the marker measures, analyzes the patient's result, lists common causes of abnormality, identifies related markers, and provides food/lifestyle recommendations."

**Input schema:**
```typescript
z.object({
  reportText: z.string()
    .describe("Raw text content from the blood test report"),
  markerName: z.string()
    .describe("Name of the specific biomarker to analyze, e.g. 'Vitamin D', 'TSH', 'Hemoglobin A1c'"),
  problem: z.string().optional()
    .describe("Optional health concern for context, e.g. 'chronic fatigue', 'back pain'"),
})
```

**Why `reportText` again?** The tool needs the full report to:
1. Re-extract the target marker's exact value and reference range
2. Find related markers from the same report (e.g., if analyzing LDL, pull in HDL, Total Cholesterol, Triglycerides)

### 4.2 AI Pipeline

**Step 1:** Call `extractBloodMarkers(reportText)` (reuse existing function from `index.ts`)

**Step 2:** Find the target marker in the extracted data by matching `markerName`

**Step 3:** Call GPT-4o with a specialized prompt that generates all seven report sections:

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  messages: [
    {
      role: "system",
      content: `You are a clinical pathology educator. Given a specific blood biomarker
result and the patient's full panel, generate a comprehensive report.

Return JSON with:
- "markerOverview": {
    "fullName": string,          // e.g. "25-Hydroxyvitamin D"
    "commonName": string,        // e.g. "Vitamin D"
    "whatItMeasures": string,    // 2-3 sentences
    "organsInvolved": string[],  // e.g. ["Bones", "Immune system", "Muscles"]
    "whyItMatters": string       // 2-3 sentences
  }
- "resultAnalysis": {
    "value": number,
    "unit": string,
    "referenceRangeLow": number | null,
    "referenceRangeHigh": number | null,
    "referenceRangeText": string,
    "status": "normal" | "borderline" | "abnormal",
    "score": number,             // 0-100 health score
    "interpretation": string,    // 3-4 sentences personalized to this value
    "severity": "optimal" | "mild" | "moderate" | "significant"
  }
- "commonCauses": {
    "ifHigh": string[],          // 3-5 common causes if value is high
    "ifLow": string[]            // 3-5 common causes if value is low
  }
- "relatedMarkers": array of {
    "name": string,
    "value": string,             // from the patient's report
    "status": "normal" | "borderline" | "abnormal",
    "relationship": string       // 1 sentence: how this relates
  }  (3-6 markers from the same report that are clinically related)
- "foodAndLifestyle": array of {
    "category": "food" | "supplement" | "lifestyle" | "avoid",
    "title": string,             // e.g. "Fatty fish (salmon, mackerel)"
    "detail": string             // 1-2 sentences
  }  (5-8 recommendations)
- "whenToSeeDoctor": {
    "urgency": "routine" | "soon" | "urgent",
    "reasoning": string,         // 2-3 sentences
    "questionsToAsk": string[]   // 3-4 specific questions for the doctor
  }`
    },
    {
      role: "user",
      content: `Analyze this biomarker:\n\nTarget: ${markerName}\n\nFull panel:\n${JSON.stringify(markers, null, 2)}`
    }
  ]
});
```

### 4.3 Widget: `biomarker-report`

**New directory:** `resources/biomarker-report/`

```
resources/biomarker-report/
├── types.ts                          # Zod schemas for all seven sections
├── widget.tsx                        # Main widget with section layout
└── components/
    ├── ResultGauge.tsx               # Range gauge with gradient + needle + gap indicator
    ├── OverviewSection.tsx           # "What is this marker?" with organ tags
    ├── AnalysisSection.tsx           # Personalized result interpretation
    ├── CausesSection.tsx             # Common causes (if high / if low) — two columns
    ├── RelatedMarkers.tsx            # Mini cards for related markers from the report
    ├── RecommendationsGrid.tsx       # Food/supplement/lifestyle grid with category icons
    └── DoctorSection.tsx             # Urgency badge + reasoning + questions to ask
```

### 4.4 Widget Layout (ASCII Mockup)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  BIOMARKER REPORT                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Vitamin D (25-Hydroxyvitamin D)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    RESULT GAUGE                        │  │
│  │                                                        │  │
│  │        35/100                                          │  │
│  │                                                        │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │
│  │  red   amber   green▲optimal   amber      red         │  │
│  │               ───────┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈▶ +65 pts     │  │
│  │                                                        │  │
│  │  Your value: 18 ng/mL        Ref: 30–100 ng/mL        │  │
│  │  Status: ● Abnormal           Severity: Moderate       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ── What Is Vitamin D? ──────────────────────────────────    │
│                                                              │
│  Vitamin D is a fat-soluble vitamin that your body           │
│  produces when skin is exposed to sunlight. It is            │
│  essential for calcium absorption and bone health...         │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  🦴      │ │  🛡️      │ │  💪      │ │  🧠      │       │
│  │  Bones   │ │  Immune  │ │  Muscles │ │  Mood    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ── Your Result ─────────────────────────────────────────    │
│                                                              │
│  At 18 ng/mL, your Vitamin D is significantly below the     │
│  optimal range of 30–100 ng/mL. This level is classified    │
│  as deficient by most clinical standards. In the context     │
│  of your chronic fatigue, low Vitamin D is a well-known      │
│  contributor to persistent tiredness and muscle weakness...  │
│                                                              │
│  ── Common Causes ───────────────────────────────────────    │
│                                                              │
│  If LOW                         │  If HIGH                   │
│  ───────────────────────────────┤──────────────────────────  │
│  • Limited sun exposure         │  • Excessive                │
│  • Dark skin pigmentation       │    supplementation          │
│  • Malabsorption disorders      │  • Granulomatous disease   │
│  • Kidney or liver disease      │  • Lymphoma                │
│  • Certain medications          │                            │
│                                                              │
│  ── Related Markers From Your Report ────────────────────    │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Calcium      │ │ Phosphorus   │ │ PTH          │        │
│  │ 9.2 mg/dL   │ │ 3.8 mg/dL   │ │ 72 pg/mL     │        │
│  │ ● Normal    │ │ ● Normal    │ │ ● Borderline │        │
│  │             │ │             │ │              │        │
│  │ Works with  │ │ Balance is  │ │ Elevated PTH │        │
│  │ Vit D for   │ │ regulated   │ │ often        │        │
│  │ bone health │ │ by Vit D    │ │ compensates  │        │
│  │             │ │             │ │ for low D    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ── What You Can Do ─────────────────────────────────────    │
│                                                              │
│  🐟 FOOD                                                     │
│  Fatty fish (salmon, mackerel, sardines) — richest           │
│  natural source, aim for 2-3 servings per week               │
│                                                              │
│  💊 SUPPLEMENT                                                │
│  Vitamin D3 2000-4000 IU daily — D3 is better absorbed      │
│  than D2, take with a fat-containing meal                    │
│                                                              │
│  ☀️ LIFESTYLE                                                 │
│  15-20 minutes of midday sun exposure on arms and face,      │
│  without sunscreen, 3-4 times per week                       │
│                                                              │
│  🚫 AVOID                                                    │
│  Excessive alcohol — impairs Vitamin D metabolism and         │
│  liver conversion of D to its active form                    │
│                                                              │
│  ── When to See a Doctor ────────────────────────────────    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐      │
│  │  ⚡ SOON — Schedule within 2-4 weeks               │      │
│  │                                                    │      │
│  │  Your Vitamin D at 18 ng/mL is in the deficient   │      │
│  │  range. While not an emergency, persistent         │      │
│  │  deficiency can lead to bone density loss...       │      │
│  │                                                    │      │
│  │  Questions to ask your doctor:                     │      │
│  │  1. Should I get a follow-up test in 3 months?    │      │
│  │  2. What dosage of D3 do you recommend for me?    │      │
│  │  3. Should we check my PTH and calcium levels?    │      │
│  │  4. Could my medications affect absorption?       │      │
│  └────────────────────────────────────────────────────┘      │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  For informational purposes only. Always consult a           │
│  qualified healthcare professional.                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 ResultGauge (SVG)

```
SVG viewBox: "0 0 300 72"
Width: 100% (fluid)

y=0   ┌─ Score display: "{score}/100" (fontSize 18, bold, statusColor)
y=24  ├─ Needle: downward triangle, 8px wide
y=30  ├─ Gradient track: rounded rect, height 14, rx 7
y=44  ├─ Track bottom
y=48  ├─ Tick labels: "0" | "25" | "50" | "75" | "100"
y=58  ├─ Gap indicator: dashed line + "+N pts to optimal" (if score < 95)
y=72  └─ Bottom
```

**Gradient stops:**

| Offset | Color | Hex |
|--------|-------|-----|
| 0% | Red | `#ef4444` |
| 25% | Amber | `#f59e0b` |
| 50% | Green | `#22c55e` |
| 75% | Amber | `#f59e0b` |
| 100% | Red | `#ef4444` |

**Needle:** Triangle `<polygon>` at `x = (score/100) * trackWidth`, `fill: statusColor`

**Gap-to-optimal:** Dashed line from needle to x=100% position, `strokeDasharray: "3 3"`, label centered above.

### 5.2 OverviewSection

```
┌──────────────────────────────────────────┐
│  What Is {commonName}?                   │
│                                          │
│  {whatItMeasures}                        │
│  {whyItMatters}                          │
│                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │icon│ │icon│ │icon│ │icon│  ← organs  │
│  │name│ │name│ │name│ │name│            │
│  └────┘ └────┘ └────┘ └────┘           │
└──────────────────────────────────────────┘
```

**Organ icon mapping:**

| Organ | Icon |
|-------|------|
| Bones | 🦴 |
| Liver | 🫀 |
| Kidneys | 🫘 |
| Heart | ❤️ |
| Immune system | 🛡️ |
| Muscles | 💪 |
| Brain / Mood | 🧠 |
| Thyroid | 🦋 |
| Fallback | 🔬 |

Each organ is a small pill/chip with icon + name, laid out with `flex-wrap`.

### 5.3 AnalysisSection

Simple text section with the `interpretation` paragraph. The `severity` is shown as a colored badge:

| Severity | Color | Badge Style |
|----------|-------|-------------|
| `optimal` | Green `#22c55e` | `bg-green-100 text-green-800` |
| `mild` | Amber `#f59e0b` | `bg-amber-100 text-amber-800` |
| `moderate` | Orange `#f97316` | `bg-orange-100 text-orange-800` |
| `significant` | Red `#ef4444` | `bg-red-100 text-red-800` |

### 5.4 CausesSection

Two-column layout (`grid-cols-2` on desktop, stacked on mobile):
- Left column: "If Low" with a blue/cool header
- Right column: "If High" with an orange/warm header
- Each cause is a bullet point

The column matching the patient's actual status (low vs high) is highlighted. The non-relevant column is slightly dimmed (`opacity: 0.5`).

### 5.5 RelatedMarkers

Horizontal scrollable row of mini cards (or flex-wrap grid). Each card:

```
┌──────────────┐
│ Marker Name  │
│ Value Unit   │
│ ● Status     │
│              │
│ Relationship │
│ sentence     │
└──────────────┘
```

Status badge uses the standard `statusConfig` pattern (green/amber/red backgrounds with matching text).

### 5.6 RecommendationsGrid

Categorized list with icons:

| Category | Icon | Description |
|----------|------|-------------|
| `food` | 🐟/🥬 | Dietary sources |
| `supplement` | 💊 | Supplementation guidance |
| `lifestyle` | ☀️/🏃 | Behavioral changes |
| `avoid` | 🚫 | Things to stop/reduce |

Each item: icon + title (bold) + detail sentence. Cards in a vertical stack with `rounded-xl border border-default` styling.

### 5.7 DoctorSection

```
┌────────────────────────────────────────┐
│  {urgencyBadge}                        │
│                                        │
│  {reasoning paragraph}                 │
│                                        │
│  Questions to ask your doctor:         │
│  1. {question}                         │
│  2. {question}                         │
│  3. {question}                         │
└────────────────────────────────────────┘
```

**Urgency badges:**

| Level | Color | Label |
|-------|-------|-------|
| `routine` | Green | "Routine — mention at next visit" |
| `soon` | Amber | "Soon — schedule within 2-4 weeks" |
| `urgent` | Red | "Urgent — see a doctor this week" |

---

## 6. Data Types

### 6.1 Zod Schemas (`biomarker-report/types.ts`)

```typescript
import { z } from "zod";

export const markerOverviewSchema = z.object({
  fullName: z.string(),
  commonName: z.string(),
  whatItMeasures: z.string(),
  organsInvolved: z.array(z.string()),
  whyItMatters: z.string(),
});

export const resultAnalysisSchema = z.object({
  value: z.number(),
  unit: z.string(),
  referenceRangeLow: z.number().nullable(),
  referenceRangeHigh: z.number().nullable(),
  referenceRangeText: z.string(),
  status: z.enum(["normal", "borderline", "abnormal"]),
  score: z.number(),
  interpretation: z.string(),
  severity: z.enum(["optimal", "mild", "moderate", "significant"]),
});

export const commonCausesSchema = z.object({
  ifHigh: z.array(z.string()),
  ifLow: z.array(z.string()),
});

export const relatedMarkerSchema = z.object({
  name: z.string(),
  value: z.string(),
  status: z.enum(["normal", "borderline", "abnormal"]),
  relationship: z.string(),
});

export const recommendationSchema = z.object({
  category: z.enum(["food", "supplement", "lifestyle", "avoid"]),
  title: z.string(),
  detail: z.string(),
});

export const doctorSectionSchema = z.object({
  urgency: z.enum(["routine", "soon", "urgent"]),
  reasoning: z.string(),
  questionsToAsk: z.array(z.string()),
});

export const propSchema = z.object({
  overview: markerOverviewSchema,
  result: resultAnalysisSchema,
  causes: commonCausesSchema,
  relatedMarkers: z.array(relatedMarkerSchema),
  recommendations: z.array(recommendationSchema),
  doctor: doctorSectionSchema,
  problem: z.string().optional(),
});

export type BiomarkerReportProps = z.infer<typeof propSchema>;
```

---

## 7. Files Changed / Created

### New Files

| File | Purpose | Est. Lines |
|------|---------|------------|
| `resources/biomarker-report/types.ts` | Zod schemas for report data | ~65 |
| `resources/biomarker-report/widget.tsx` | Main widget shell + skeleton loading | ~100 |
| `resources/biomarker-report/components/ResultGauge.tsx` | SVG range gauge with needle + gap | ~90 |
| `resources/biomarker-report/components/OverviewSection.tsx` | "What is this marker?" with organ chips | ~60 |
| `resources/biomarker-report/components/AnalysisSection.tsx` | Personalized result interpretation | ~35 |
| `resources/biomarker-report/components/CausesSection.tsx` | Two-column causes (if high / if low) | ~55 |
| `resources/biomarker-report/components/RelatedMarkers.tsx` | Mini cards for related markers | ~65 |
| `resources/biomarker-report/components/RecommendationsGrid.tsx` | Categorized food/lifestyle grid | ~70 |
| `resources/biomarker-report/components/DoctorSection.tsx` | Urgency badge + questions to ask | ~60 |
| `resources/problem-analysis/components/MarkerInfoCard.tsx` | Compact info card for spider chart selection | ~80 |

### Modified Files

| File | Change | Est. Lines Changed |
|------|--------|-------------------|
| `index.ts` | Add `generate-biomarker-report` tool definition + AI pipeline | ~100 |
| `resources/problem-analysis/components/SpiderChart.tsx` | Add selection state, click handlers, custom dot renderer, render MarkerInfoCard | ~60 |
| `resources/styles.css` | Add `bb-dot-pulse` and `bb-panel-fade` keyframes | ~15 |

### Unchanged Files

`resources/problem-analysis/widget.tsx`, `types.ts`, `ChartSummary.tsx`, `RecommendationsList.tsx`, `resources/blood-report-dashboard/*`, `package.json`

**Estimated total:** ~855 new lines + ~175 modified lines

---

## 8. Implementation Phases

### Phase 1: SpiderChart Click Interaction
**Files:** `SpiderChart.tsx`, `MarkerInfoCard.tsx`, `styles.css`

1. Add `bb-dot-pulse` and `bb-panel-fade` CSS keyframes to `styles.css`
2. Create `MarkerInfoCard.tsx` — compact card with marker info + CTA button
3. Add `selectedMarkerName` state to `SpiderChart.tsx`
4. Add `onClick` to `renderAxisTick` (axis labels become clickable)
5. Replace `dot` prop on `<Radar>` with custom render function (dots become clickable)
6. Set `activeDot={false}` on `<Radar>` to suppress default hover dot
7. Render `<MarkerInfoCard>` below the chart container
8. Add `useEffect` for Escape key listener

### Phase 2: Biomarker Report Widget
**Files:** `resources/biomarker-report/*`

9. Create `types.ts` with all Zod schemas
10. Create `ResultGauge.tsx` — pure SVG component
11. Create `OverviewSection.tsx`
12. Create `AnalysisSection.tsx`
13. Create `CausesSection.tsx`
14. Create `RelatedMarkers.tsx`
15. Create `RecommendationsGrid.tsx`
16. Create `DoctorSection.tsx`
17. Create `widget.tsx` — assemble all sections with skeleton loading

### Phase 3: MCP Tool
**File:** `index.ts`

18. Add `generate-biomarker-report` tool definition with input schema
19. Implement AI pipeline (extract markers → find target → GPT-4o deep analysis)
20. Wire to `biomarker-report` widget with props

### Phase 4: Polish

21. Dark mode audit across all new components
22. Mobile layout testing
23. Verify hover tooltip still works on spider chart
24. Test rapid marker switching
25. Test edge cases (marker not found, all-normal report, single marker)

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Marker not found in report | Tool returns error: "Could not find {name} in the report." |
| No related markers found | RelatedMarkers section hidden |
| All markers normal | DoctorSection urgency = "routine", CausesSection shows both columns undimmed |
| Score = 100 | Gap indicator hidden, severity = "optimal" |
| Score = 0 | Needle at far left, severity = "significant" |
| Very long marker name | Truncate with ellipsis in widget header |
| `problem` not provided | AI analysis omits condition-specific context, sections focus on the marker alone |
| CTA clipboard copy fails | Fallback: display the prompt as selectable text |

---

## 10. Dark Mode

All new components follow the existing codebase pattern:

- Surface/text colors via CSS variables: `var(--color-surface-elevated)`, `var(--color-text-default)`, `var(--color-text-secondary)`, `var(--color-border-default)`
- Status colors (red/amber/green) are absolute — they don't invert in dark mode
- Gauge gradient uses the standard Tailwind `-500` color variants
- Organ chips use `bg-info/15` (existing pattern from `RecommendationsList`)

---

## 11. Technical Notes

### Recharts v3 Custom Dot Rendering

Recharts v3 passes `(props: DotProps & { payload: DataEntry })` to the dot render function. The `payload` object maps to the data array entry — so `props.payload.subject` gives the marker name. Set `activeDot={false}` on `<Radar>` to prevent Recharts from rendering its own hover dot on top of the custom dot.

### SVG Animation (Safari Compatibility)

Safari does not support CSS transitions on SVG geometric attributes like `r`. Use `transform: scale(...)` with `transform-origin` at the center point instead. This is universally supported across all browsers.

### MCP Widget → Tool Communication

MCP widgets (rendered as iframes) cannot directly invoke MCP tools. The CTA button in the info card copies a prompt to the clipboard. The user pastes it into the AI chat, which triggers the `generate-biomarker-report` tool. This is the standard MCP-native interaction pattern.

---

## 12. Verification Plan

1. `npm run dev` → open `http://localhost:3000/inspector`
2. Invoke `generate-problem-analysis` with a sample blood report + "chronic fatigue"
3. **Spider chart regression:** hover axis labels → tooltip still works
4. **Click selection:** click a dot or label → dot pulses, info card slides in with correct data
5. **CTA:** click "Analyze {marker} in detail →" → prompt copied to clipboard
6. **Switch markers:** click different marker → card cross-fades
7. **Dismiss:** click same marker again → card collapses; press Escape → same
8. Invoke `generate-biomarker-report` with `markerName: "Vitamin D"` and same report text
9. **Widget renders:** all 7 sections visible with correct data
10. **Gauge:** needle at correct position, gap indicator shows correct delta
11. **Causes:** correct column highlighted for the patient's actual status
12. **Related markers:** pulls real markers from the same report
13. **Doctor section:** urgency badge matches severity
14. **Dark mode:** toggle `.dark` class → all sections render correctly
15. **Mobile:** resize to < 400px → no layout breaks, causes stack vertically
