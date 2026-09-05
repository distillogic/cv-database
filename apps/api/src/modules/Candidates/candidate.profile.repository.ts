import { pool } from "../../db/pool.js";

import type {
  ResumeAnalysis,
} from "../resumes/resume.analysis.schema.js";

function normalizeProfileTerm(
  value: string
): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("el-GR")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getResumeAnalysisSource(
  candidateId: number,
  resumeId: number
) {
  const result =
    await pool.query(
      `
        SELECT
          r.id AS resume_id,
          r.candidate_id,

          ar.id AS analysis_run_id,
          ar.model,
          ar.prompt_version,
          ar.analysis_json

        FROM resumes r

        LEFT JOIN LATERAL (
          SELECT
            id,
            model,
            prompt_version,
            analysis_json
          FROM resume_analysis_runs
          WHERE resume_id = r.id
            AND status = 'completed'
          ORDER BY
            completed_at DESC NULLS LAST,
            id DESC
          LIMIT 1
        ) ar
          ON TRUE

        WHERE r.id = $1
          AND r.candidate_id = $2
      `,
      [
        resumeId,
        candidateId,
      ]
    );

  return result.rows[0] ?? null;
}

export async function replaceCandidateProfessionalProfile(
  candidateId: number,
  resumeId: number,
  analysisRunId: string | number,
  analysis: ResumeAnalysis
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    await client.query(
      `
        INSERT INTO candidate_profiles (
          candidate_id,
          source_resume_id,
          source_analysis_run_id,
          review_status,
          built_at,
          reviewed_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'generated',
          NOW(),
          NULL,
          NOW()
        )

        ON CONFLICT (candidate_id)
        DO UPDATE SET
          source_resume_id =
            EXCLUDED.source_resume_id,

          source_analysis_run_id =
            EXCLUDED.source_analysis_run_id,

          review_status =
            'generated',

          built_at =
            NOW(),

          reviewed_at =
            NULL,

          updated_at =
            NOW()
      `,
      [
        candidateId,
        resumeId,
        analysisRunId,
      ]
    );

    const profileTables = [
      "candidate_skills",
      "candidate_languages",
      "candidate_work_experience",
      "candidate_education",
      "candidate_training",
      "candidate_certifications",
      "candidate_driving_licenses",
    ];

    for (
      const table of profileTables
    ) {
      await client.query(
        `
          DELETE FROM ${table}
          WHERE candidate_id = $1
        `,
        [candidateId]
      );
    }

    for (
      const skill of analysis.skills
    ) {
      await client.query(
        `
          INSERT INTO candidate_skills (
            candidate_id,
            name,
            normalized_name,
            category,
            evidence
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5::jsonb
          )
        `,
        [
          candidateId,
          skill.name,
          normalizeProfileTerm(
            skill.name
          ),
          skill.category,
          JSON.stringify(
            skill.evidence
          ),
        ]
      );
    }

    for (
      const language of
        analysis.languages
    ) {
      await client.query(
        `
          INSERT INTO candidate_languages (
            candidate_id,
            language,
            normalized_language,
            level,
            evidence
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5::jsonb
          )
        `,
        [
          candidateId,
          language.language,
          normalizeProfileTerm(
            language.language
          ),
          language.level,
          JSON.stringify(
            language.evidence
          ),
        ]
      );
    }

    for (
      const [
        position,
        experience,
      ] of
        analysis.workExperience
          .entries()
    ) {
      await client.query(
        `
          INSERT INTO candidate_work_experience (
            candidate_id,
            role,
            organization,
            dates_text,
            evidence,
            position
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5::jsonb,
            $6
          )
        `,
        [
          candidateId,
          experience.role,
          experience.organization,
          experience.dates,
          JSON.stringify(
            experience.evidence
          ),
          position,
        ]
      );
    }

    for (
      const [
        position,
        education,
      ] of
        analysis.education
          .entries()
    ) {
      await client.query(
        `
          INSERT INTO candidate_education (
            candidate_id,
            qualification,
            institution,
            dates_text,
            status,
            grade,
            evidence,
            position
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7::jsonb,
            $8
          )
        `,
        [
          candidateId,
          education.qualification,
          education.institution,
          education.dates,
          education.status,
          education.grade,
          JSON.stringify(
            education.evidence
          ),
          position,
        ]
      );
    }

    for (
      const [
        position,
        training,
      ] of
        analysis
          .coursesAndTraining
          .entries()
    ) {
      await client.query(
        `
          INSERT INTO candidate_training (
            candidate_id,
            name,
            provider,
            evidence,
            position
          )
          VALUES (
            $1,
            $2,
            $3,
            $4::jsonb,
            $5
          )
        `,
        [
          candidateId,
          training.name,
          training.provider,
          JSON.stringify(
            training.evidence
          ),
          position,
        ]
      );
    }

    for (
      const [
        position,
        certification,
      ] of
        analysis
          .certifications
          .entries()
    ) {
      await client.query(
        `
          INSERT INTO candidate_certifications (
            candidate_id,
            name,
            issuer,
            evidence,
            position
          )
          VALUES (
            $1,
            $2,
            $3,
            $4::jsonb,
            $5
          )
        `,
        [
          candidateId,
          certification.name,
          certification.issuer,
          JSON.stringify(
            certification.evidence
          ),
          position,
        ]
      );
    }

    for (
      const license of
        analysis.drivingLicenses
    ) {
      await client.query(
        `
          INSERT INTO candidate_driving_licenses (
            candidate_id,
            category,
            normalized_category,
            evidence
          )
          VALUES (
            $1,
            $2,
            $3,
            $4::jsonb
          )
        `,
        [
          candidateId,
          license.category,
          normalizeProfileTerm(
            license.category
          ),
          JSON.stringify(
            license.evidence
          ),
        ]
      );
    }

    await client.query(
      "COMMIT"
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

export async function getCandidateProfessionalProfile(
  candidateId: number
) {
  const profileResult =
    await pool.query(
      `
        SELECT
          candidate_id,
          source_resume_id,
          source_analysis_run_id,
          review_status,
          built_at,
          reviewed_at,
          updated_at
        FROM candidate_profiles
        WHERE candidate_id = $1
      `,
      [candidateId]
    );

  const profile =
    profileResult.rows[0];

  if (!profile) {
    return null;
  }

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
          id,
          name,
          category,
          evidence
        FROM candidate_skills
        WHERE candidate_id = $1
        ORDER BY name
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          language,
          level,
          evidence
        FROM candidate_languages
        WHERE candidate_id = $1
        ORDER BY language
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          role,
          organization,
          dates_text,
          evidence
        FROM candidate_work_experience
        WHERE candidate_id = $1
        ORDER BY position, id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          qualification,
          institution,
          dates_text,
          status,
          grade,
          evidence
        FROM candidate_education
        WHERE candidate_id = $1
        ORDER BY position, id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          name,
          provider,
          evidence
        FROM candidate_training
        WHERE candidate_id = $1
        ORDER BY position, id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          name,
          issuer,
          evidence
        FROM candidate_certifications
        WHERE candidate_id = $1
        ORDER BY position, id
      `,
      [candidateId]
    ),

    pool.query(
      `
        SELECT
          id,
          category,
          evidence
        FROM candidate_driving_licenses
        WHERE candidate_id = $1
        ORDER BY category
      `,
      [candidateId]
    ),
  ]);

  return {
    ...profile,

    skills:
      skillsResult.rows,

    languages:
      languagesResult.rows,

    workExperience:
      experienceResult.rows,

    education:
      educationResult.rows,

    coursesAndTraining:
      trainingResult.rows,

    certifications:
      certificationsResult.rows,

    drivingLicenses:
      licensesResult.rows,
  };
}