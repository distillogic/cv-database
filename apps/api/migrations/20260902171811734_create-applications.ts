import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("applications", {
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

    source: {
      type: "varchar(50)",
      notNull: true,
      default: "manual",
    },

    status: {
      type: "varchar(50)",
      notNull: true,
      default: "new",
    },

    applied_at: {
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

  pgm.createIndex("applications", "candidate_id");
  pgm.createIndex("applications", "job_id");
  pgm.createIndex("applications", "source");
  pgm.createIndex("applications", "status");
  pgm.createIndex("applications", "applied_at");
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("applications");
};