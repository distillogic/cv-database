import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.createTable(
    "job_source_mappings",
    {
      id: {
        type: "bigserial",
        primaryKey: true,
      },

      source: {
        type: "varchar(50)",
        notNull: true,
      },

      external_job_id: {
        type: "varchar(255)",
        notNull: true,
      },

      job_id: {
        type: "bigint",
        notNull: true,
        references: "jobs",
        onDelete: "CASCADE",
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
    "job_source_mappings",
    "job_source_mappings_source_external_job_id_unique",
    {
      unique: [
        "source",
        "external_job_id",
      ],
    }
  );

  pgm.createIndex(
    "job_source_mappings",
    "job_id"
  );

  pgm.createIndex(
    "job_source_mappings",
    "source"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropTable(
    "job_source_mappings"
  );
}