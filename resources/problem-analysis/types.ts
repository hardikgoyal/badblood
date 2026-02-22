import { z } from "zod";

export const relevantMarkerSchema = z.object({
  name: z.string(),
  score: z.number(),
  value: z.string(),
  referenceRange: z.string(),
  status: z.enum(["normal", "borderline", "abnormal"]),
  relevanceNote: z.string(),
});

export const propSchema = z.object({
  problem: z.string(),
  relevantMarkers: z.array(relevantMarkerSchema),
  interpretation: z.string(),
  recommendations: z.array(z.string()),
  reportText: z.string(),
});

export type RelevantMarker = z.infer<typeof relevantMarkerSchema>;
export type ProblemAnalysisProps = z.infer<typeof propSchema>;

export interface MarkerAnalysis {
  headline: string;
  bodyContext: string;
  yourObservation: string;
  possibleCauses: string[];
  linkedSymptoms: string[];
  actionSteps: string[];
}
