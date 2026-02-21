import { MCPServer, text, widget, error } from "mcp-use/server";
import { z } from "zod";
import OpenAI from "openai";

const server = new MCPServer({
  name: "blood-health-app",
  title: "Blood Health Visualizer",
  version: "1.0.0",
  description: "Visualize and analyze your blood test results with AI-powered insights",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured. Please set it in your environment variables.");
  return new OpenAI({ apiKey });
}

async function extractBloodMarkers(reportText: string) {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a medical data parser. Extract ALL blood test markers from blood test report text.

Return a JSON object with:
- "markers": array of all markers found, each with:
  - name: string (marker name, e.g. "Hemoglobin", "Total Cholesterol", "TSH")
  - value: number (numeric value only)
  - unit: string (e.g. "g/dL", "mg/dL", "mmol/L", "IU/L", "ng/mL")
  - referenceRangeLow: number | null (lower bound of normal range)
  - referenceRangeHigh: number | null (upper bound of normal range)
  - referenceRangeText: string (the range as written, e.g. "3.5–5.0" or "> 60")
  - status: "normal" | "borderline" | "abnormal"
    - "abnormal" if flagged H/L/HIGH/LOW or outside reference range
    - "borderline" if within 10% of a range limit
    - "normal" otherwise
  - category: one of "CBC" | "Lipids" | "Thyroid" | "Liver" | "Kidney" | "Vitamins" | "Metabolic" | "Hormones" | "Other"

- "patientInfo": { name?: string, date?: string } (extract if visible in the report)

Be thorough — extract every measurable marker you find.`,
      },
      {
        role: "user",
        content: `Extract all blood markers from this report:\n\n${reportText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response received from OpenAI");

  const parsed = JSON.parse(content);
  return {
    markers: (parsed.markers ?? []) as any[],
    patientInfo: (parsed.patientInfo ?? {}) as { name?: string; date?: string },
  };
}

async function analyzeForProblem(reportText: string, problem: string) {
  const openai = getOpenAI();

  // Step 1: extract markers
  const { markers } = await extractBloodMarkers(reportText);

  // Step 2: problem-specific analysis
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a medical analyst specializing in interpreting blood tests in the context of specific health concerns.

Given blood markers and a health concern, return a JSON object with:
- "relevantMarkers": array of 4–8 most relevant markers, each with:
  - name: string
  - score: number (0–100: 100 = perfectly optimal, 70–99 = normal, 40–69 = borderline, 0–39 = abnormal)
  - value: string (e.g. "18 ng/mL")
  - referenceRange: string (e.g. "30–100 ng/mL")
  - status: "normal" | "borderline" | "abnormal"
  - relevanceNote: string (one sentence: why this marker matters for the stated condition)
- "interpretation": string (3–4 sentence narrative connecting the markers to the condition)
- "recommendations": string[] (3–5 specific, actionable recommendations)

Scoring guide:
- 95–100: dead center of optimal range
- 70–94: within normal range
- 40–69: borderline (close to limit or mildly outside)
- 0–39: clearly abnormal`,
      },
      {
        role: "user",
        content: `Health concern: ${problem}\n\nBlood markers:\n${JSON.stringify(markers, null, 2)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response received from OpenAI");

  const parsed = JSON.parse(content);
  return {
    markers,
    relevantMarkers: (parsed.relevantMarkers ?? []) as any[],
    interpretation: (parsed.interpretation ?? "") as string,
    recommendations: (parsed.recommendations ?? []) as string[],
  };
}

// ─── Tool 1: Basic blood report dashboard ────────────────────────────────────

server.tool(
  {
    name: "generate-basic-report",
    description:
      "Parse a blood test report and display a visual health dashboard with all markers color-coded by status. Use this after the user uploads or pastes a blood test report.",
    schema: z.object({
      reportText: z
        .string()
        .describe(
          "Raw text content from the blood test report. Include all marker names, values, units, and reference ranges exactly as they appear."
        ),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
    widget: {
      name: "blood-report-dashboard",
      invoking: "Analyzing your blood report...",
      invoked: "Blood report ready",
    },
  },
  async ({ reportText }) => {
    try {
      if (!reportText.trim()) {
        return error("Report text cannot be empty. Please provide the blood test report content.");
      }

      const { markers, patientInfo } = await extractBloodMarkers(reportText);

      if (markers.length === 0) {
        return error(
          "No blood markers could be extracted. Please ensure the text contains marker names, values, and reference ranges."
        );
      }

      const normal = markers.filter((m: any) => m.status === "normal").length;
      const borderline = markers.filter((m: any) => m.status === "borderline").length;
      const abnormal = markers.filter((m: any) => m.status === "abnormal").length;

      return widget({
        props: { markers, extractedAt: new Date().toISOString(), patientInfo },
        output: text(
          `Blood report analyzed. Found ${markers.length} markers: ${normal} normal, ${borderline} borderline, ${abnormal} abnormal.`
        ),
      });
    } catch (err) {
      console.error("Error generating blood report:", err);
      return error(
        `Failed to analyze report: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }
);

// ─── Tool 2: Problem-specific analysis with spider chart ─────────────────────

server.tool(
  {
    name: "generate-problem-analysis",
    description:
      "Analyze which blood markers are relevant to a specific health problem (e.g. 'back pain', 'fatigue', 'joint inflammation') and display a spider/radar chart showing how each marker scores. Use this when the user wants to understand how their blood work relates to a specific symptom or condition.",
    schema: z.object({
      reportText: z
        .string()
        .describe("Raw text content from the blood test report"),
      problem: z
        .string()
        .describe(
          "Specific health concern to analyze, e.g. 'back pain', 'chronic fatigue', 'joint inflammation', 'poor sleep', 'hair loss', 'brain fog'"
        ),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
    widget: {
      name: "problem-analysis",
      invoking: "Mapping your markers to your condition...",
      invoked: "Problem analysis ready",
    },
  },
  async ({ reportText, problem }) => {
    try {
      if (!reportText.trim()) {
        return error("Report text cannot be empty.");
      }
      if (!problem.trim()) {
        return error(
          "Please specify a health concern (e.g., 'back pain', 'fatigue')."
        );
      }

      const { relevantMarkers, interpretation, recommendations } =
        await analyzeForProblem(reportText, problem);

      if (relevantMarkers.length === 0) {
        return error(
          `No relevant markers found for "${problem}". The blood report may not contain markers related to this condition.`
        );
      }

      return widget({
        props: { problem, relevantMarkers, interpretation, recommendations },
        output: text(
          `Analysis complete for "${problem}". ${relevantMarkers.length} relevant markers identified. ${interpretation.substring(0, 200)}...`
        ),
      });
    } catch (err) {
      console.error("Error generating problem analysis:", err);
      return error(
        `Failed to analyze: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }
);

server.listen().then(() => {
  console.log("Blood Health Visualizer running");
});
