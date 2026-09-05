import { pool } from "../../db/pool.js";

import type {
  ResumeAnalysis,
} from "./resume.analysis.schema.js";

type CreateResumeInput = {
  candidateId: number;
  applicationId?: number | null;

  originalFilename: string;
  storedFilename: string;
  storagePath: string;

  mimeType: string;
  fileSizeBytes: number;
  fileHash: string;
};

export async function createResume(
  resume: CreateResumeInput
) {
  const result = await pool.query(
    `
      INSERT INTO resumes (
        candidate_id,
        application_id,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        file_size_bytes,
        file_hash,
        processing_status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'pending'
      )

      RETURNING
        id,
        candidate_id,
        application_id,
        original_filename,
        stored_filename,
        mime_type,
        file_size_bytes,
        file_hash,
        processing_status,
        uploaded_at,
        created_at
    `,
    [
      resume.candidateId,
      resume.applicationId ?? null,
      resume.originalFilename,
      resume.storedFilename,
      resume.storagePath,
      resume.mimeType,
      resume.fileSizeBytes,
      resume.fileHash,
    ]
  );

  return result.rows[0];
}

export async function candidateExists(
  candidateId: number
) {
  const result = await pool.query(
    `
      SELECT id
      FROM candidates
      WHERE id = $1
    `,
    [candidateId]
  );

  return result.rowCount === 1;
}

export async function applicationBelongsToCandidate(
  applicationId: number,
  candidateId: number
) {
  const result = await pool.query(
    `
      SELECT id
      FROM applications
      WHERE id = $1
        AND candidate_id = $2
    `,
    [
      applicationId,
      candidateId,
    ]
  );

  return result.rowCount === 1;
}

export async function getResumeById(
  resumeId: number
) {
  const result = await pool.query(
    `
      SELECT
        id,
        candidate_id,
        application_id,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        file_size_bytes,
        file_hash,
        processing_status,
        extracted_text,
        extraction_error,
        extracted_at,
        analysis_text,
        sanitization_error,
        sanitized_at,
        uploaded_at,
        created_at,
        updated_at
      FROM resumes
      WHERE id = $1
    `,
    [resumeId]
  );

  return result.rows[0] ?? null;
}

export async function markResumeExtracting(
  resumeId: number
) {
  await pool.query(
    `
      UPDATE resumes
      SET
        processing_status = 'extracting',
        extraction_error = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [resumeId]
  );
}

export async function saveExtractedResumeText(
  resumeId: number,
  extractedText: string
) {
  const result = await pool.query(
    `
      UPDATE resumes
      SET
        extracted_text = $2,
        extraction_error = NULL,
        extracted_at = NOW(),
        processing_status = 'extracted',
        updated_at = NOW()
      WHERE id = $1

      RETURNING
        id,
        candidate_id,
        application_id,
        original_filename,
        mime_type,
        processing_status,
        extracted_at,
        updated_at
    `,
    [
      resumeId,
      extractedText,
    ]
  );

  return result.rows[0];
}

export async function markResumeExtractionFailed(
  resumeId: number,
  errorMessage: string
) {
  await pool.query(
    `
      UPDATE resumes
      SET
        extraction_error = $2,
        processing_status = 'extraction_failed',
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      resumeId,
      errorMessage,
    ]
  );
}

export async function markResumeSanitizing(
  resumeId: number
) {
  await pool.query(
    `
      UPDATE resumes
      SET
        processing_status = 'sanitizing',
        sanitization_error = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [resumeId]
  );
}

export async function saveSanitizedResumeText(
  resumeId: number,
  analysisText: string
) {
  const result = await pool.query(
    `
      UPDATE resumes
      SET
        analysis_text = $2,
        sanitization_error = NULL,
        sanitized_at = NOW(),
        processing_status = 'sanitized',
        updated_at = NOW()
      WHERE id = $1

      RETURNING
        id,
        candidate_id,
        application_id,
        original_filename,
        processing_status,
        extracted_at,
        sanitized_at,
        updated_at
    `,
    [
      resumeId,
      analysisText,
    ]
  );

  return result.rows[0];
}

export async function markResumeSanitizationFailed(
  resumeId: number,
  errorMessage: string
) {
  await pool.query(
    `
      UPDATE resumes
      SET
        sanitization_error = $2,
        processing_status = 'sanitization_failed',
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      resumeId,
      errorMessage,
    ]
  );
}

export async function createResumeAnalysisRun(
  resumeId: number,
  model: string,
  promptVersion: string
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const result =
      await client.query(
        `
          INSERT INTO resume_analysis_runs (
            resume_id,
            model,
            prompt_version,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            'processing'
          )

          RETURNING
            id,
            resume_id,
            model,
            prompt_version,
            status,
            created_at
        `,
        [
          resumeId,
          model,
          promptVersion,
        ]
      );

    await client.query(
      `
        UPDATE resumes
        SET
          processing_status = 'analyzing',
          updated_at = NOW()
        WHERE id = $1
      `,
      [resumeId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

export async function completeResumeAnalysisRun(
  runId: number,
  resumeId: number,
  analysis: ResumeAnalysis
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const result =
      await client.query(
        `
          UPDATE resume_analysis_runs
          SET
            status = 'completed',
            analysis_json = $2::jsonb,
            error_text = NULL,
            completed_at = NOW()
          WHERE id = $1

          RETURNING
            id,
            resume_id,
            model,
            prompt_version,
            status,
            analysis_json,
            created_at,
            completed_at
        `,
        [
          runId,
          JSON.stringify(
            analysis
          ),
        ]
      );

    await client.query(
      `
        UPDATE resumes
        SET
          processing_status = 'analyzed',
          updated_at = NOW()
        WHERE id = $1
      `,
      [resumeId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

export async function failResumeAnalysisRun(
  runId: number,
  resumeId: number,
  errorMessage: string
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE resume_analysis_runs
        SET
          status = 'failed',
          error_text = $2,
          completed_at = NOW()
        WHERE id = $1
      `,
      [
        runId,
        errorMessage,
      ]
    );

    await client.query(
      `
        UPDATE resumes
        SET
          processing_status = 'analysis_failed',
          updated_at = NOW()
        WHERE id = $1
      `,
      [resumeId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}