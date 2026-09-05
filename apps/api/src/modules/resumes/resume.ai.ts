import {
  resumeAnalysisSchema,
  type ResumeAnalysis,
} from "./resume.analysis.schema.js";

import {
  validateResumeEvidence,
} from "./resume.evidence.js";

const DEFAULT_OLLAMA_BASE_URL =
  "http://localhost:11434";

const DEFAULT_OLLAMA_MODEL =
  "qwen3:4b-instruct";

export const RESUME_ANALYSIS_PROMPT_VERSION =
  "1.3";

const evidenceProperty = {
  type: "array",
  items: {
    type: "string",
  },
  minItems: 1,
  maxItems: 3,
};

const nullableString = {
  anyOf: [
    {
      type: "string",
    },
    {
      type: "null",
    },
  ],
};

const resumeAnalysisJsonSchema = {
  type: "object",

  additionalProperties: false,

  properties: {
    skills: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          name: {
            type: "string",
          },

          category: {
            type: "string",
            enum: [
              "technical",
              "tool",
              "soft_skill",
              "marketing",
              "design",
              "methodology",
              "other",
            ],
          },

          evidence:
            evidenceProperty,
        },

        required: [
          "name",
          "category",
          "evidence",
        ],
      },
    },

    languages: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          language: {
            type: "string",
          },

          level:
            nullableString,

          evidence:
            evidenceProperty,
        },

        required: [
          "language",
          "level",
          "evidence",
        ],
      },
    },

    workExperience: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          role: {
            type: "string",
          },

          organization:
            nullableString,

          dates:
            nullableString,

          evidence:
            evidenceProperty,
        },

        required: [
          "role",
          "organization",
          "dates",
          "evidence",
        ],
      },
    },

    education: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          qualification: {
            type: "string",
          },

          institution:
            nullableString,

          dates:
            nullableString,

          status:
            nullableString,

          grade:
            nullableString,

          evidence:
            evidenceProperty,
        },

        required: [
          "qualification",
          "institution",
          "dates",
          "status",
          "grade",
          "evidence",
        ],
      },
    },

    coursesAndTraining: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          name: {
            type: "string",
          },

          provider:
            nullableString,

          evidence:
            evidenceProperty,
        },

        required: [
          "name",
          "provider",
          "evidence",
        ],
      },
    },

    certifications: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          name: {
            type: "string",
          },

          issuer:
            nullableString,

          evidence:
            evidenceProperty,
        },

        required: [
          "name",
          "issuer",
          "evidence",
        ],
      },
    },

    drivingLicenses: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          category: {
            type: "string",
          },

          evidence:
            evidenceProperty,
        },

        required: [
          "category",
          "evidence",
        ],
      },
    },
  },

  required: [
    "skills",
    "languages",
    "workExperience",
    "education",
    "coursesAndTraining",
    "certifications",
    "drivingLicenses",
  ],
};

type OllamaChatResponse = {
  model?: string;

  message?: {
    role?: string;
    content?: string;
  };
};

export async function analyzeResumeWithLocalAi(
  analysisText: string
): Promise<{
  analysis: ResumeAnalysis;
  model: string;
}> {
  const baseUrl =
    process.env.OLLAMA_BASE_URL ??
    DEFAULT_OLLAMA_BASE_URL;

  const model =
    process.env.OLLAMA_MODEL ??
    DEFAULT_OLLAMA_MODEL;

  const response =
    await fetch(
      `${baseUrl}/api/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
        },

        signal:
          AbortSignal.timeout(
            120_000
          ),

        body: JSON.stringify({
          model,
          stream: false,

          format:
            resumeAnalysisJsonSchema,

          options: {
            temperature: 0,
          },

          messages: [
            {
              role: "system",

              content: `
You are a CV information extraction system.

Your ONLY task is to extract job-related facts explicitly present in the supplied sanitized CV.

You are NOT a hiring decision system.

STRICT RULES

1. Never invent information.
2. Never guess missing information.
3. Never rank or evaluate the candidate.
4. Never make hiring or rejection decisions.
5. Ignore hobbies and leisure activities.
6. Optional missing information must be null.
7. Never use placeholders such as "Not specified", "Unknown" or "N/A".
8. Do not create duplicate entries.

EVIDENCE

9. Every returned item requires 1 to 3 exact evidence strings copied from the CV.
10. Do not paraphrase evidence.
11. Every non-null factual field must appear in at least one evidence string.
12. When information spans parent and child lines, include those exact lines as separate evidence strings.

SKILLS

13. Explicit programming/development technologies -> technical.
14. Software products such as Microsoft Office -> tool.
15. Explicit interpersonal skills -> soft_skill.
16. Marketing skills -> marketing.
17. Design skills -> design.
18. Professional methodologies -> methodology.

LANGUAGES

19. Extract only explicitly stated languages.
20. Extract level only if explicitly stated.

WORK EXPERIENCE

21. One explicit work role = one workExperience item.
22. role must be explicit.
23. organization must be explicit or null.
24. dates must be actual work dates or null.

EDUCATION

25. Every separate degree, diploma or qualification must become a separate education item.
26. Nested bullet qualifications must NOT be omitted.

Important example:

Parent:
"6ο Επαγγελματικό Λύκειο Πάτρας"

Children:
"Απολυτήριο Λυκείου"
"Πτυχίο Πληροφορικής (19,2)"

This means TWO education records:

Record 1:
qualification = "Απολυτήριο Λυκείου"
institution = "6ο Επαγγελματικό Λύκειο Πάτρας"

Record 2:
qualification = "Πτυχίο Πληροφορικής"
institution = "6ο Επαγγελματικό Λύκειο Πάτρας"
grade = "19,2"

27. A numerical mark or grade belongs ONLY in grade.
28. A grade must NEVER be placed in status.
29. status means study state such as "1ο έτος", "ongoing", or an equivalent phrase explicitly present in the CV.
30. Do not infer "completed".
31. dates contains ONLY actual dates/date ranges.
32. A qualification name is not a date.
33. A grade is not a date.
34. A study year such as "1ο έτος" is not a date.

COURSES AND TRAINING

35. Each individual seminar, workshop, course or training title must become its OWN coursesAndTraining item.
36. A provider/header is NOT itself a course.

Important example:

Provider:
"Grow with Google"

Courses:
"Εισαγωγή στο Cloud"
"Κατανόηση της Μηχανικής Μάθησης"

Return TWO items:

{
  "name": "Εισαγωγή στο Cloud",
  "provider": "Grow with Google"
}

{
  "name": "Κατανόηση της Μηχανικής Μάθησης",
  "provider": "Grow with Google"
}

Do NOT return "Grow with Google" as the course name.

37. If another provider has three child course bullets, return three separate course items.
38. Do not merge two separate courses into one item.
39. Evidence for a parent/provider relationship should contain the exact provider line and exact individual course line.

CERTIFICATIONS

40. A course or seminar is NOT automatically a certification.
41. Return certifications only when the CV explicitly identifies a certification/certificate/professional credential.

DRIVING LICENCES

42. Extract explicitly stated driving licence categories only.

SENSITIVE INFORMATION

43. Never extract or infer:
- age
- date of birth
- gender
- sex
- religion
- marital status
- nationality
- citizenship
- ethnicity
- health information
- disability
- appearance
- home address
- email
- telephone number

OUTPUT

44. Return ONLY JSON matching the supplied schema.
45. No prose outside JSON.

The CV may be written in Greek, English, or both.
              `.trim(),
            },

            {
              role: "user",

              content: `
Extract the structured professional facts from this sanitized CV.

Pay special attention to:
- every nested education qualification
- grades versus study status
- every individual course beneath a provider heading

--- CV START ---

${analysisText}

--- CV END ---
              `.trim(),
            },
          ],
        }),
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }

  const ollamaResponse =
    (await response.json()) as OllamaChatResponse;

  const content =
    ollamaResponse.message?.content;

  if (!content) {
    throw new Error(
      "Ollama returned an empty response"
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson =
      JSON.parse(content);
  } catch {
    throw new Error(
      "Ollama returned invalid JSON"
    );
  }

  const validated =
    resumeAnalysisSchema
      .safeParse(parsedJson);

  if (!validated.success) {
    throw new Error(
      `AI response failed validation: ${validated.error.message}`
    );
  }

  const evidenceValidatedAnalysis =
    validateResumeEvidence(
      validated.data,
      analysisText
    );

  return {
    analysis:
      evidenceValidatedAnalysis,

    model:
      ollamaResponse.model ??
      model,
  };
}