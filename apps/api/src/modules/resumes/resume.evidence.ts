import type {
  ResumeAnalysis,
} from "./resume.analysis.schema.js";

function normalizeForComparison(
  text: string
): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[•●▪◦]/g, " ")
    .replace(/[“”„«»]/g, "\"")
    .replace(/[’‘]/g, "'")
    .replace(
      /[^\p{L}\p{N}+#./,'-]+/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceExistsInResume(
  evidence: string,
  analysisText: string
): boolean {
  const normalizedEvidence =
    normalizeForComparison(
      evidence
    );

  const normalizedResume =
    normalizeForComparison(
      analysisText
    );

  if (!normalizedEvidence) {
    return false;
  }

  return normalizedResume.includes(
    normalizedEvidence
  );
}

function keepValidEvidence(
  evidence: string[],
  analysisText: string
): string[] {
  return evidence.filter(
    (snippet) =>
      evidenceExistsInResume(
        snippet,
        analysisText
      )
  );
}

function fieldSupportedByEvidence(
  value: string | null,
  evidence: string[]
): boolean {
  if (value === null) {
    return true;
  }

  const normalizedValue =
    normalizeForComparison(
      value
    );

  if (!normalizedValue) {
    return false;
  }

  return evidence.some(
    (snippet) =>
      normalizeForComparison(
        snippet
      ).includes(
        normalizedValue
      )
  );
}

function notNull<T>(
  value: T | null
): value is T {
  return value !== null;
}

function deduplicate<T>(
  items: T[],
  key: (item: T) => string
): T[] {
  const seen =
    new Set<string>();

  return items.filter(
    (item) => {
      const normalizedKey =
        normalizeForComparison(
          key(item)
        );

      if (
        seen.has(
          normalizedKey
        )
      ) {
        return false;
      }

      seen.add(
        normalizedKey
      );

      return true;
    }
  );
}

function validateSkills(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["skills"] {
  const validated =
    analysis.skills
      .map((skill) => {
        const evidence =
          keepValidEvidence(
            skill.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            skill.name,
            evidence
          )
        ) {
          return null;
        }

        return {
          ...skill,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) => item.name
  );
}

function validateLanguages(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["languages"] {
  const validated =
    analysis.languages
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.language,
            evidence
          )
        ) {
          return null;
        }

        const level =
          item.level !== null &&
          fieldSupportedByEvidence(
            item.level,
            evidence
          )
            ? item.level
            : null;

        return {
          ...item,
          level,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      item.language
  );
}

function validateWorkExperience(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["workExperience"] {
  const validated =
    analysis.workExperience
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.role,
            evidence
          )
        ) {
          return null;
        }

        const organization =
          item.organization !== null &&
          fieldSupportedByEvidence(
            item.organization,
            evidence
          )
            ? item.organization
            : null;

        const dates =
          item.dates !== null &&
          fieldSupportedByEvidence(
            item.dates,
            evidence
          )
            ? item.dates
            : null;

        return {
          ...item,
          organization,
          dates,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      `${item.role}|${item.organization ?? ""}`
  );
}

function validateEducation(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["education"] {
  const validated =
    analysis.education
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.qualification,
            evidence
          )
        ) {
          return null;
        }

        const institution =
          item.institution !== null &&
          fieldSupportedByEvidence(
            item.institution,
            evidence
          )
            ? item.institution
            : null;

        const dates =
          item.dates !== null &&
          fieldSupportedByEvidence(
            item.dates,
            evidence
          )
            ? item.dates
            : null;

        const status =
          item.status !== null &&
          fieldSupportedByEvidence(
            item.status,
            evidence
          )
            ? item.status
            : null;

        const grade =
          item.grade !== null &&
          fieldSupportedByEvidence(
            item.grade,
            evidence
          )
            ? item.grade
            : null;

        return {
          ...item,
          institution,
          dates,
          status,
          grade,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      `${item.qualification}|${item.institution ?? ""}`
  );
}

function validateCoursesAndTraining(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["coursesAndTraining"] {
  const validated =
    analysis.coursesAndTraining
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.name,
            evidence
          )
        ) {
          return null;
        }

        const provider =
          item.provider !== null &&
          fieldSupportedByEvidence(
            item.provider,
            evidence
          )
            ? item.provider
            : null;

        return {
          ...item,
          provider,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      `${item.name}|${item.provider ?? ""}`
  );
}

function validateCertifications(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["certifications"] {
  const validated =
    analysis.certifications
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.name,
            evidence
          )
        ) {
          return null;
        }

        const issuer =
          item.issuer !== null &&
          fieldSupportedByEvidence(
            item.issuer,
            evidence
          )
            ? item.issuer
            : null;

        return {
          ...item,
          issuer,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      `${item.name}|${item.issuer ?? ""}`
  );
}

function validateDrivingLicenses(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis["drivingLicenses"] {
  const validated =
    analysis.drivingLicenses
      .map((item) => {
        const evidence =
          keepValidEvidence(
            item.evidence,
            analysisText
          );

        if (
          evidence.length === 0 ||
          !fieldSupportedByEvidence(
            item.category,
            evidence
          )
        ) {
          return null;
        }

        return {
          ...item,
          evidence,
        };
      })
      .filter(notNull);

  return deduplicate(
    validated,
    (item) =>
      item.category
  );
}

export function validateResumeEvidence(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis {
  return {
    skills:
      validateSkills(
        analysis,
        analysisText
      ),

    languages:
      validateLanguages(
        analysis,
        analysisText
      ),

    workExperience:
      validateWorkExperience(
        analysis,
        analysisText
      ),

    education:
      validateEducation(
        analysis,
        analysisText
      ),

    coursesAndTraining:
      validateCoursesAndTraining(
        analysis,
        analysisText
      ),

    certifications:
      validateCertifications(
        analysis,
        analysisText
      ),

    drivingLicenses:
      validateDrivingLicenses(
        analysis,
        analysisText
      ),
  };
}