import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("jobs", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    title: {
      type: "varchar(200)",
      notNull: true,
    },

    description: {
      type: "text",
    },

    department: {
      type: "varchar(150)",
    },

    location: {
      type: "varchar(255)",
    },

    status: {
      type: "varchar(50)",
      notNull: true,
      default: "open",
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

  pgm.createIndex("jobs", "title");
  pgm.createIndex("jobs", "department");
  pgm.createIndex("jobs", "status");
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("jobs");
};