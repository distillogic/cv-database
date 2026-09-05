import type { MigrationBuilder } from "node-pg-migrate";

export const up = (
  pgm: MigrationBuilder
): void => {
  pgm.createTable(
    "resume_analysis_runs",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      resume_id: {
        type: "bigint",
        notNull: true,
        references: "resumes",
        onDelete: "CASCADE",
      },

      model: {
        type: "varchar(150)",
        notNull: true,
      },

      prompt_version: {
        type: "varchar(50)",
        notNull: true,
      },

      status: {
        type: "varchar(50)",
        notNull: true,
        default: "processing",
      },

      analysis_json: {
        type: "jsonb",
      },

      error_text: {
        type: "text",
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func(
          "CURRENT_TIMESTAMP"
        ),
      },

      completed_at: {
        type: "timestamptz",
      },
    }
  );

  pgm.createIndex(
    "resume_analysis_runs",
    "resume_id"
  );

  pgm.createIndex(
    "resume_analysis_runs",
    "status"
  );

  pgm.createIndex(
    "resume_analysis_runs",
    "created_at"
  );
};

export const down = (
  pgm: MigrationBuilder
): void => {
  pgm.dropTable(
    "resume_analysis_runs"
  );
};