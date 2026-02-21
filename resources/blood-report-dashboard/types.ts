import { z } from "zod";

export const bloodMarkerSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceRangeLow: z.number().nullable(),
  referenceRangeHigh: z.number().nullable(),
  referenceRangeText: z.string(),
  status: z.enum(["normal", "borderline", "abnormal"]),
  category: z.enum([
    "CBC",
    "Lipids",
    "Thyroid",
    "Liver",
    "Kidney",
    "Vitamins",
    "Metabolic",
    "Hormones",
    "Other",
  ]),
});

export const propSchema = z.object({
  markers: z.array(bloodMarkerSchema),
  extractedAt: z.string(),
  patientInfo: z
    .object({
      name: z.string().optional(),
      date: z.string().optional(),
    })
    .optional(),
});

export type BloodMarker = z.infer<typeof bloodMarkerSchema>;
export type BloodReportDashboardProps = z.infer<typeof propSchema>;
