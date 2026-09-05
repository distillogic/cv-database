import type { MigrationBuilder } from "node-pg-migrate";

export const up = (
  pgm: MigrationBuilder
): void => {
  pgm.addColumns("resumes", {
    analysis_text: {
      type: "text",
    },

    sanitization_error: {
      type: "text",
    },

    sanitized_at: {
      type: "timestamptz",
    },
  });
};

export const down = (
  pgm: MigrationBuilder
): void => {
  pgm.dropColumns("resumes", [
    "analysis_text",
    "sanitization_error",
    "sanitized_at",
  ]);
};