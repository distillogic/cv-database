import { z } from "zod";

export const jobLevelSchema =
  z.enum([
    "junior",
    "senior",
    "expert",
  ]);

export const requirementTypeSchema =
  z.enum([
    "skill",
    "language",
    "education",
    "experience",
    "certification",
    "training",
    "driving_license",
  ]);

export const requirementImportanceSchema =
  z.enum([
    "required",
    "preferred",
  ]);

export const jobRequirementSchema =
  z.object({
    type:
      requirementTypeSchema,

    name:
      z.string()
        .trim()
        .min(1)
        .max(300),

    importance:
      requirementImportanceSchema
        .default("required"),

    weight:
      z.number()
        .positive()
        .max(100)
        .default(1),

    minimumLevel:
      z.string()
        .trim()
        .max(100)
        .nullable()
        .optional(),

    minimumYears:
      z.number()
        .min(0)
        .max(100)
        .nullable()
        .optional(),

    notes:
      z.string()
        .trim()
        .max(2000)
        .nullable()
        .optional(),
  })
  .strict();

export const createJobSchema =
  z.object({
    title:
      z.string()
        .trim()
        .min(1)
        .max(200),

    description:
      z.string()
        .trim()
        .max(10000)
        .nullable()
        .optional(),

    department:
      z.string()
        .trim()
        .max(150)
        .nullable()
        .optional(),

    location:
      z.string()
        .trim()
        .max(255)
        .nullable()
        .optional(),

    status:
      z.enum([
        "open",
        "paused",
        "closed",
      ])
        .default("open"),

    targetLevel:
      jobLevelSchema
        .default("junior"),

    requirements:
      z.array(
        jobRequirementSchema
      )
        .max(100)
        .default([]),
  })
  .strict();

export type CreateJobInput =
  z.infer<
    typeof createJobSchema
  >;