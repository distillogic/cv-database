import type { MigrationBuilder } from "node-pg-migrate";

export const up = (
  pgm: MigrationBuilder
): void => {
  /**
   * -------------------------------------------------------
   * JOB SENIORITY TARGET
   * -------------------------------------------------------
   */

  pgm.addColumns("jobs", {
    target_level: {
      type: "varchar(50)",
      notNull: true,
      default: "junior",
    },
  });

  pgm.addConstraint(
    "jobs",
    "jobs_target_level_check",
    {
      check:
        "target_level IN ('junior', 'senior', 'expert')",
    }
  );

  pgm.createIndex(
    "jobs",
    "target_level"
  );

  /**
   * -------------------------------------------------------
   * JOB REQUIREMENTS
   * -------------------------------------------------------
   */

  pgm.createTable(
    "job_requirements",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      job_id: {
        type: "bigint",
        notNull: true,
        references: "jobs",
        onDelete: "CASCADE",
      },

      requirement_type: {
        type: "varchar(50)",
        notNull: true,
      },

      name: {
        type: "varchar(300)",
        notNull: true,
      },

      normalized_name: {
        type: "varchar(300)",
        notNull: true,
      },

      importance: {
        type: "varchar(50)",
        notNull: true,
        default: "required",
      },

      /**
       * Relative importance inside the scoring engine.
       *
       * Example:
       * Python required       weight 5
       * PostgreSQL required   weight 4
       * Docker preferred      weight 2
       */
      weight: {
        type: "numeric(6,2)",
        notNull: true,
        default: 1,
      },

      /**
       * Used for requirements such as:
       * English B2
       * C2
       * Advanced
       */
      minimum_level: {
        type: "varchar(100)",
      },

      /**
       * Used only when explicit professional
       * duration is available from documented CV data.
       */
      minimum_years: {
        type: "numeric(5,2)",
      },

      notes: {
        type: "text",
      },

      position: {
        type: "integer",
        notNull: true,
        default: 0,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },

      updated_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.addConstraint(
    "job_requirements",
    "job_requirements_type_check",
    {
      check:
        "requirement_type IN ('skill', 'language', 'education', 'experience', 'certification', 'training', 'driving_license')",
    }
  );

  pgm.addConstraint(
    "job_requirements",
    "job_requirements_importance_check",
    {
      check:
        "importance IN ('required', 'preferred')",
    }
  );

  pgm.addConstraint(
    "job_requirements",
    "job_requirements_weight_check",
    {
      check:
        "weight > 0",
    }
  );

  pgm.addConstraint(
    "job_requirements",
    "job_requirements_minimum_years_check",
    {
      check:
        "minimum_years IS NULL OR minimum_years >= 0",
    }
  );

  pgm.createIndex(
    "job_requirements",
    "job_id"
  );

  pgm.createIndex(
    "job_requirements",
    "requirement_type"
  );

  pgm.createIndex(
    "job_requirements",
    "importance"
  );

  pgm.createIndex(
    "job_requirements",
    [
      "job_id",
      "requirement_type",
      "normalized_name",
    ]
  );

  /**
   * -------------------------------------------------------
   * CANDIDATE <-> JOB SCORE HISTORY
   * -------------------------------------------------------
   *
   * We keep multiple scoring runs instead of overwriting
   * the old result. This gives us an audit trail whenever
   * the CV, job requirements or scoring logic changes.
   */

  pgm.createTable(
    "candidate_job_scores",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidates",
        onDelete: "CASCADE",
      },

      job_id: {
        type: "bigint",
        notNull: true,
        references: "jobs",
        onDelete: "CASCADE",
      },

      /**
       * Which validated AI profile was used
       * when this score was generated.
       */
      source_analysis_run_id: {
        type: "bigint",
        references: "resume_analysis_runs",
        onDelete: "SET NULL",
      },

      target_level: {
        type: "varchar(50)",
        notNull: true,
      },

      /**
       * Seniority estimated specifically
       * for this role/job context.
       */
      estimated_level: {
        type: "varchar(50)",
      },

      /**
       * Overall transparent job-fit score.
       * 0 - 100
       */
      overall_score: {
        type: "numeric(5,2)",
        notNull: true,
      },

      requirements_score: {
        type: "numeric(5,2)",
        notNull: true,
      },

      seniority_score: {
        type: "numeric(5,2)",
        notNull: true,
      },

      matched_required_count: {
        type: "integer",
        notNull: true,
        default: 0,
      },

      total_required_count: {
        type: "integer",
        notNull: true,
        default: 0,
      },

      matched_preferred_count: {
        type: "integer",
        notNull: true,
        default: 0,
      },

      total_preferred_count: {
        type: "integer",
        notNull: true,
        default: 0,
      },

      /**
       * Full transparent explanation:
       *
       * matched / missing requirements,
       * points awarded,
       * evidence used.
       */
      score_breakdown: {
        type: "jsonb",
        notNull: true,
      },

      /**
       * Snapshot of requirements at the exact
       * moment the score was calculated.
       *
       * This makes old results auditable even
       * if the job changes later.
       */
      criteria_snapshot: {
        type: "jsonb",
        notNull: true,
      },

      scoring_version: {
        type: "varchar(50)",
        notNull: true,
      },

      review_status: {
        type: "varchar(50)",
        notNull: true,
        default: "generated",
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },

      reviewed_at: {
        type: "timestamptz",
      },
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_target_level_check",
    {
      check:
        "target_level IN ('junior', 'senior', 'expert')",
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_estimated_level_check",
    {
      check:
        "estimated_level IS NULL OR estimated_level IN ('junior', 'senior', 'expert')",
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_overall_check",
    {
      check:
        "overall_score >= 0 AND overall_score <= 100",
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_requirements_check",
    {
      check:
        "requirements_score >= 0 AND requirements_score <= 100",
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_seniority_check",
    {
      check:
        "seniority_score >= 0 AND seniority_score <= 100",
    }
  );

  pgm.addConstraint(
    "candidate_job_scores",
    "candidate_job_scores_review_status_check",
    {
      check:
        "review_status IN ('generated', 'reviewed')",
    }
  );

  pgm.createIndex(
    "candidate_job_scores",
    "candidate_id"
  );

  pgm.createIndex(
    "candidate_job_scores",
    "job_id"
  );

  pgm.createIndex(
    "candidate_job_scores",
    [
      "job_id",
      "created_at",
    ]
  );

  pgm.createIndex(
    "candidate_job_scores",
    [
      "candidate_id",
      "job_id",
    ]
  );
};

export const down = (
  pgm: MigrationBuilder
): void => {
  pgm.dropTable(
    "candidate_job_scores"
  );

  pgm.dropTable(
    "job_requirements"
  );

  pgm.dropColumns(
    "jobs",
    [
      "target_level",
    ]
  );
};