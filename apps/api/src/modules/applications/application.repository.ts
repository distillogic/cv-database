import {
  pool,
} from "../../db/pool.js";

export type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  source: string;
  status: string;
  applied_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function createApplication(
  values: {
    candidateId: string;
    jobId: string;
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
        source,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING *
      `,
      [
        values.candidateId,
        values.jobId,
        values.source,
        values.status ?? "new",
      ]
    );

  if (
    result.rows.length === 0
  ) {
    throw new Error(
      "Application could not be created."
    );
  }

  return result.rows[0];
}