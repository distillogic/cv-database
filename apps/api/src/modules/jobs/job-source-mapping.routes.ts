import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  findJobSourceMapping,
  upsertJobSourceMapping,
} from "./job-source-mapping.repository.js";

export const jobSourceMappingRouter =
  Router();

const sourceSchema =
  z.enum([
    "website",
    "indeed",
    "jobfind",
    "manual",
    "bulk_import",
    "other",
  ]);

const createSchema =
  z.object({
    source:
      sourceSchema,

    externalJobId:
      z.string()
        .trim()
        .min(1)
        .max(255),

    jobId:
      z.coerce
        .number()
        .int()
        .positive(),
  });

const resolveSchema =
  z.object({
    source:
      sourceSchema,

    externalJobId:
      z.string()
        .trim()
        .min(1)
        .max(255),
  });

/**
 * Create or update a mapping.
 */
jobSourceMappingRouter.post(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const parsed =
        createSchema.safeParse(
          req.body
        );

      if (
        !parsed.success
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job source mapping data.",

            details:
              parsed.error.flatten(),
          });
      }

      const mapping =
        await upsertJobSourceMapping({
          source:
            parsed.data.source,

          externalJobId:
            parsed.data.externalJobId,

          jobId:
            String(
              parsed.data.jobId
            ),
        });

      return res
        .status(201)
        .json({
          data:
            mapping,
        });
    } catch (error) {
      console.error(
        "Job source mapping save failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Job source mapping save failed.",
        });
    }
  }
);

/**
 * Resolve:
 *
 * source + externalJobId
 * -> CRM jobId
 */
jobSourceMappingRouter.get(
  "/resolve",
  async (
    req,
    res
  ) => {
    try {
      const parsed =
        resolveSchema.safeParse({
          source:
            req.query.source,

          externalJobId:
            req.query.externalJobId,
        });

      if (
        !parsed.success
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job source mapping lookup.",

            details:
              parsed.error.flatten(),
          });
      }

      const mapping =
        await findJobSourceMapping(
          parsed.data.source,
          parsed.data.externalJobId
        );

      if (!mapping) {
        return res
          .status(404)
          .json({
            error:
              "Job source mapping not found.",
          });
      }

      return res.json({
        data:
          mapping,
      });
    } catch (error) {
      console.error(
        "Job source mapping lookup failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Job source mapping lookup failed.",
        });
    }
  }
);