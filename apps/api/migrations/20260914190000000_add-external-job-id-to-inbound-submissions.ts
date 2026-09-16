import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.addColumns(
    "inbound_submissions",
    {
      external_job_id: {
        type: "varchar(255)",
      },
    }
  );

  pgm.createIndex(
    "inbound_submissions",
    [
      "source",
      "external_job_id",
    ]
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropColumns(
    "inbound_submissions",
    [
      "external_job_id",
    ]
  );
}