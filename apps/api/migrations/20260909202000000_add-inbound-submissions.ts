import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.createTable(
    "inbound_submissions",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      source: {
        type: "varchar(50)",
        notNull: true,
      },

      external_id: {
        type: "varchar(255)",
        notNull: true,
      },

      candidate_id: {
        type: "bigint",
        references: "candidates",
        onDelete: "SET NULL",
      },

      resume_id: {
        type: "bigint",
        references: "resumes",
        onDelete: "SET NULL",
      },

      processing_status: {
        type: "varchar(30)",
        notNull: true,
        default: "received",
      },

      error_message: {
        type: "text",
      },

      created_at: {
        type: "timestamptz",
        notNull: true,
        default:
          pgm.func(
            "CURRENT_TIMESTAMP"
          ),
      },

      updated_at: {
        type: "timestamptz",
        notNull: true,
        default:
          pgm.func(
            "CURRENT_TIMESTAMP"
          ),
      },
    }
  );

  pgm.addConstraint(
    "inbound_submissions",
    "inbound_submissions_source_external_id_unique",
    {
      unique: [
        "source",
        "external_id",
      ],
    }
  );

  pgm.createIndex(
    "inbound_submissions",
    "candidate_id"
  );

  pgm.createIndex(
    "inbound_submissions",
    "resume_id"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropTable(
    "inbound_submissions"
  );
}