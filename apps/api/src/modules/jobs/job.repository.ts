import { pool } from "../../db/pool.js";

import type {
  CreateJobInput,
} from "./job.schema.js";

function normalizeRequirementName(
  value: string
): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("el-GR")
    .replace(/\s+/g, " ")
    .trim();
}

export async function createJob(
  input: CreateJobInput
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const jobResult =
      await client.query(
        `
          INSERT INTO jobs (
            title,
            description,
            department,
            location,
            status,
            target_level
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )

          RETURNING
            id,
            title,
            description,
            department,
            location,
            status,
            target_level,
            created_at,
            updated_at
        `,
        [
          input.title,
          input.description ?? null,
          input.department ?? null,
          input.location ?? null,
          input.status,
          input.targetLevel,
        ]
      );

    const job =
      jobResult.rows[0];

    for (
      const [
        position,
        requirement,
      ] of input.requirements.entries()
    ) {
      await client.query(
        `
          INSERT INTO job_requirements (
            job_id,
            requirement_type,
            name,
            normalized_name,
            importance,
            weight,
            minimum_level,
            minimum_years,
            notes,
            position
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
            $9,
            $10
          )
        `,
        [
          job.id,
          requirement.type,
          requirement.name,
          normalizeRequirementName(
            requirement.name
          ),
          requirement.importance,
          requirement.weight,
          requirement.minimumLevel ??
            null,
          requirement.minimumYears ??
            null,
          requirement.notes ??
            null,
          position,
        ]
      );
    }

    await client.query("COMMIT");

    return await getJobById(
      Number(job.id)
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

export async function getJobs() {
  const result =
    await pool.query(
      `
        SELECT
          j.id,
          j.title,
          j.description,
          j.department,
          j.location,
          j.status,
          j.target_level,
          j.created_at,
          j.updated_at,

          COUNT(
            jr.id
          )::int AS requirements_count

        FROM jobs j

        LEFT JOIN job_requirements jr
          ON jr.job_id = j.id

        GROUP BY
          j.id

        ORDER BY
          j.created_at DESC
      `
    );

  return result.rows;
}

export async function getJobById(
  jobId: number
) {
  const jobResult =
    await pool.query(
      `
        SELECT
          id,
          title,
          description,
          department,
          location,
          status,
          target_level,
          created_at,
          updated_at
        FROM jobs
        WHERE id = $1
      `,
      [jobId]
    );

  const job =
    jobResult.rows[0];

  if (!job) {
    return null;
  }

  const requirementsResult =
    await pool.query(
      `
        SELECT
          id,
          requirement_type,
          name,
          importance,
          weight,
          minimum_level,
          minimum_years,
          notes,
          position,
          created_at,
          updated_at
        FROM job_requirements
        WHERE job_id = $1
        ORDER BY
          position,
          id
      `,
      [jobId]
    );

  return {
    ...job,

    requirements:
      requirementsResult.rows,
  };
}