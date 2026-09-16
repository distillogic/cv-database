import type {
  MigrationBuilder,
} from "node-pg-migrate";

export async function up(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.addColumns(
    "candidate_profiles",
    {
      professional_category: {
        type: "varchar(120)",
      },

      professional_subcategory: {
        type: "varchar(160)",
      },

      estimated_seniority: {
        type: "varchar(20)",
      },

      classification_confidence: {
        type: "varchar(20)",
      },

      classification_evidence: {
        type: "jsonb",
      },

      classification_updated_at: {
        type: "timestamptz",
      },
    }
  );

  pgm.addConstraint(
    "candidate_profiles",
    "candidate_profiles_estimated_seniority_check",
    {
      check: `
        estimated_seniority IS NULL
        OR estimated_seniority IN (
          'junior',
          'senior',
          'expert'
        )
      `,
    }
  );

  pgm.addConstraint(
    "candidate_profiles",
    "candidate_profiles_classification_confidence_check",
    {
      check: `
        classification_confidence IS NULL
        OR classification_confidence IN (
          'low',
          'medium',
          'high'
        )
      `,
    }
  );

  pgm.createIndex(
    "candidate_profiles",
    "professional_category"
  );

  pgm.createIndex(
    "candidate_profiles",
    "estimated_seniority"
  );
}

export async function down(
  pgm: MigrationBuilder
): Promise<void> {
  pgm.dropIndex(
    "candidate_profiles",
    "professional_category"
  );

  pgm.dropIndex(
    "candidate_profiles",
    "estimated_seniority"
  );

  pgm.dropConstraint(
    "candidate_profiles",
    "candidate_profiles_estimated_seniority_check"
  );

  pgm.dropConstraint(
    "candidate_profiles",
    "candidate_profiles_classification_confidence_check"
  );

  pgm.dropColumns(
    "candidate_profiles",
    [
      "professional_category",
      "professional_subcategory",
      "estimated_seniority",
      "classification_confidence",
      "classification_evidence",
      "classification_updated_at",
    ]
  );
}