import { pool } from "../../db/pool.js";

export type InboundSubmission = {
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
    string | null;

  created_at:
    Date | string;

  updated_at:
    Date | string;
};

export async function reserveInboundSubmission(
  source: string,
  externalId: string
): Promise<{
  created: boolean;
  submission: InboundSubmission;
}> {
  const inserted =
    await pool.query<InboundSubmission>(
      `
      INSERT INTO inbound_submissions (
        source,
        external_id,
        processing_status
      )
      VALUES (
        $1,
        $2,
        'received'
      )
      ON CONFLICT (
        source,
        external_id
      )
      DO NOTHING
      RETURNING *
      `,
      [
        source,
        externalId,
      ]
    );

  if (
    inserted.rows.length >
    0
  ) {
    return {
      created: true,
      submission:
        inserted.rows[0],
    };
  }

  const existing =
    await pool.query<InboundSubmission>(
      `
      SELECT *
      FROM inbound_submissions
      WHERE
        source = $1
        AND external_id = $2
      LIMIT 1
      `,
      [
        source,
        externalId,
      ]
    );

  if (
    existing.rows.length ===
    0
  ) {
    throw new Error(
      "Inbound submission conflict occurred but existing submission could not be found."
    );
  }

  return {
    created: false,
    submission:
      existing.rows[0],
  };
}

export async function updateInboundSubmission(
  id: string,
  values: {
    candidateId?:
      string | null;

    resumeId?:
      string | null;

    applicationId?:
      string | null;

    processingStatus?:
      string;

    errorMessage?:
      string | null;

    resumeSha256?:
      string | null;

    duplicateOfSubmissionId?:
      string | null;
  }
): Promise<InboundSubmission> {
  const hasErrorMessage =
    Object.prototype
      .hasOwnProperty.call(
        values,
        "errorMessage"
      );

  const result =
    await pool.query<InboundSubmission>(
      `
      UPDATE inbound_submissions

      SET
        candidate_id =
          COALESCE(
            $2,
            candidate_id
          ),

        resume_id =
          COALESCE(
            $3,
            resume_id
          ),

        application_id =
          COALESCE(
            $4,
            application_id
          ),

        processing_status =
          COALESCE(
            $5,
            processing_status
          ),

        resume_sha256 =
          COALESCE(
            $6,
            resume_sha256
          ),

        duplicate_of_submission_id =
          COALESCE(
            $7,
            duplicate_of_submission_id
          ),

        error_message =
          CASE
            WHEN $8::boolean
              THEN $9
            ELSE error_message
          END,

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $1

      RETURNING *
      `,
      [
        id,

        values.candidateId ??
          null,

        values.resumeId ??
          null,

        values.applicationId ??
          null,

        values.processingStatus ??
          null,

        values.resumeSha256 ??
          null,

        values
          .duplicateOfSubmissionId ??
          null,

        hasErrorMessage,

        values.errorMessage ??
          null,
      ]
    );

  if (
    result.rows.length ===
    0
  ) {
    throw new Error(
      "Inbound submission not found."
    );
  }

  return result.rows[0];
}

export async function registerResumeFingerprint(
  submissionId: string,
  resumeSha256: string
): Promise<{
  duplicate: boolean;

  submission:
    InboundSubmission;

  duplicateOf:
    InboundSubmission | null;
}> {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const currentResult =
      await client.query<InboundSubmission>(
        `
        UPDATE inbound_submissions

        SET
          resume_sha256 = $2,
          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING *
        `,
        [
          submissionId,
          resumeSha256,
        ]
      );

    if (
      currentResult.rows
        .length === 0
    ) {
      throw new Error(
        "Inbound submission not found."
      );
    }

    /**
     * Find a previous successfully
     * processed copy of the exact
     * same CV.
     */
    const duplicateResult =
      await client.query<InboundSubmission>(
        `
        SELECT *

        FROM inbound_submissions

        WHERE
          resume_sha256 = $1

          AND id <> $2

          AND processing_status =
            'completed'

          AND candidate_id
            IS NOT NULL

          AND resume_id
            IS NOT NULL

        ORDER BY
          created_at ASC,
          id ASC

        LIMIT 1
        `,
        [
          resumeSha256,
          submissionId,
        ]
      );

    const duplicate =
      duplicateResult
        .rows[0] ??
      null;

    if (!duplicate) {
      await client.query(
        "COMMIT"
      );

      return {
        duplicate: false,

        submission:
          currentResult.rows[0],

        duplicateOf:
          null,
      };
    }

    /**
     * Same exact CV already exists.
     *
     * Reuse Candidate + Resume,
     * but DO NOT mark the new
     * submission completed yet.
     *
     * A new Application still has
     * to be created for its Job.
     */
    const linkedResult =
      await client.query<InboundSubmission>(
        `
        UPDATE inbound_submissions

        SET
          candidate_id = $2,

          resume_id = $3,

          duplicate_of_submission_id =
            $4,

          processing_status =
            'processing',

          error_message =
            NULL,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING *
        `,
        [
          submissionId,
          duplicate.candidate_id,
          duplicate.resume_id,
          duplicate.id,
        ]
      );

    await client.query(
      "COMMIT"
    );

    return {
      duplicate: true,

      submission:
        linkedResult.rows[0],

      duplicateOf:
        duplicate,
    };
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // Ignore rollback failure.
    }

    throw error;
  } finally {
    client.release();
  }
}