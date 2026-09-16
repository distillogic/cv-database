import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  createApplication,
  getApplications,
  updateApplicationStatus,
} from "./application.repository.js";

export const applicationRouter =
  Router();

const applicationStatusSchema =
  z.enum([
    "new",
    "reviewing",
    "contacted",
    "interview",
    "hired",
    "rejected",
    "archived",
  ]);

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

    resumeId:
      z.coerce
        .number()
        .int()
        .positive()
        .optional(),

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
      applicationStatusSchema
        .optional(),
  });

const updateApplicationStatusSchema =
  z.object({
    status:
      applicationStatusSchema,
  });

applicationRouter.get(
  "/",

  async (
    _req,
    res
  ) => {
    try {
      const applications =
        await getApplications();

      return res.json({
        data:
          applications,
      });
    } catch (error) {
      console.error(
        "Failed to get applications:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to get applications.",
        });
    }
  }
);

applicationRouter.patch(
  "/:id/status",

  async (
    req,
    res
  ) => {
    try {
      const applicationId =
        String(
          req.params.id
        );

      if (
        !/^\d+$/.test(
          applicationId
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid application id.",
          });
      }

      const parsed =
        updateApplicationStatusSchema
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
              "Invalid application status.",

            details:
              parsed.error
                .flatten(),
          });
      }

      const application =
        await updateApplicationStatus(
          applicationId,
          parsed.data.status
        );

      if (!application) {
        return res
          .status(404)
          .json({
            error:
              "Application not found.",
          });
      }

      return res.json({
        data:
          application,
      });
    } catch (error) {
      console.error(
        "Application status update failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Application status update failed.",
        });
    }
  }
);

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
        await createApplication({
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

          resumeId:
            parsed.data
              .resumeId
              ? String(
                  parsed.data
                    .resumeId
                )
              : null,

          source:
            parsed.data
              .source,

          status:
            parsed.data
              .status,
        });

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
            error instanceof Error
              ? error.message
              : "Application creation failed.",
        });
    }
  }
);