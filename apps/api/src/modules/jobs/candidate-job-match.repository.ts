import {
  pool,
} from "../../db/pool.js";

type CandidateJobMatchRow = {
  score_id: string | number;
  candidate_id: string | number;
  job_id: string | number;

  job_title:
    string;

  job_department:
    string | null;

  job_location:
    string | null;

  job_status:
    string | null;

  target_level:
    string;

  estimated_level:
    string | null;

  overall_score:
    number;

  requirements_score:
    number;

  seniority_score:
    number;

  matched_required_count:
    number;

  total_required_count:
    number;

  matched_preferred_count:
    number;

  total_preferred_count:
    number;

  score_breakdown:
    unknown;

  criteria_snapshot:
    unknown;

  scoring_version:
    string | null;

  review_status:
    string | null;

  created_at:
    Date | string;
};

export type CandidateJobMatch = {
  scoreId:
    string;

  candidateId:
    string;

  jobId:
    string;

  job: {
    id: string;
    title: string;
    department:
      string | null;
    location:
      string | null;
    status:
      string | null;
  };

  targetLevel:
    string;

  estimatedLevel:
    string | null;

  overallScore:
    number;

  requirementsScore:
    number;

  seniorityScore:
    number;

  matchedRequiredCount:
    number;

  totalRequiredCount:
    number;

  matchedPreferredCount:
    number;

  totalPreferredCount:
    number;

  scoreBreakdown:
    unknown;

  criteriaSnapshot:
    unknown;

  scoringVersion:
    string | null;

  reviewStatus:
    string | null;

  scoredAt:
    Date | string;
};

export async function getCandidateJobMatches(
  candidateId: number
): Promise<{
  candidateId: string;
  matches:
    CandidateJobMatch[];
} | null> {
  const candidateResult =
    await pool.query<{
      id:
        string | number;
    }>(
      `
      SELECT id

      FROM candidates

      WHERE id = $1

      LIMIT 1
      `,
      [
        candidateId,
      ]
    );

  if (
    !candidateResult
      .rows[0]
  ) {
    return null;
  }

  /**
   * candidate_job_scores keeps
   * historical scoring runs.
   *
   * For the candidate profile we
   * return only the latest score
   * for each Job.
   */
  const result =
    await pool.query<CandidateJobMatchRow>(
      `
      SELECT *

      FROM (
        SELECT DISTINCT ON (
          cjs.job_id
        )

          cjs.id
            AS score_id,

          cjs.candidate_id,

          cjs.job_id,

          j.title
            AS job_title,

          j.department
            AS job_department,

          j.location
            AS job_location,

          j.status
            AS job_status,

          cjs.target_level,

          cjs.estimated_level,

          cjs.overall_score::float8
            AS overall_score,

          cjs.requirements_score::float8
            AS requirements_score,

          cjs.seniority_score::float8
            AS seniority_score,

          cjs.matched_required_count,

          cjs.total_required_count,

          cjs.matched_preferred_count,

          cjs.total_preferred_count,

          cjs.score_breakdown,

          cjs.criteria_snapshot,

          cjs.scoring_version,

          cjs.review_status,

          cjs.created_at

        FROM candidate_job_scores cjs

        INNER JOIN jobs j
          ON j.id =
            cjs.job_id

        WHERE
          cjs.candidate_id =
            $1

        ORDER BY
          cjs.job_id,
          cjs.created_at DESC,
          cjs.id DESC

      ) latest

      ORDER BY
        latest.created_at DESC,
        latest.job_id ASC
      `,
      [
        candidateId,
      ]
    );

  const matches:
    CandidateJobMatch[] =
      result.rows.map(
        (row) => ({
          scoreId:
            String(
              row.score_id
            ),

          candidateId:
            String(
              row.candidate_id
            ),

          jobId:
            String(
              row.job_id
            ),

          job: {
            id:
              String(
                row.job_id
              ),

            title:
              row.job_title,

            department:
              row.job_department,

            location:
              row.job_location,

            status:
              row.job_status,
          },

          targetLevel:
            row.target_level,

          estimatedLevel:
            row.estimated_level,

          overallScore:
            Number(
              row.overall_score
            ),

          requirementsScore:
            Number(
              row.requirements_score
            ),

          seniorityScore:
            Number(
              row.seniority_score
            ),

          matchedRequiredCount:
            Number(
              row.matched_required_count
            ),

          totalRequiredCount:
            Number(
              row.total_required_count
            ),

          matchedPreferredCount:
            Number(
              row.matched_preferred_count
            ),

          totalPreferredCount:
            Number(
              row.total_preferred_count
            ),

          scoreBreakdown:
            row.score_breakdown,

          criteriaSnapshot:
            row.criteria_snapshot,

          scoringVersion:
            row.scoring_version,

          reviewStatus:
            row.review_status,

          scoredAt:
            row.created_at,
        })
      );

  return {
    candidateId:
      String(
        candidateResult
          .rows[0]
          .id
      ),

    matches,
  };
}