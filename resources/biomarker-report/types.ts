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
export type MarkerOverview = z.infer<typeof markerOverviewSchema>;
export type ResultAnalysis = z.infer<typeof resultAnalysisSchema>;
export type CommonCauses = z.infer<typeof commonCausesSchema>;
export type RelatedMarker = z.infer<typeof relatedMarkerSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type DoctorSection = z.infer<typeof doctorSectionSchema>;
