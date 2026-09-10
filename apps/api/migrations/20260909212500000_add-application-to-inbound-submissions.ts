import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.addColumns(
    "inbound_submissions",
    {
      application_id: {
        type: "bigint",
        references:
          "applications",
        onDelete: "SET NULL",
      },
    }
  );

  pgm.createIndex(
    "inbound_submissions",
    "application_id"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropColumns(
    "inbound_submissions",
    [
      "application_id",
    ]
  );
}