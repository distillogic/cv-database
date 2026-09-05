import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable("candidates", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    first_name: {
      type: "varchar(100)",
      notNull: true,
    },

    last_name: {
      type: "varchar(100)",
      notNull: true,
    },

    email: {
      type: "varchar(255)",
    },

    phone: {
      type: "varchar(50)",
    },

    location: {
      type: "varchar(255)",
    },

    status: {
      type: "varchar(50)",
      notNull: true,
      default: "new",
    },

    source: {
      type: "varchar(50)",
      notNull: true,
      default: "manual",
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

  pgm.createIndex("candidates", "email");
  pgm.createIndex("candidates", "phone");
  pgm.createIndex("candidates", "status");
  pgm.createIndex("candidates", "source");
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("candidates");
};