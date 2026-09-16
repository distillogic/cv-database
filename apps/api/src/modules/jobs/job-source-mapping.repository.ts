import {
  pool,
} from "../../db/pool.js";

export type JobSourceMapping = {
  id: string;
  source: string;
  external_job_id: string;
  job_id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function upsertJobSourceMapping(
  values: {
    source: string;
    externalJobId: string;
    jobId: string;
  }
): Promise<JobSourceMapping> {
  const result =
    await pool.query<JobSourceMapping>(
      `
      INSERT INTO job_source_mappings (
        source,
        external_job_id,
        job_id
      )
      VALUES (
        $1,
        $2,
        $3
      )

      ON CONFLICT (
        source,
        external_job_id
      )

      DO UPDATE SET
        job_id = EXCLUDED.job_id,
        updated_at = CURRENT_TIMESTAMP

      RETURNING *
      `,
      [
        values.source,
        values.externalJobId,
        values.jobId,
      ]
    );

  if (
    result.rows.length === 0
  ) {
    throw new Error(
      "Job source mapping could not be saved."
    );
  }

  return result.rows[0];
}

export async function findJobSourceMapping(
  source: string,
  externalJobId: string
): Promise<JobSourceMapping | null> {
  const result =
    await pool.query<JobSourceMapping>(
      `
      SELECT *
      FROM job_source_mappings

      WHERE
        source = $1
        AND external_job_id = $2

      LIMIT 1
      `,
      [
        source,
        externalJobId,
      ]
    );

  return (
    result.rows[0] ??
    null
  );
}