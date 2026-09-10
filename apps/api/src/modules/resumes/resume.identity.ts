import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ??
  "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ??
  "qwen3:4b-instruct";

export type ResumeIdentity = {
  firstName: string;
  lastName: string;
  confidence:
    | "high"
    | "medium"
    | "low";
};

function cleanName(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function extractPdfText(
  buffer: Buffer
): Promise<string> {
  const parser =
    new PDFParse({
      data: buffer,
    });

  try {
    const result =
      await parser.getText();

    return (
      result.text ?? ""
    ).trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(
  buffer: Buffer
): Promise<string> {
  const result =
    await mammoth.extractRawText({
      buffer,
    });

  return result.value.trim();
}

export async function extractIdentityText(
  file: Express.Multer.File
): Promise<string> {
  const filename =
    file.originalname
      .toLowerCase();

  const isPdf =
    file.mimetype ===
      "application/pdf" ||
    filename.endsWith(
      ".pdf"
    );

  const isDocx =
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(
      ".docx"
    );

  if (isPdf) {
    return extractPdfText(
      file.buffer
    );
  }

  if (isDocx) {
    return extractDocxText(
      file.buffer
    );
  }

  throw new Error(
    "Unsupported resume type. Only PDF and DOCX are supported."
  );
}

export async function identifyCandidateFromResume(
  file: Express.Multer.File
): Promise<ResumeIdentity> {
  const text =
    await extractIdentityText(
      file
    );

  if (!text) {
    throw new Error(
      "No readable text was found in the resume."
    );
  }

  /**
   * We only need the beginning of
   * the CV for identity extraction.
   *
   * Do not send unnecessary parts
   * of the document to this step.
   */
  const identityText =
    text.slice(
      0,
      5000
    );

  const prompt = `
You are extracting candidate identity from a CV.

Return ONLY valid JSON with exactly this structure:

{
  "firstName": "",
  "lastName": "",
  "confidence": "high"
}

Rules:

- Extract only the person's name explicitly written in the CV.
- Do not invent or infer a name.
- Preserve Greek characters when the CV uses Greek.
- Preserve Latin characters when the CV uses Latin.
- firstName means given name.
- lastName means family/surname.
- If multiple given names are clearly part of the person's name, keep them in firstName.
- If the name is unclear, use confidence "low".
- confidence must be exactly "high", "medium", or "low".
- Do not return email, phone, age, gender, nationality, address, photo information, or any other personal information.
- Do not evaluate the candidate.
- Do not determine suitability for a job.
- Do not score the candidate.
- Do not use professional information for identity inference.
- If no reliable name is explicitly present, return empty strings.

CV TEXT:

${identityText}
`.trim();

  const response =
    await fetch(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            model:
              OLLAMA_MODEL,

            prompt,

            stream: false,

            format: "json",

            options: {
              temperature: 0,
            },
          }),
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Ollama identity extraction failed (${response.status}): ${errorText}`
    );
  }

  const ollamaResponse =
    (await response.json()) as {
      response?: string;
    };

  if (
    !ollamaResponse.response
  ) {
    throw new Error(
      "Ollama returned an empty identity response."
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        ollamaResponse.response
      );
  } catch {
    throw new Error(
      "Ollama returned invalid identity JSON."
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed === null
  ) {
    throw new Error(
      "Invalid identity result."
    );
  }

  const result =
    parsed as Record<
      string,
      unknown
    >;

  const firstName =
    cleanName(
      result.firstName
    );

  const lastName =
    cleanName(
      result.lastName
    );

  const rawConfidence =
    result.confidence;

  const confidence:
    ResumeIdentity["confidence"] =
      rawConfidence ===
        "high" ||
      rawConfidence ===
        "medium" ||
      rawConfidence ===
        "low"
        ? rawConfidence
        : "low";

  if (
    !firstName ||
    !lastName
  ) {
    throw new Error(
      "Candidate name could not be reliably extracted from the resume."
    );
  }

  return {
    firstName,
    lastName,
    confidence,
  };
}