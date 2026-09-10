import {
  pool,
} from "../../db/pool.js";

import {
  scoreCandidateForJob,
  type CandidateProfileForScoring,
  type JobForScoring,
  type RequirementForScoring,
  type RequirementType,
  type SeniorityLevel,
} from "./job.scoring.js";

export async function scoreAndSaveCandidateForJob(
  jobId: number,
  candidateId: number
) {
  const jobResult =
    await pool.query(
      `
        SELECT
          id,
          title,
          target_level
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

  const candidateResult =
    await pool.query(
      `
        SELECT id
        FROM candidates
        WHERE id = $1
      `,
      [candidateId]
    );

  if (!candidateResult.rows[0]) {
    return {
      status:
        "candidate_not_found" as const,
    };
  }

  const profileResult =
    await pool.query(
      `
        SELECT
          candidate_id,
          source_analysis_run_id,
          review_status
        FROM candidate_profiles
        WHERE candidate_id = $1
      `,
      [candidateId]
    );

  const profileRow =
    profileResult.rows[0];

  if (!profileRow) {
    return {
      status:
        "profile_not_found" as const,
    };
  }

  const requirementsResult =
    await pool.query(
      `
        SELECT
          id,
          requirement_type,
          name,
          importance,
          weight::float8 AS weight,
          minimum_level,
          minimum_years::float8
            AS minimum_years,
          notes
        FROM job_requirements
        WHERE job_id = $1
        ORDER BY
          position,
          id
      `,
      [jobId]
    );

  const [
    skillsResult,
    languagesResult,
    experienceResult,
    educationResult,
    trainingResult,
    certificationsResult,
    licensesResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          name,
          evidence
        FROM candidate_skills
        WHERE candidate_id = $1
        ORDER BY id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          language,
          level,
          evidence
        FROM candidate_languages
        WHERE candidate_id = $1
        ORDER BY id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          role,
          organization,
          dates_text,
          evidence
        FROM candidate_work_experience
        WHERE candidate_id = $1
        ORDER BY
          position,
          id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          qualification,
          institution,
          status,
          grade,
          evidence
        FROM candidate_education
        WHERE candidate_id = $1
        ORDER BY
          position,
          id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          name,
          provider,
          evidence
        FROM candidate_training
        WHERE candidate_id = $1
        ORDER BY
          position,
          id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          name,
          issuer,
          evidence
        FROM candidate_certifications
        WHERE candidate_id = $1
        ORDER BY
          position,
          id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          category,
          evidence
        FROM candidate_driving_licenses
        WHERE candidate_id = $1
        ORDER BY id
      `,
      [candidateId]
    ),
  ]);

  const job: JobForScoring = {
    id:
      String(
        jobResult.rows[0].id
      ),

    title:
      jobResult.rows[0].title,

    targetLevel:
      jobResult.rows[0]
        .target_level as SeniorityLevel,
  };

  const requirements:
    RequirementForScoring[] =
      requirementsResult.rows.map(
        (row) => ({
          id:
            String(row.id),

          type:
            row.requirement_type as RequirementType,

          name:
            row.name,

          importance:
            row.importance,

          weight:
            Number(row.weight),

          minimumLevel:
            row.minimum_level,

          minimumYears:
            row.minimum_years ===
            null
              ? null
              : Number(
                  row.minimum_years
                ),

          notes:
            row.notes,
        })
      );

  const profile:
    CandidateProfileForScoring = {
      skills:
        skillsResult.rows.map(
          (row) => ({
            name:
              row.name,
            evidence:
              row.evidence,
          })
        ),

      languages:
        languagesResult.rows.map(
          (row) => ({
            language:
              row.language,
            level:
              row.level,
            evidence:
              row.evidence,
          })
        ),

      workExperience:
        experienceResult.rows.map(
          (row) => ({
            role:
              row.role,
            organization:
              row.organization,
            datesText:
              row.dates_text,
            evidence:
              row.evidence,
          })
        ),

      education:
        educationResult.rows.map(
          (row) => ({
            qualification:
              row.qualification,
            institution:
              row.institution,
            status:
              row.status,
            grade:
              row.grade,
            evidence:
              row.evidence,
          })
        ),

      training:
        trainingResult.rows.map(
          (row) => ({
            name:
              row.name,
            provider:
              row.provider,
            evidence:
              row.evidence,
          })
        ),

      certifications:
        certificationsResult.rows.map(
          (row) => ({
            name:
              row.name,
            issuer:
              row.issuer,
            evidence:
              row.evidence,
          })
        ),

      drivingLicenses:
        licensesResult.rows.map(
          (row) => ({
            category:
              row.category,
            evidence:
              row.evidence,
          })
        ),
    };

  const score =
    scoreCandidateForJob({
      job,
      requirements,
      profile,
    });

  const insertResult =
    await pool.query(
      `
        INSERT INTO candidate_job_scores (
          candidate_id,
          job_id,
          source_analysis_run_id,
          target_level,
          estimated_level,
          overall_score,
          requirements_score,
          seniority_score,
          matched_required_count,
          total_required_count,
          matched_preferred_count,
          total_preferred_count,
          score_breakdown,
          criteria_snapshot,
          scoring_version,
          review_status
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
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          'generated'
        )

        RETURNING
          id,
          candidate_id,
          job_id,
          source_analysis_run_id,
          target_level,
          estimated_level,
          overall_score::float8
            AS overall_score,
          requirements_score::float8
            AS requirements_score,
          seniority_score::float8
            AS seniority_score,
          matched_required_count,
          total_required_count,
          matched_preferred_count,
          total_preferred_count,
          score_breakdown,
          criteria_snapshot,
          scoring_version,
          review_status,
          created_at
      `,
      [
        candidateId,
        jobId,
        profileRow
          .source_analysis_run_id,
        score.targetLevel,
        score.estimatedLevel,
        score.overallScore,
        score.requirementsScore,
        score.seniorityScore,
        score.matchedRequiredCount,
        score.totalRequiredCount,
        score.matchedPreferredCount,
        score.totalPreferredCount,
        score.scoreBreakdown,
        score.criteriaSnapshot,
        score.scoringVersion,
      ]
    );

  return {
    status:
      "success" as const,

    score:
      insertResult.rows[0],

    profileReviewStatus:
      profileRow.review_status,
  };
}

export async function getJobRanking(
  jobId: number
) {
  const jobResult =
    await pool.query(
      `
        SELECT
          id,
          title,
          target_level
        FROM jobs
        WHERE id = $1
      `,
      [jobId]
    );

  if (!jobResult.rows[0]) {
    return null;
  }

  const rankingResult =
    await pool.query(
      `
        SELECT *
        FROM (
          SELECT DISTINCT ON (
            cjs.candidate_id
          )
            cjs.id,
            cjs.candidate_id,
            c.first_name,
            c.last_name,
            cjs.job_id,
            cjs.overall_score::float8
              AS overall_score,
            cjs.requirements_score::float8
              AS requirements_score,
            cjs.seniority_score::float8
              AS seniority_score,
            cjs.target_level,
            cjs.estimated_level,
            cjs.matched_required_count,
            cjs.total_required_count,
            cjs.matched_preferred_count,
            cjs.total_preferred_count,
            cjs.score_breakdown,
            cjs.scoring_version,
            cjs.review_status,
            cjs.created_at
          FROM candidate_job_scores cjs

          INNER JOIN candidates c
            ON c.id =
              cjs.candidate_id

          WHERE cjs.job_id = $1

          ORDER BY
            cjs.candidate_id,
            cjs.created_at DESC,
            cjs.id DESC
        ) latest

        ORDER BY
          overall_score DESC,
          candidate_id ASC
      `,
      [jobId]
    );

  return {
    job: {
      id:
        String(
          jobResult.rows[0].id
        ),

      title:
        jobResult.rows[0]
          .title,

      targetLevel:
        jobResult.rows[0]
          .target_level,
    },

    ranking:
      rankingResult.rows.map(
        (row, index) => ({
          rank:
            index + 1,
          ...row,
        })
      ),
  };
}