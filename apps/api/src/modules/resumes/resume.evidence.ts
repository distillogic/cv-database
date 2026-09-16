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

const leisureHeadingPatterns = [
  /^hobbies?$/i,
  /^interests?$/i,
  /^personal interests?$/i,
  /^leisure(?: activities)?$/i,
  /^activities$/i,
  /^χόμπι$/i,
  /^χομπι$/i,
  /^ενδιαφέροντα$/i,
  /^ενδιαφεροντα$/i,
  /^προσωπικά ενδιαφέροντα$/i,
  /^προσωπικα ενδιαφεροντα$/i,
  /^δραστηριότητες$/i,
  /^δραστηριοτητες$/i,
];

const professionalSectionPatterns = [
  /^skills?$/i,
  /^technical skills?$/i,
  /^professional skills?$/i,
  /^digital skills?$/i,
  /^competenc(?:y|ies)$/i,
  /^δεξιότητες$/i,
  /^δεξιοτητες$/i,
  /^τεχνικές δεξιότητες$/i,
  /^τεχνικες δεξιοτητες$/i,
  /^επαγγελματικές δεξιότητες$/i,
  /^επαγγελματικες δεξιοτητες$/i,
  /^work experience$/i,
  /^experience$/i,
  /^employment history$/i,
  /^επαγγελματική εμπειρία$/i,
  /^επαγγελματικη εμπειρια$/i,
  /^education$/i,
  /^εκπαίδευση$/i,
  /^εκπαιδευση$/i,
  /^languages?$/i,
  /^γλώσσες$/i,
  /^γλωσσες$/i,
  /^certifications?$/i,
  /^courses?(?: and training)?$/i,
];

function cleanHeadingCandidate(
  line: string
): string {
  return normalizeForComparison(
    line
      .replace(/[:：]\s*$/u, "")
      .trim()
  );
}

function matchesHeading(
  line: string,
  patterns: RegExp[]
): boolean {
  const candidate =
    cleanHeadingCandidate(line);

  return patterns.some(
    (pattern) =>
      pattern.test(candidate)
  );
}

function lineContainsLeisureLabel(
  line: string
): boolean {
  const normalized =
    normalizeForComparison(line);

  return [
    "hobby",
    "hobbies",
    "interests",
    "personal interests",
    "leisure",
    "χόμπι",
    "χομπι",
    "ενδιαφέροντα",
    "ενδιαφεροντα",
    "προσωπικά ενδιαφέροντα",
    "προσωπικα ενδιαφεροντα",
  ].some(
    (label) =>
      normalized.includes(
        normalizeForComparison(label)
      )
  );
}

function evidenceAppearsInLeisureSection(
  evidence: string,
  analysisText: string
): boolean {
  const normalizedEvidence =
    normalizeForComparison(evidence);

  if (!normalizedEvidence) {
    return false;
  }

  const lines =
    analysisText
      .split(/\r?\n/)
      .map((line) => line.trim());

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const normalizedLine =
      normalizeForComparison(
        lines[index]
      );

    if (
      !normalizedLine.includes(
        normalizedEvidence
      )
    ) {
      continue;
    }

    if (
      lineContainsLeisureLabel(
        lines[index]
      )
    ) {
      return true;
    }

    for (
      let offset = 1;
      offset <= 8 &&
      index - offset >= 0;
      offset += 1
    ) {
      const previousLine =
        lines[index - offset];

      if (!previousLine) {
        continue;
      }

      if (
        matchesHeading(
          previousLine,
          leisureHeadingPatterns
        )
      ) {
        return true;
      }

      if (
        matchesHeading(
          previousLine,
          professionalSectionPatterns
        )
      ) {
        break;
      }
    }
  }

  return false;
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
          ).filter(
            (snippet) =>
              !evidenceAppearsInLeisureSection(
                snippet,
                analysisText
              )
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


function validateClassification(
  analysis: ResumeAnalysis,
  analysisText: string,
  validatedEvidence: string[],
  validatedWorkEvidence: string[]
): ResumeAnalysis["classification"] {
  const classification =
    analysis.classification;

  if (!classification) {
    return undefined;
  }

  const validatedEvidenceKeys =
    new Set(
      validatedEvidence.map(
        normalizeForComparison
      )
    );

  const evidence =
    deduplicate(
      keepValidEvidence(
        classification.evidence,
        analysisText
      ).filter(
        (snippet) =>
          validatedEvidenceKeys.has(
            normalizeForComparison(
              snippet
            )
          )
      ),
      (snippet) => snippet
    );

  if (evidence.length === 0) {
    return undefined;
  }

  const classificationEvidenceKeys =
    new Set(
      evidence.map(
        normalizeForComparison
      )
    );

  const workEvidenceKeys =
    new Set(
      validatedWorkEvidence.map(
        normalizeForComparison
      )
    );

  const seniorityEvidence =
    deduplicate(
      keepValidEvidence(
        classification
          .seniorityEvidence ?? [],
        analysisText
      ).filter(
        (snippet) => {
          const normalized =
            normalizeForComparison(
              snippet
            );

          return (
            workEvidenceKeys.has(
              normalized
            ) &&
            classificationEvidenceKeys.has(
              normalized
            )
          );
        }
      ),
      (snippet) => snippet
    );

  const estimatedSeniority =
    seniorityEvidence.length > 0
      ? classification
          .estimatedSeniority
      : null;

  return {
    professionalCategory:
      classification
        .professionalCategory,

    professionalSubcategory:
      classification
        .professionalSubcategory,

    estimatedSeniority,

    confidence:
      classification.confidence,

    evidence,

    seniorityEvidence,
  };
}

export function validateResumeEvidence(
  analysis: ResumeAnalysis,
  analysisText: string
): ResumeAnalysis {
  const skills =
    validateSkills(
      analysis,
      analysisText
    );

  const languages =
    validateLanguages(
      analysis,
      analysisText
    );

  const workExperience =
    validateWorkExperience(
      analysis,
      analysisText
    );

  const education =
    validateEducation(
      analysis,
      analysisText
    );

  const coursesAndTraining =
    validateCoursesAndTraining(
      analysis,
      analysisText
    );

  const certifications =
    validateCertifications(
      analysis,
      analysisText
    );

  const drivingLicenses =
    validateDrivingLicenses(
      analysis,
      analysisText
    );

  const validatedEvidence = [
    ...skills.flatMap(
      (item) => item.evidence
    ),
    ...languages.flatMap(
      (item) => item.evidence
    ),
    ...workExperience.flatMap(
      (item) => item.evidence
    ),
    ...education.flatMap(
      (item) => item.evidence
    ),
    ...coursesAndTraining.flatMap(
      (item) => item.evidence
    ),
    ...certifications.flatMap(
      (item) => item.evidence
    ),
    ...drivingLicenses.flatMap(
      (item) => item.evidence
    ),
  ];

  const validatedWorkEvidence =
    workExperience.flatMap(
      (item) => item.evidence
    );

  const classification =
    validateClassification(
      analysis,
      analysisText,
      validatedEvidence,
      validatedWorkEvidence
    );

  return {
    skills,
    languages,
    workExperience,
    education,
    coursesAndTraining,
    certifications,
    drivingLicenses,

    ...(classification
      ? {
          classification,
        }
      : {}),
  };
}