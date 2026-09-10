import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  createApplication,
} from "./application.repository.js";

export const applicationRouter =
  Router();

const createApplicationSchema =
  z.object({
    candidateId:
      z.coerce
        .number()
        .int()
        .positive(),

    jobId:
      z.coerce
        .number()
        .int()
        .positive(),

    source:
      z.enum([
        "manual",
        "website",
        "indeed",
        "jobfind",
        "bulk_import",
        "other",
      ]),

    status:
      z.string()
        .trim()
        .min(1)
        .max(50)
        .optional(),
  });

applicationRouter.post(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const parsed =
        createApplicationSchema
          .safeParse(
            req.body
          );

      if (
        !parsed.success
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid application data.",

            details:
              parsed.error
                .flatten(),
          });
      }

      const application =
        await createApplication(
          {
            candidateId:
              String(
                parsed.data
                  .candidateId
              ),

            jobId:
              String(
                parsed.data
                  .jobId
              ),

            source:
              parsed.data
                .source,

            status:
              parsed.data
                .status,
          }
        );

      return res
        .status(201)
        .json({
          data:
            application,
        });
    } catch (error) {
      console.error(
        "Application creation failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof
              Error
              ? error.message
              : "Application creation failed.",
        });
    }
  }
);