import { z } from "zod";

export const createCandidateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),

  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional(),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional(),

  location: z
    .string()
    .trim()
    .max(255)
    .optional(),

  status: z
    .enum([
      "new",
      "review",
      "shortlisted",
      "interview",
      "offer",
      "hired",
      "rejected",
      "archived",
    ])
    .default("new"),

  source: z
    .enum([
      "manual",
      "website",
      "indeed",
      "jobfind",
      "bulk_import",
      "other",
    ])
    .default("manual"),
});

export type CreateCandidateInput = z.infer<
  typeof createCandidateSchema
>;