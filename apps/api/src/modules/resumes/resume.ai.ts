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
  "1.7";

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

    classification: {
      type: "object",
      additionalProperties: false,

      properties: {
        professionalCategory: {
          type: "string",
          enum: [
            "it_software",
            "data_analytics",
            "accounting_finance",
            "sales",
            "marketing",
            "human_resources",
            "administration",
            "engineering",
            "logistics_supply_chain",
            "hospitality_tourism",
            "customer_service",
            "healthcare",
            "construction_trades",
            "education",
            "legal",
            "operations",
            "other",
          ],
        },

        professionalSubcategory:
          nullableString,

        estimatedSeniority: {
          anyOf: [
            {
              type: "string",
              enum: [
                "junior",
                "senior",
                "expert",
              ],
            },
            {
              type: "null",
            },
          ],
        },

        confidence: {
          type: "string",
          enum: [
            "low",
            "medium",
            "high",
          ],
        },

        evidence: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 1,
          maxItems: 5,
        },

        seniorityEvidence: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 0,
          maxItems: 3,
        },
      },

      required: [
        "professionalCategory",
        "professionalSubcategory",
        "estimatedSeniority",
        "confidence",
        "evidence",
        "seniorityEvidence",
      ],
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
    "classification",
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

13. Extract EVERY explicitly stated skill or technology. Do not omit items from grouped or parenthesized lists.
14. When one line contains multiple technologies, return one separate skill item for each technology.
15. Example: "Python, Java, JavaScript, HTML/CSS" means FOUR separate skill records.
16. Explicit programming/development technologies -> technical.
17. Software products such as Microsoft Office -> tool.
18. Explicit interpersonal skills -> soft_skill.
19. Marketing skills -> marketing.
20. Design skills -> design.
21. Professional methodologies -> methodology.
22. NEVER extract hobbies, leisure activities, sports, games, personal interests, or recreational activities as skills.
23. Examples that must NOT become skills when listed as hobbies/interests: football, gym, chess, gaming, music, travel, reading, hiking, photography.
24. The same applies to Greek terms such as Ποδόσφαιρο, Γυμναστήριο, Σκάκι, Μουσική, Ταξίδια, Διάβασμα, Πεζοπορία, Φωτογραφία.
25. "Computer use" / "Χρήση υπολογιστών" may be kept when presented as a professional/digital skill, but not merely as a hobby.

LANGUAGES

22. Extract only explicitly stated languages.
23. Extract level only if explicitly stated.

WORK EXPERIENCE

24. One explicit work role = one workExperience item.
25. role must be explicit.
26. organization must be explicit or null.
27. dates must be actual work dates or null.

EDUCATION

28. Every separate degree, diploma or qualification must become a separate education item.
29. Nested bullet qualifications must NOT be omitted.
30. If study status appears inside or next to a qualification, extract it into status.
31. Example: "BSc Hons Computer Science (1ο έτος)" means qualification = "BSc Hons Computer Science" and status = "1ο έτος".

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

32. A numerical mark or grade belongs ONLY in grade.
33. A grade must NEVER be placed in status.
34. status means study state such as "1ο έτος", "ongoing", or an equivalent phrase explicitly present in the CV.
35. Do not infer "completed".
36. dates contains ONLY actual dates/date ranges.
37. A qualification name is not a date.
38. A grade is not a date.
39. A study year such as "1ο έτος" is not a date.

COURSES AND TRAINING

40. Each individual seminar, workshop, course or training title must become its OWN coursesAndTraining item.
41. A provider/header is NOT itself a course.

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

42. If another provider has three child course bullets, return three separate course items.
43. Do not merge two separate courses into one item.
44. Evidence for a parent/provider relationship should contain the exact provider line and exact individual course line.

CERTIFICATIONS

45. A course or seminar is NOT automatically a certification.
46. Return certifications only when the CV explicitly identifies a certification/certificate/professional credential.

DRIVING LICENCES

47. Extract explicitly stated driving licence categories only.

PROFESSIONAL CLASSIFICATION

48. classification is organizational metadata only. It is NOT a hiring recommendation, candidate score, or employment decision.
49. Base classification only on job-related professional facts contained in the CV.
50. professionalCategory MUST be exactly one of the allowed schema values.
51. professionalSubcategory should be a concise professional area in English, for example "Software Development", "IT Support", "Accounting", or "Hotel Operations". Use null when the CV does not support a useful subcategory.
52. Choose the category that is best supported by the strongest coherent professional evidence. A CV may contain facts from several domains; do not mix unrelated domains into one classification.
53. classification.evidence must contain ONLY exact evidence strings that directly support the chosen professionalCategory or professionalSubcategory.
54. Exclude unrelated jobs, unrelated skills, unrelated training, soft skills, languages and driving licences from classification.evidence.
55. Example: when the chosen category is it_software, hospitality roles such as Barista or Waiter must NOT be included in classification.evidence unless the role itself was an IT/software role.
56. Do not include marketing or design evidence in an it_software classification unless it directly supports the chosen software subcategory.
57. classification.evidence must use 1 to 5 exact evidence strings already used in the extracted professional facts above. Do not create new evidence strings only for classification.
58. estimatedSeniority may be "junior", "senior", "expert", or null.
59. seniorityEvidence must contain ONLY exact workExperience evidence directly relevant to the chosen professionalCategory or professionalSubcategory.
60. If there is no role-relevant workExperience for the chosen category, seniorityEvidence MUST be [] and estimatedSeniority MUST be null.
61. Do NOT infer junior merely because the candidate is a student, has limited experience, is early in education, or has no relevant work experience.
62. Never infer seniority from age, date of birth, graduation year, personal information, or the absence of experience.
63. Use estimatedSeniority only when relevant documented work roles, responsibilities, role titles, or work dates provide enough evidence.
64. "expert" requires unusually strong documented specialist or leadership depth. Do not use it merely because a candidate lists many skills.
65. confidence describes confidence in the professional classification only, not candidate quality.

Important example:
- Technical education + Python/JavaScript skills + hospitality work only
  -> professionalCategory may be it_software
  -> professionalSubcategory may be Software Development
  -> classification.evidence should use the technical education/skills
  -> seniorityEvidence = []
  -> estimatedSeniority = null

SENSITIVE INFORMATION

66. Never extract or infer:
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

67. Return ONLY JSON matching the supplied schema.
68. No prose outside JSON.

The CV may be written in Greek, English, or both.
              `.trim(),
            },

            {
              role: "user",

              content: `
Extract the structured professional facts from this sanitized CV.

Pay special attention to:
- EVERY explicit professional skill and technology, including every item inside grouped lists
- NEVER treating hobbies/interests/leisure activities as skills
- every nested education qualification
- study status embedded in qualification text
- grades versus study status
- every individual course beneath a provider heading
- one evidence-backed professional classification
- category evidence that supports only the chosen domain
- seniority evidence only from role-relevant work experience
- null seniority when no role-relevant work experience exists

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