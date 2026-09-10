export const JOB_SCORING_VERSION =
  "job-fit-1.0";

export type SeniorityLevel =
  | "junior"
  | "senior"
  | "expert";

export type RequirementType =
  | "skill"
  | "language"
  | "education"
  | "experience"
  | "certification"
  | "training"
  | "driving_license";

export interface JobForScoring {
  id: string;
  title: string;
  targetLevel: SeniorityLevel;
}

export interface RequirementForScoring {
  id: string;
  type: RequirementType;
  name: string;
  importance:
    | "required"
    | "preferred";
  weight: number;
  minimumLevel: string | null;
  minimumYears: number | null;
  notes: string | null;
}

interface EvidenceItem {
  evidence: unknown;
}

interface SkillItem
  extends EvidenceItem {
  name: string;
}

interface LanguageItem
  extends EvidenceItem {
  language: string;
  level: string | null;
}

interface WorkExperienceItem
  extends EvidenceItem {
  role: string;
  organization: string | null;
  datesText: string | null;
}

interface EducationItem
  extends EvidenceItem {
  qualification: string;
  institution: string | null;
  status: string | null;
  grade: string | null;
}

interface TrainingItem
  extends EvidenceItem {
  name: string;
  provider: string | null;
}

interface CertificationItem
  extends EvidenceItem {
  name: string;
  issuer: string | null;
}

interface DrivingLicenseItem
  extends EvidenceItem {
  category: string;
}

export interface CandidateProfileForScoring {
  skills: SkillItem[];
  languages: LanguageItem[];
  workExperience:
    WorkExperienceItem[];
  education: EducationItem[];
  training: TrainingItem[];
  certifications:
    CertificationItem[];
  drivingLicenses:
    DrivingLicenseItem[];
}

export interface CandidateScoringInput {
  job: JobForScoring;
  requirements:
    RequirementForScoring[];
  profile:
    CandidateProfileForScoring;
}

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(
      /[^\p{L}\p{N}+#./]+/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function sameText(
  left: string,
  right: string
): boolean {
  return (
    normalizeText(left) ===
    normalizeText(right)
  );
}

function containsText(
  haystack: string,
  needle: string
): boolean {
  const normalizedHaystack =
    normalizeText(haystack);

  const normalizedNeedle =
    normalizeText(needle);

  return (
    normalizedHaystack.includes(
      normalizedNeedle
    ) ||
    normalizedNeedle.includes(
      normalizedHaystack
    )
  );
}

function readEvidence(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string"
  );
}

const languageLevels =
  new Map<string, number>([
    ["a1", 1],
    ["a2", 2],
    ["b1", 3],
    ["b2", 4],
    ["c1", 5],
    ["c2", 6],
  ]);

function parseLanguageLevel(
  value: string | null
): number | null {
  if (!value) {
    return null;
  }

  const match =
    normalizeText(value).match(
      /\b(a1|a2|b1|b2|c1|c2)\b/i
    );

  if (!match) {
    return null;
  }

  return (
    languageLevels.get(
      match[1].toLowerCase()
    ) ?? null
  );
}

function parseExperienceYears(
  datesText: string | null
): number | null {
  if (!datesText) {
    return null;
  }

  const years =
    datesText.match(
      /\b(?:19|20)\d{2}\b/g
    );

  if (!years?.length) {
    return null;
  }

  const numericYears =
    years.map(Number);

  const start =
    numericYears[0];

  let end: number | null =
    numericYears.length >= 2
      ? numericYears[
          numericYears.length - 1
        ]
      : null;

  const normalized =
    normalizeText(datesText);

  const ongoing =
    normalized.includes("present") ||
    normalized.includes("current") ||
    normalized.includes("today") ||
    normalized.includes("σημερα") ||
    normalized.includes("τωρα");

  if (end === null && ongoing) {
    end =
      new Date().getFullYear();
  }

  if (end === null) {
    return null;
  }

  if (end < start) {
    return null;
  }

  return end - start;
}

function getRequirementMatch(
  requirement:
    RequirementForScoring,
  profile:
    CandidateProfileForScoring
) {
  switch (requirement.type) {
    case "skill": {
      const match =
        profile.skills.find(
          (skill) =>
            sameText(
              skill.name,
              requirement.name
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "skill_not_found",
        };
      }

      return {
        matched: true,
        matchedValue:
          match.name,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "exact_skill_match",
      };
    }

    case "language": {
      const match =
        profile.languages.find(
          (language) =>
            sameText(
              language.language,
              requirement.name
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "language_not_found",
        };
      }

      if (
        requirement.minimumLevel
      ) {
        const candidateLevel =
          parseLanguageLevel(
            match.level
          );

        const requiredLevel =
          parseLanguageLevel(
            requirement.minimumLevel
          );

        if (
          requiredLevel !== null &&
          (
            candidateLevel === null ||
            candidateLevel <
              requiredLevel
          )
        ) {
          return {
            matched: false,
            matchedValue:
              match.level,
            evidence:
              readEvidence(
                match.evidence
              ),
            reason:
              "language_level_below_minimum",
          };
        }
      }

      return {
        matched: true,
        matchedValue:
          match.level
            ? `${match.language} ${match.level}`
            : match.language,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "language_match",
      };
    }

    case "education": {
      const match =
        profile.education.find(
          (education) =>
            containsText(
              education.qualification,
              requirement.name
            ) ||
            (
              education.institution !==
                null &&
              containsText(
                education.institution,
                requirement.name
              )
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "education_not_found",
        };
      }

      return {
        matched: true,
        matchedValue:
          match.qualification,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "education_match",
      };
    }

    case "training": {
      const match =
        profile.training.find(
          (training) =>
            containsText(
              training.name,
              requirement.name
            ) ||
            (
              training.provider !==
                null &&
              containsText(
                training.provider,
                requirement.name
              )
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "training_not_found",
        };
      }

      return {
        matched: true,
        matchedValue:
          match.name,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "training_match",
      };
    }

    case "certification": {
      const match =
        profile.certifications.find(
          (certification) =>
            containsText(
              certification.name,
              requirement.name
            ) ||
            (
              certification.issuer !==
                null &&
              containsText(
                certification.issuer,
                requirement.name
              )
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "certification_not_found",
        };
      }

      return {
        matched: true,
        matchedValue:
          match.name,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "certification_match",
      };
    }

    case "driving_license": {
      const match =
        profile.drivingLicenses.find(
          (license) =>
            sameText(
              license.category,
              requirement.name
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "driving_license_not_found",
        };
      }

      return {
        matched: true,
        matchedValue:
          match.category,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "driving_license_match",
      };
    }

    case "experience": {
      const match =
        profile.workExperience.find(
          (experience) =>
            containsText(
              experience.role,
              requirement.name
            ) ||
            (
              experience.organization !==
                null &&
              containsText(
                experience.organization,
                requirement.name
              )
            )
        );

      if (!match) {
        return {
          matched: false,
          matchedValue: null,
          evidence: [],
          reason:
            "experience_not_found",
        };
      }

      if (
        requirement.minimumYears !==
          null
      ) {
        const years =
          parseExperienceYears(
            match.datesText
          );

        if (
          years === null ||
          years <
            requirement.minimumYears
        ) {
          return {
            matched: false,
            matchedValue:
              match.role,
            evidence:
              readEvidence(
                match.evidence
              ),
            reason:
              "experience_duration_below_or_unknown",
          };
        }
      }

      return {
        matched: true,
        matchedValue:
          match.role,
        evidence:
          readEvidence(
            match.evidence
          ),
        reason:
          "experience_match",
      };
    }
  }
}

function getRelevantTerms(
  job: JobForScoring,
  requirements:
    RequirementForScoring[]
): string[] {
  const source = [
    job.title,

    ...requirements
      .filter(
        (requirement) =>
          requirement.type ===
          "experience"
      )
      .map(
        (requirement) =>
          requirement.name
      ),
  ]
    .join(" ");

  const ignoredTerms =
    new Set([
      "junior",
      "senior",
      "expert",
      "jr",
      "sr",
    ]);

  return normalizeText(source)
    .split(" ")
    .filter(
      (term) =>
        term.length >= 4 &&
        !ignoredTerms.has(term)
    );
}

function estimateSeniority(
  job: JobForScoring,
  requirements:
    RequirementForScoring[],
  profile:
    CandidateProfileForScoring
) {
  const relevantTerms =
    getRelevantTerms(
      job,
      requirements
    );

  const relevantExperience =
    profile.workExperience.filter(
      (experience) => {
        const normalizedRole =
          normalizeText(
            experience.role
          );

        return relevantTerms.some(
          (term) =>
            normalizedRole.includes(
              term
            )
        );
      }
    );

  if (
    relevantExperience.length === 0
  ) {
    return {
      estimatedLevel:
        "junior" as const,
      relevantYears: 0,
      evidence: [] as string[],
      rule:
        "No role-relevant professional experience was documented in the validated profile.",
    };
  }

  const durations =
    relevantExperience.map(
      (experience) =>
        parseExperienceYears(
          experience.datesText
        )
    );

  if (
    durations.some(
      (duration) =>
        duration === null
    )
  ) {
    return {
      estimatedLevel: null,
      relevantYears: null,
      evidence:
        relevantExperience.flatMap(
          (experience) =>
            readEvidence(
              experience.evidence
            )
        ),
      rule:
        "Relevant experience exists, but duration cannot be determined reliably from the documented dates.",
    };
  }

  const relevantYears =
    (
      durations as number[]
    ).reduce(
      (sum, duration) =>
        sum + duration,
      0
    );

  let estimatedLevel:
    SeniorityLevel;

  if (relevantYears < 3) {
    estimatedLevel = "junior";
  } else if (
    relevantYears < 8
  ) {
    estimatedLevel = "senior";
  } else {
    estimatedLevel = "expert";
  }

  return {
    estimatedLevel,
    relevantYears,
    evidence:
      relevantExperience.flatMap(
        (experience) =>
          readEvidence(
            experience.evidence
          )
      ),
    rule:
      "Version 1.0 seniority rule: <3 relevant documented years = junior, 3-7.99 = senior, 8+ = expert.",
  };
}

function seniorityCompatibilityScore(
  estimated:
    SeniorityLevel | null,
  target:
    SeniorityLevel
): number {
  if (estimated === null) {
    return 50;
  }

  const rank: Record<
    SeniorityLevel,
    number
  > = {
    junior: 1,
    senior: 2,
    expert: 3,
  };

  const difference =
    rank[estimated] -
    rank[target];

  if (difference >= 0) {
    return 100;
  }

  if (difference === -1) {
    return 55;
  }

  return 25;
}

function roundScore(
  value: number
): number {
  return Math.round(
    value * 100
  ) / 100;
}

export function scoreCandidateForJob(
  input: CandidateScoringInput
) {
  const requirementResults =
    input.requirements.map(
      (requirement) => {
        const result =
          getRequirementMatch(
            requirement,
            input.profile
          );

        return {
          requirementId:
            requirement.id,
          type:
            requirement.type,
          name:
            requirement.name,
          importance:
            requirement.importance,
          weight:
            requirement.weight,
          minimumLevel:
            requirement.minimumLevel,
          minimumYears:
            requirement.minimumYears,
          matched:
            result.matched,
          matchedValue:
            result.matchedValue,
          evidence:
            result.evidence,
          reason:
            result.reason,
          pointsPossible:
            requirement.weight,
          pointsAwarded:
            result.matched
              ? requirement.weight
              : 0,
        };
      }
    );

  const totalWeight =
    requirementResults.reduce(
      (sum, item) =>
        sum +
        item.pointsPossible,
      0
    );

  const awardedWeight =
    requirementResults.reduce(
      (sum, item) =>
        sum +
        item.pointsAwarded,
      0
    );

  const requirementsScore =
    totalWeight === 0
      ? 0
      : roundScore(
          (
            awardedWeight /
            totalWeight
          ) * 100
        );

  const requiredItems =
    requirementResults.filter(
      (item) =>
        item.importance ===
        "required"
    );

  const preferredItems =
    requirementResults.filter(
      (item) =>
        item.importance ===
        "preferred"
    );

  const seniority =
    estimateSeniority(
      input.job,
      input.requirements,
      input.profile
    );

  const seniorityScore =
    seniorityCompatibilityScore(
      seniority.estimatedLevel,
      input.job.targetLevel
    );

  /**
   * V1 scoring:
   *
   * 85% explicit job requirements
   * 15% documented role seniority
   *
   * No personal or sensitive
   * attributes are used.
   */
  const overallScore =
    roundScore(
      requirementsScore *
        0.85 +
        seniorityScore *
          0.15
    );

  return {
    scoringVersion:
      JOB_SCORING_VERSION,

    overallScore,

    requirementsScore,

    seniorityScore,

    targetLevel:
      input.job.targetLevel,

    estimatedLevel:
      seniority.estimatedLevel,

    matchedRequiredCount:
      requiredItems.filter(
        (item) =>
          item.matched
      ).length,

    totalRequiredCount:
      requiredItems.length,

    matchedPreferredCount:
      preferredItems.filter(
        (item) =>
          item.matched
      ).length,

    totalPreferredCount:
      preferredItems.length,

    scoreBreakdown: {
      formula: {
        requirementsWeight:
          0.85,
        seniorityWeight:
          0.15,
      },

      requirements:
        requirementResults,

      seniority: {
        targetLevel:
          input.job.targetLevel,
        estimatedLevel:
          seniority.estimatedLevel,
        relevantYears:
          seniority.relevantYears,
        score:
          seniorityScore,
        evidence:
          seniority.evidence,
        rule:
          seniority.rule,
      },
    },

    criteriaSnapshot: {
      job: {
        id:
          input.job.id,
        title:
          input.job.title,
        targetLevel:
          input.job.targetLevel,
      },

      requirements:
        input.requirements,
    },
  };
}