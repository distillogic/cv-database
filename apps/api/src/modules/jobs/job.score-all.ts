import {
  pool,
} from "../../db/pool.js";

import {
  getJobRanking,
  scoreAndSaveCandidateForJob,
} from "./job.score.repository.js";

export async function scoreAllCandidatesForJob(
  jobId: number
) {
  /**
   * First make sure the job exists.
   */
  const jobResult =
    await pool.query(
      `
        SELECT id
        FROM jobs
        WHERE id = $1
      `,
      [jobId]
    );

  if (!jobResult.rows[0]) {
    return {
      status:
        "job_not_found" as const,
    };
  }

  /**
   * Only candidates with a generated
   * professional profile can be scored.
   */
  const candidatesResult =
    await pool.query(
      `
        SELECT
          cp.candidate_id
        FROM candidate_profiles cp

        INNER JOIN candidates c
          ON c.id =
            cp.candidate_id

        ORDER BY
          cp.candidate_id ASC
      `
    );

  const results: Array<{
    candidateId: number;
    status:
      | "scored"
      | "failed";
    scoreId?: string;
    overallScore?: number;
    profileReviewStatus?: string;
    error?: string;
  }> = [];

  /**
   * Score sequentially for now.
   *
   * This is intentionally simple and
   * avoids opening a large number of
   * DB operations at the same time.
   */
  for (
    const row of
      candidatesResult.rows
  ) {
    const candidateId =
      Number(
        row.candidate_id
      );

    try {
      const result =
        await scoreAndSaveCandidateForJob(
          jobId,
          candidateId
        );

      if (
        result.status ===
        "success"
      ) {
        results.push({
          candidateId,

          status:
            "scored",

          scoreId:
            String(
              result.score.id
            ),

          overallScore:
            Number(
              result.score
                .overall_score
            ),

          profileReviewStatus:
            result
              .profileReviewStatus,
        });

        continue;
      }

      results.push({
        candidateId,

        status:
          "failed",

        error:
          result.status,
      });
    } catch (error) {
      console.error(
        `Failed to score candidate ${candidateId} for job ${jobId}:`,
        error
      );

      results.push({
        candidateId,

        status:
          "failed",

        error:
          "scoring_error",
      });
    }
  }

  /**
   * Retrieve the latest score
   * for each candidate after
   * this scoring run.
   */
  const ranking =
    await getJobRanking(
      jobId
    );

  const scoredCount =
    results.filter(
      (result) =>
        result.status ===
        "scored"
    ).length;

  const failedCount =
    results.filter(
      (result) =>
        result.status ===
        "failed"
    ).length;

  return {
    status:
      "success" as const,

    processedCount:
      results.length,

    scoredCount,

    failedCount,

    results,

    ranking:
      ranking?.ranking ?? [],
  };
}