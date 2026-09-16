import {
  pool,
} from "../../db/pool.js";

export type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  resume_id: string | null;
  source: string;
  status: string;
  applied_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;

  overall_score?:
    number | null;

  requirements_score?:
    number | null;

  seniority_score?:
    number | null;
};

export async function getApplications():
Promise<Application[]> {
  const result =
    await pool.query<Application>(
      `
      SELECT
        a.id,
        a.candidate_id,
        a.job_id,
        a.resume_id,
        a.source,
        a.status,
        a.applied_at,
        a.created_at,
        a.updated_at,

        latest_score.overall_score,
        latest_score.requirements_score,
        latest_score.seniority_score

      FROM applications a

      LEFT JOIN LATERAL (
        SELECT
          cjs.overall_score::float8
            AS overall_score,

          cjs.requirements_score::float8
            AS requirements_score,

          cjs.seniority_score::float8
            AS seniority_score

        FROM candidate_job_scores cjs

        WHERE
          cjs.candidate_id =
            a.candidate_id

          AND cjs.job_id =
            a.job_id

        ORDER BY
          cjs.created_at DESC,
          cjs.id DESC

        LIMIT 1
      ) latest_score
        ON TRUE

      ORDER BY
        a.applied_at DESC,
        a.id DESC
      `
    );

  return result.rows;
}

export async function createApplication(
  values: {
    candidateId: string;
    jobId: string;
    resumeId?: string | null;
    source: string;
    status?: string;
  }
): Promise<Application> {
  const result =
    await pool.query<Application>(
      `
      INSERT INTO applications (
        candidate_id,
        job_id,
        resume_id,
        source,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING *
      `,
      [
        values.candidateId,
        values.jobId,
        values.resumeId ?? null,
        values.source,
        values.status ?? "new",
      ]
    );

  if (
    result.rows.length ===
    0
  ) {
    throw new Error(
      "Application could not be created."
    );
  }

  return result.rows[0];
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<Application | null> {
  const result =
    await pool.query<Application>(
      `
      UPDATE applications

      SET
        status = $2,
        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $1

      RETURNING *
      `,
      [
        applicationId,
        status,
      ]
    );

  return (
    result.rows[0] ??
    null
  );
}