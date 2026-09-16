import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.addColumns(
    "applications",
    {
      resume_id: {
        type: "bigint",
        references: "resumes",
        onDelete: "SET NULL",
      },
    }
  );

  pgm.createIndex(
    "applications",
    "resume_id"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropColumns(
    "applications",
    [
      "resume_id",
    ]
  );
}