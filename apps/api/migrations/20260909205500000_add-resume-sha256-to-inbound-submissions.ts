import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.addColumns(
    "inbound_submissions",
    {
      resume_sha256: {
        type: "varchar(64)",
      },

      duplicate_of_submission_id: {
        type: "bigint",
        references:
          "inbound_submissions",
        onDelete: "SET NULL",
      },
    }
  );

  pgm.addConstraint(
    "inbound_submissions",
    "inbound_submissions_resume_sha256_format_check",
    {
      check: `
        resume_sha256 IS NULL
        OR resume_sha256 ~ '^[0-9a-f]{64}$'
      `,
    }
  );

  pgm.createIndex(
    "inbound_submissions",
    "resume_sha256"
  );

  pgm.createIndex(
    "inbound_submissions",
    "duplicate_of_submission_id"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropConstraint(
    "inbound_submissions",
    "inbound_submissions_resume_sha256_format_check"
  );

  pgm.dropColumns(
    "inbound_submissions",
    [
      "resume_sha256",
      "duplicate_of_submission_id",
    ]
  );
}