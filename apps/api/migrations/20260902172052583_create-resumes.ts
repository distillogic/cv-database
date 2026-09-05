import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("resumes", {
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

    application_id: {
      type: "bigint",
      references: "applications",
      onDelete: "SET NULL",
    },

    original_filename: {
      type: "varchar(255)",
      notNull: true,
    },

    stored_filename: {
      type: "varchar(255)",
      notNull: true,
    },

    storage_path: {
      type: "text",
      notNull: true,
    },

    mime_type: {
      type: "varchar(100)",
      notNull: true,
    },

    file_size_bytes: {
      type: "bigint",
      notNull: true,
    },

    file_hash: {
      type: "varchar(64)",
    },

    processing_status: {
      type: "varchar(50)",
      notNull: true,
      default: "pending",
    },

    uploaded_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("resumes", "candidate_id");
  pgm.createIndex("resumes", "application_id");
  pgm.createIndex("resumes", "file_hash");
  pgm.createIndex("resumes", "processing_status");
  pgm.createIndex("resumes", "uploaded_at");
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("resumes");
};