import { pool } from "../../db/pool.js";

import type { CreateCandidateInput } from "./candidate.schema.js";

export async function createCandidate(
  candidate: CreateCandidateInput
) {
  const result = await pool.query(
    `
      INSERT INTO candidates (
        first_name,
        last_name,
        email,
        phone,
        location,
        status,
        source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)

      RETURNING
        id,
        first_name,
        last_name,
        email,
        phone,
        location,
        status,
        source,
        created_at,
        updated_at
    `,
    [
      candidate.firstName,
      candidate.lastName,
      candidate.email ?? null,
      candidate.phone ?? null,
      candidate.location ?? null,
      candidate.status,
      candidate.source,
    ]
  );

  return result.rows[0];
}

export async function getCandidates() {
  const result = await pool.query(`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      location,
      status,
      source,
      created_at,
      updated_at
    FROM candidates
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function getCandidateById(id: number) {
  const result = await pool.query(
    `
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        location,
        status,
        source,
        created_at,
        updated_at
      FROM candidates
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}