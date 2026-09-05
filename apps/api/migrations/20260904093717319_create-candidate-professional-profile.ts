import type { MigrationBuilder } from "node-pg-migrate";

export const up = (
  pgm: MigrationBuilder
): void => {
  pgm.createTable(
    "candidate_profiles",
    {
      candidate_id: {
        type: "bigint",
        primaryKey: true,
        references: "candidates",
        onDelete: "CASCADE",
      },

      source_resume_id: {
        type: "bigint",
        references: "resumes",
        onDelete: "SET NULL",
      },

      source_analysis_run_id: {
        type: "bigint",
        references: "resume_analysis_runs",
        onDelete: "SET NULL",
      },

      review_status: {
        type: "varchar(50)",
        notNull: true,
        default: "generated",
      },

      built_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },

      reviewed_at: {
        type: "timestamptz",
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

  pgm.createTable(
    "candidate_skills",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      name: {
        type: "varchar(200)",
        notNull: true,
      },

      normalized_name: {
        type: "varchar(200)",
        notNull: true,
      },

      category: {
        type: "varchar(50)",
        notNull: true,
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_skills",
    [
      "candidate_id",
      "normalized_name",
    ],
    {
      unique: true,
    }
  );

  pgm.createTable(
    "candidate_languages",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      language: {
        type: "varchar(100)",
        notNull: true,
      },

      normalized_language: {
        type: "varchar(100)",
        notNull: true,
      },

      level: {
        type: "varchar(100)",
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_languages",
    [
      "candidate_id",
      "normalized_language",
    ],
    {
      unique: true,
    }
  );

  pgm.createTable(
    "candidate_work_experience",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      role: {
        type: "varchar(200)",
        notNull: true,
      },

      organization: {
        type: "varchar(250)",
      },

      dates_text: {
        type: "varchar(150)",
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      position: {
        type: "integer",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_work_experience",
    "candidate_id"
  );

  pgm.createTable(
    "candidate_education",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      qualification: {
        type: "varchar(300)",
        notNull: true,
      },

      institution: {
        type: "varchar(300)",
      },

      dates_text: {
        type: "varchar(150)",
      },

      status: {
        type: "varchar(150)",
      },

      grade: {
        type: "varchar(100)",
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      position: {
        type: "integer",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_education",
    "candidate_id"
  );

  pgm.createTable(
    "candidate_training",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      name: {
        type: "varchar(300)",
        notNull: true,
      },

      provider: {
        type: "varchar(300)",
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      position: {
        type: "integer",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_training",
    "candidate_id"
  );

  pgm.createTable(
    "candidate_certifications",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      name: {
        type: "varchar(300)",
        notNull: true,
      },

      issuer: {
        type: "varchar(300)",
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      position: {
        type: "integer",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_certifications",
    "candidate_id"
  );

  pgm.createTable(
    "candidate_driving_licenses",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      candidate_id: {
        type: "bigint",
        notNull: true,
        references: "candidate_profiles",
        onDelete: "CASCADE",
      },

      category: {
        type: "varchar(50)",
        notNull: true,
      },

      normalized_category: {
        type: "varchar(50)",
        notNull: true,
      },

      evidence: {
        type: "jsonb",
        notNull: true,
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },
    }
  );

  pgm.createIndex(
    "candidate_driving_licenses",
    [
      "candidate_id",
      "normalized_category",
    ],
    {
      unique: true,
    }
  );
};

export const down = (
  pgm: MigrationBuilder
): void => {
  pgm.dropTable(
    "candidate_driving_licenses"
  );

  pgm.dropTable(
    "candidate_certifications"
  );

  pgm.dropTable(
    "candidate_training"
  );

  pgm.dropTable(
    "candidate_education"
  );

  pgm.dropTable(
    "candidate_work_experience"
  );

  pgm.dropTable(
    "candidate_languages"
  );

  pgm.dropTable(
    "candidate_skills"
  );

  pgm.dropTable(
    "candidate_profiles"
  );
};