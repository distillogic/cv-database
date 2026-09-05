import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns("resumes", {
    extracted_text: {
      type: "text",
    },

    extraction_error: {
      type: "text",
    },

    extracted_at: {
      type: "timestamptz",
    },
  });
};

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropColumns("resumes", [
    "extracted_text",
    "extraction_error",
    "extracted_at",
  ]);
};