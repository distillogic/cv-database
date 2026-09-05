import { z } from "zod";

const evidenceSnippetSchema =
  z.string()
    .trim()
    .min(1)
    .max(500);

const evidenceSchema =
  z.array(evidenceSnippetSchema)
    .min(1)
    .max(3);

function normalizeNullableValue(
  value: unknown
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  const missingValues = new Set([
    "",
    "n/a",
    "na",
    "none",
    "null",
    "unknown",
    "not specified",
    "not provided",
    "δεν αναφέρεται",
    "δεν αναφερεται",
  ]);

  if (
    missingValues.has(
      trimmed.toLowerCase()
    )
  ) {
    return null;
  }

  return trimmed;
}

function nullableText(
  maxLength: number
) {
  return z.preprocess(
    normalizeNullableValue,
    z.string()
      .trim()
      .min(1)
      .max(maxLength)
      .nullable()
  );
}

const skillSchema =
  z.object({
    name:
      z.string()
        .trim()
        .min(1)
        .max(200),

    category:
      z.enum([
        "technical",
        "tool",
        "soft_skill",
        "marketing",
        "design",
        "methodology",
        "other",
      ]),

    evidence:
      evidenceSchema,
  })
  .strict();

const languageSchema =
  z.object({
    language:
      z.string()
        .trim()
        .min(1)
        .max(100),

    level:
      nullableText(100),

    evidence:
      evidenceSchema,
  })
  .strict();

const workExperienceSchema =
  z.object({
    role:
      z.string()
        .trim()
        .min(1)
        .max(200),

    organization:
      nullableText(250),

    dates:
      nullableText(150),

    evidence:
      evidenceSchema,
  })
  .strict();

const educationSchema =
  z.object({
    qualification:
      z.string()
        .trim()
        .min(1)
        .max(300),

    institution:
      nullableText(300),

    dates:
      nullableText(150),

    status:
      nullableText(150),

    grade:
      nullableText(100),

    evidence:
      evidenceSchema,
  })
  .strict();

const courseAndTrainingSchema =
  z.object({
    name:
      z.string()
        .trim()
        .min(1)
        .max(300),

    provider:
      nullableText(300),

    evidence:
      evidenceSchema,
  })
  .strict();

const certificationSchema =
  z.object({
    name:
      z.string()
        .trim()
        .min(1)
        .max(300),

    issuer:
      nullableText(300),

    evidence:
      evidenceSchema,
  })
  .strict();

const drivingLicenseSchema =
  z.object({
    category:
      z.string()
        .trim()
        .min(1)
        .max(50),

    evidence:
      evidenceSchema,
  })
  .strict();

export const resumeAnalysisSchema =
  z.object({
    skills:
      z.array(skillSchema)
        .max(100),

    languages:
      z.array(languageSchema)
        .max(50),

    workExperience:
      z.array(
        workExperienceSchema
      )
        .max(100),

    education:
      z.array(
        educationSchema
      )
        .max(100),

    coursesAndTraining:
      z.array(
        courseAndTrainingSchema
      )
        .max(100),

    certifications:
      z.array(
        certificationSchema
      )
        .max(100),

    drivingLicenses:
      z.array(
        drivingLicenseSchema
      )
        .max(30),
  })
  .strict();

export type ResumeAnalysis =
  z.infer<
    typeof resumeAnalysisSchema
  >;