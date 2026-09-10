import {
  createHash,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

const INBOUND_WEBHOOK_SECRET =
  process.env.INBOUND_WEBHOOK_SECRET;

export const runtime =
  "nodejs";

export const maxDuration =
  180;

type IdentityConfidence =
  | "high"
  | "medium"
  | "low";

type ResumeIdentity = {
  firstName: string;
  lastName: string;
  confidence: IdentityConfidence;
};

type InboundSubmission = {
  id: string;
  source: string;
  external_id: string;

  candidate_id:
    | string
    | null;

  resume_id:
    | string
    | null;

  application_id:
    | string
    | null;

  processing_status:
    string;

  error_message:
    string | null;

  resume_sha256:
    string | null;

  duplicate_of_submission_id:
    | string
    | null;
};

type ReserveResult = {
  data?: {
    created?: boolean;

    submission?:
      InboundSubmission;
  };
};

type FingerprintResult = {
  data?: {
    duplicate?: boolean;

    submission?:
      InboundSubmission;

    duplicateOf?:
      InboundSubmission | null;
  };
};

function findId(
  value: unknown,
  depth = 0
): string | null {
  if (
    depth > 5 ||
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof record.id ===
      "string" ||
    typeof record.id ===
      "number"
  ) {
    return String(
      record.id
    );
  }

  for (
    const key of [
      "data",
      "candidate",
      "resume",
      "application",
      "result",
    ]
  ) {
    const found =
      findId(
        record[key],
        depth + 1
      );

    if (found) {
      return found;
    }
  }

  return null;
}

function normalizeSource(
  value: string
):
  | "manual"
  | "website"
  | "indeed"
  | "jobfind"
  | "bulk_import"
  | "other" {
  const source =
    value
      .trim()
      .toLowerCase();

  switch (source) {
    case "wordpress":
    case "website":
    case "web":
      return "website";

    case "indeed":
      return "indeed";

    case "jobfind":
      return "jobfind";

    case "bulk":
    case "bulk_import":
      return "bulk_import";

    case "manual":
      return "manual";

    default:
      return "other";
  }
}

async function calculateSha256(
  file: File
): Promise<string> {
  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );

  return createHash(
    "sha256"
  )
    .update(buffer)
    .digest("hex");
}

async function readJson(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned non-JSON response (${response.status})`
    );
  }
}

async function backendPost(
  url: string,
  options?: Omit<
    RequestInit,
    "method"
  >
): Promise<unknown> {
  const response =
    await fetch(
      url,
      {
        ...options,

        method:
          "POST",

        cache:
          "no-store",
      }
    );

  const data =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      `Backend request failed (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function ensureJobExists(
  jobId: string
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/jobs/${jobId}`,
      {
        cache:
          "no-store",
      }
    );

  const result =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      `Job ${jobId} does not exist: ${JSON.stringify(result)}`
    );
  }
}

async function reserveSubmission(
  source: string,
  externalId: string
): Promise<{
  created: boolean;

  submission:
    InboundSubmission;
}> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/inbound-submissions/reserve`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            source,
            externalId,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    (await readJson(
      response
    )) as ReserveResult;

  if (!response.ok) {
    throw new Error(
      `Could not reserve inbound submission (${response.status}): ${JSON.stringify(result)}`
    );
  }

  const created =
    result.data?.created;

  const submission =
    result.data?.submission;

  if (
    typeof created !==
      "boolean" ||
    !submission
  ) {
    throw new Error(
      "Invalid inbound reservation response."
    );
  }

  return {
    created,
    submission,
  };
}

async function registerFingerprint(
  submissionId: string,
  resumeSha256: string
): Promise<{
  duplicate: boolean;

  submission:
    InboundSubmission;

  duplicateOf:
    InboundSubmission | null;
}> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/inbound-submissions/fingerprint`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            submissionId,
            resumeSha256,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    (await readJson(
      response
    )) as FingerprintResult;

  if (!response.ok) {
    throw new Error(
      `Could not register resume fingerprint (${response.status}): ${JSON.stringify(result)}`
    );
  }

  const duplicate =
    result.data?.duplicate;

  const submission =
    result.data?.submission;

  const duplicateOf =
    result.data
      ?.duplicateOf ??
    null;

  if (
    typeof duplicate !==
      "boolean" ||
    !submission
  ) {
    throw new Error(
      "Invalid fingerprint response."
    );
  }

  return {
    duplicate,
    submission,
    duplicateOf,
  };
}

async function updateSubmission(
  submissionId: string,
  data: {
    candidateId?: string;
    resumeId?: string;
    applicationId?: string;

    processingStatus?:
      | "received"
      | "processing"
      | "completed"
      | "failed";

    errorMessage?:
      string | null;
  }
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/api/inbound-submissions/${submissionId}`,
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(data),

        cache:
          "no-store",
      }
    );

  const result =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      `Could not update inbound submission (${response.status}): ${JSON.stringify(result)}`
    );
  }
}

async function identifyResume(
  resume: File
): Promise<ResumeIdentity> {
  const formData =
    new FormData();

  formData.append(
    "resume",
    resume
  );

  const response =
    await fetch(
      `${API_BASE_URL}/api/resumes/identify`,
      {
        method:
          "POST",

        body:
          formData,

        cache:
          "no-store",
      }
    );

  const result =
    await readJson(
      response
    );

  if (!response.ok) {
    throw new Error(
      `Candidate identity extraction failed (${response.status}): ${JSON.stringify(result)}`
    );
  }

  if (
    typeof result !==
      "object" ||
    result === null
  ) {
    throw new Error(
      "Invalid identity response."
    );
  }

  const outer =
    result as Record<
      string,
      unknown
    >;

  const data =
    outer.data;

  if (
    typeof data !==
      "object" ||
    data === null
  ) {
    throw new Error(
      "Identity response does not contain data."
    );
  }

  const identity =
    data as Record<
      string,
      unknown
    >;

  const firstName =
    typeof identity.firstName ===
      "string"
      ? identity.firstName.trim()
      : "";

  const lastName =
    typeof identity.lastName ===
      "string"
      ? identity.lastName.trim()
      : "";

  const rawConfidence =
    identity.confidence;

  const confidence:
    IdentityConfidence =
      rawConfidence === "high" ||
      rawConfidence === "medium" ||
      rawConfidence === "low"
        ? rawConfidence
        : "low";

  if (
    !firstName ||
    !lastName
  ) {
    throw new Error(
      "Candidate name could not be extracted from CV."
    );
  }

  return {
    firstName,
    lastName,
    confidence,
  };
}

export async function POST(
  request: Request
) {
  let submissionId:
    string | null =
    null;

  let applicationId:
    string | null =
    null;

  try {
    /**
     * ================================
     * SECURITY
     * ================================
     */

    if (
      !INBOUND_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Inbound endpoint is not configured.",
        },
        {
          status: 503,
        }
      );
    }

    const providedSecret =
      request.headers.get(
        "x-inbound-secret"
      );

    if (
      providedSecret !==
      INBOUND_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized inbound request.",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * ================================
     * READ FORM
     * ================================
     */

    const formData =
      await request.formData();

    const firstNameValue =
      formData.get(
        "firstName"
      );

    const lastNameValue =
      formData.get(
        "lastName"
      );

    const emailValue =
      formData.get(
        "email"
      );

    const phoneValue =
      formData.get(
        "phone"
      );

    const locationValue =
      formData.get(
        "location"
      );

    const sourceValue =
      formData.get(
        "source"
      );

    const externalIdValue =
      formData.get(
        "externalId"
      );

    const jobIdValue =
      formData.get(
        "jobId"
      );

    const resumeValue =
      formData.get(
        "resume"
      );

    if (
      !(
        resumeValue instanceof
        File
      )
    ) {
      return NextResponse.json(
        {
          error:
            "resume file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const source =
      normalizeSource(
        typeof sourceValue ===
          "string"
          ? sourceValue
          : ""
      );

    const externalId =
      typeof externalIdValue ===
        "string"
        ? externalIdValue.trim()
        : "";

    if (!externalId) {
      return NextResponse.json(
        {
          error:
            "externalId is required for inbound submissions.",
        },
        {
          status: 400,
        }
      );
    }

    const rawJobId =
      typeof jobIdValue ===
        "string"
        ? jobIdValue.trim()
        : "";

    const jobIdNumber =
      Number(rawJobId);

    if (
      !rawJobId ||
      !Number.isSafeInteger(
        jobIdNumber
      ) ||
      jobIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A valid jobId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const jobId =
      String(jobIdNumber);

    /**
     * Validate job BEFORE creating
     * an inbound reservation.
     */
    await ensureJobExists(
      jobId
    );

    /**
     * ================================
     * 1. RESERVE SOURCE + EXTERNAL ID
     * ================================
     */

    console.log(
      `[INBOUND] Reserving ${source}:${externalId}`
    );

    const reservation =
      await reserveSubmission(
        source,
        externalId
      );

    submissionId =
      reservation.submission.id;

    if (
      !reservation.created
    ) {
      const existing =
        reservation.submission;

      console.log(
        `[INBOUND] Duplicate external ID blocked: ${source}:${externalId}`
      );

      return NextResponse.json(
        {
          data: {
            duplicate:
              true,

            duplicateReason:
              "source_external_id",

            submissionId:
              existing.id,

            applicationId:
              existing.application_id,

            candidateId:
              existing.candidate_id,

            resumeId:
              existing.resume_id,

            source:
              existing.source,

            externalId:
              existing.external_id,

            resumeSha256:
              existing.resume_sha256,

            processingStatus:
              existing.processing_status,

            message:
              "This inbound submission has already been received.",
          },
        },
        {
          status: 200,
        }
      );
    }

    await updateSubmission(
      submissionId,
      {
        processingStatus:
          "processing",

        errorMessage:
          null,
      }
    );

    /**
     * ================================
     * 2. SHA-256
     * ================================
     */

    const resumeSha256 =
      await calculateSha256(
        resumeValue
      );

    console.log(
      `[INBOUND] SHA-256 ${resumeSha256}`
    );

    const fingerprint =
      await registerFingerprint(
        submissionId,
        resumeSha256
      );

    let candidateId:
      string;

    let resumeId:
      string;

    let duplicateReason:
      string | null =
      null;

    let duplicateOfSubmissionId:
      string | null =
      null;

    let firstName =
      typeof firstNameValue ===
        "string"
        ? firstNameValue.trim()
        : "";

    let lastName =
      typeof lastNameValue ===
        "string"
        ? lastNameValue.trim()
        : "";

    let identitySource:
      | "provided"
      | "resume_ai"
      | "mixed"
      | null =
      "provided";

    let identityConfidence:
      IdentityConfidence | null =
      null;

    /**
     * ================================
     * 3A. SAME CV -> REUSE
     * ================================
     */

    if (
      fingerprint.duplicate
    ) {
      const linked =
        fingerprint.submission;

      if (
        !linked.candidate_id ||
        !linked.resume_id
      ) {
        throw new Error(
          "Duplicate CV was detected but existing candidate/resume could not be determined."
        );
      }

      candidateId =
        linked.candidate_id;

      resumeId =
        linked.resume_id;

      duplicateReason =
        "resume_sha256";

      duplicateOfSubmissionId =
        linked
          .duplicate_of_submission_id;

      identitySource =
        null;

      console.log(
        `[INBOUND] Reusing candidate ${candidateId} and resume ${resumeId}`
      );
    } else {
      /**
       * ================================
       * 3B. NEW CV -> IDENTITY
       * ================================
       */

      const email =
        typeof emailValue ===
          "string" &&
        emailValue.trim()
          ? emailValue.trim()
          : null;

      const phone =
        typeof phoneValue ===
          "string" &&
        phoneValue.trim()
          ? phoneValue.trim()
          : null;

      const location =
        typeof locationValue ===
          "string" &&
        locationValue.trim()
          ? locationValue.trim()
          : null;

      if (
        !firstName ||
        !lastName
      ) {
        console.log(
          "[INBOUND] Reading identity from CV..."
        );

        const identity =
          await identifyResume(
            resumeValue
          );

        if (
          identity.confidence ===
          "low"
        ) {
          await updateSubmission(
            submissionId,
            {
              processingStatus:
                "failed",

              errorMessage:
                "Candidate identity requires manual review.",
            }
          );

          return NextResponse.json(
            {
              error:
                "Candidate identity requires manual review.",

              submissionId,

              identity,
            },
            {
              status: 422,
            }
          );
        }

        const hadSomeProvidedName =
          Boolean(
            firstName ||
            lastName
          );

        if (!firstName) {
          firstName =
            identity.firstName;
        }

        if (!lastName) {
          lastName =
            identity.lastName;
        }

        identitySource =
          hadSomeProvidedName
            ? "mixed"
            : "resume_ai";

        identityConfidence =
          identity.confidence;
      }

      /**
       * ================================
       * 4. CREATE CANDIDATE
       * ================================
       */

      const candidatePayload:
        Record<
          string,
          string
        > = {
          firstName,
          lastName,
          status:
            "new",
          source,
        };

      if (email) {
        candidatePayload.email =
          email;
      }

      if (phone) {
        candidatePayload.phone =
          phone;
      }

      if (location) {
        candidatePayload.location =
          location;
      }

      const candidateData =
        await backendPost(
          `${API_BASE_URL}/api/candidates`,
          {
            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                candidatePayload
              ),
          }
        );

      const newCandidateId =
        findId(
          candidateData
        );

      if (
        !newCandidateId
      ) {
        throw new Error(
          "Candidate created but candidate ID could not be determined."
        );
      }

      candidateId =
        newCandidateId;

      await updateSubmission(
        submissionId,
        {
          candidateId,
        }
      );

      /**
       * ================================
       * 5. UPLOAD RESUME
       * ================================
       */

      const resumeForm =
        new FormData();

      resumeForm.append(
        "candidateId",
        candidateId
      );

      resumeForm.append(
        "resume",
        resumeValue
      );

      const resumeData =
        await backendPost(
          `${API_BASE_URL}/api/resumes/upload`,
          {
            body:
              resumeForm,
          }
        );

      const newResumeId =
        findId(
          resumeData
        );

      if (
        !newResumeId
      ) {
        throw new Error(
          "Resume uploaded but resume ID could not be determined."
        );
      }

      resumeId =
        newResumeId;

      await updateSubmission(
        submissionId,
        {
          resumeId,
        }
      );

      /**
       * ================================
       * 6. PROCESS NEW CV
       * ================================
       */

      await backendPost(
        `${API_BASE_URL}/api/resumes/${resumeId}/extract`
      );

      await backendPost(
        `${API_BASE_URL}/api/resumes/${resumeId}/sanitize`
      );

      await backendPost(
        `${API_BASE_URL}/api/resumes/${resumeId}/analyze`
      );

      await backendPost(
        `${API_BASE_URL}/api/candidates/${candidateId}/profile/from-resume/${resumeId}`
      );
    }

    /**
     * ================================
     * 7. CREATE APPLICATION
     * ================================
     */

    console.log(
      `[INBOUND] Creating application: candidate ${candidateId} -> job ${jobId}`
    );

    const applicationData =
      await backendPost(
        `${API_BASE_URL}/api/applications`,
        {
          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              candidateId,
              jobId,
              source,
              status:
                "new",
            }),
        }
      );

    const createdApplicationId =
      findId(
        applicationData
      );

    if (
      !createdApplicationId
    ) {
      throw new Error(
        "Application created but application ID could not be determined."
      );
    }

    applicationId =
      createdApplicationId;

    await updateSubmission(
      submissionId,
      {
        applicationId,
      }
    );

    /**
     * ================================
     * 8. SCORE ONLY THIS JOB
     * ================================
     */

    let scoredJobs =
      0;

    let failedJobs =
      0;

    try {
      await backendPost(
        `${API_BASE_URL}/api/jobs/${jobId}/score-candidate/${candidateId}`
      );

      scoredJobs =
        1;
    } catch (
      scoreError
    ) {
      failedJobs =
        1;

      console.error(
        `[INBOUND] Scoring candidate ${candidateId} for job ${jobId} failed:`,
        scoreError
      );
    }

    /**
     * ================================
     * 9. COMPLETE
     * ================================
     */

    await updateSubmission(
      submissionId,
      {
        processingStatus:
          "completed",

        errorMessage:
          null,
      }
    );

    return NextResponse.json(
      {
        data: {
          duplicate:
            fingerprint.duplicate,

          duplicateReason,

          duplicateOfSubmissionId,

          submissionId,

          applicationId,

          candidateId,

          resumeId,

          jobId,

          firstName:
            firstName ||
            null,

          lastName:
            lastName ||
            null,

          identitySource,

          identityConfidence,

          source,

          externalId,

          resumeSha256,

          processingStatus:
            "completed",

          scoredJobs,

          failedJobs,
        },
      },
      {
        status:
          fingerprint.duplicate
            ? 200
            : 201,
      }
    );
  } catch (error) {
    console.error(
      "Inbound CV processing failed:",
      error
    );

    if (
      submissionId
    ) {
      try {
        await updateSubmission(
          submissionId,
          {
            processingStatus:
              "failed",

            errorMessage:
              error instanceof
                Error
                ? error.message
                : "Inbound CV processing failed.",
          }
        );
      } catch (
        updateError
      ) {
        console.error(
          "Could not record inbound failure:",
          updateError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Inbound CV processing failed.",

        submissionId,

        applicationId,
      },
      {
        status: 500,
      }
    );
  }
}