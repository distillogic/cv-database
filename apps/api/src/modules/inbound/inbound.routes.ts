import {
  Router,
} from "express";

import {
  z,
} from "zod";

import {
  registerResumeFingerprint,
  reserveInboundSubmission,
  updateInboundSubmission,
} from "./inbound.repository.js";

export const inboundRouter =
  Router();

const reserveSchema =
  z.object({
    source:
      z.string()
        .trim()
        .min(1)
        .max(50),

    externalId:
      z.string()
        .trim()
        .min(1)
        .max(255),
  });

const updateSchema =
  z.object({
    candidateId:
      z.string()
        .trim()
        .min(1)
        .nullable()
        .optional(),

    resumeId:
      z.string()
        .trim()
        .min(1)
        .nullable()
        .optional(),

    applicationId:
      z.string()
        .trim()
        .min(1)
        .nullable()
        .optional(),

    processingStatus:
      z.enum([
        "received",
        "processing",
        "completed",
        "failed",
      ])
        .optional(),

    errorMessage:
      z.string()
        .nullable()
        .optional(),

    resumeSha256:
      z.string()
        .regex(
          /^[0-9a-f]{64}$/
        )
        .nullable()
        .optional(),

    duplicateOfSubmissionId:
      z.string()
        .trim()
        .min(1)
        .nullable()
        .optional(),
  });

const fingerprintSchema =
  z.object({
    submissionId:
      z.string()
        .trim()
        .regex(
          /^\d+$/
        ),

    resumeSha256:
      z.string()
        .trim()
        .regex(
          /^[0-9a-f]{64}$/
        ),
  });

inboundRouter.post(
  "/reserve",

  async (
    req,
    res
  ) => {
    try {
      const parsed =
        reserveSchema.safeParse(
          req.body
        );

      if (
        !parsed.success
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid inbound submission data.",

            details:
              parsed.error
                .flatten(),
          });
      }

      const result =
        await reserveInboundSubmission(
          parsed.data.source,
          parsed.data
            .externalId
        );

      return res
        .status(
          result.created
            ? 201
            : 200
        )
        .json({
          data: {
            created:
              result.created,

            submission:
              result.submission,
          },
        });
    } catch (error) {
      console.error(
        "Inbound reservation failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof
              Error
              ? error.message
              : "Inbound reservation failed.",
        });
    }
  }
);

inboundRouter.post(
  "/fingerprint",

  async (
    req,
    res
  ) => {
    try {
      const parsed =
        fingerprintSchema
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
              "Invalid resume fingerprint data.",

            details:
              parsed.error
                .flatten(),
          });
      }

      const result =
        await registerResumeFingerprint(
          parsed.data
            .submissionId,

          parsed.data
            .resumeSha256
        );

      return res.json({
        data: {
          duplicate:
            result.duplicate,

          submission:
            result.submission,

          duplicateOf:
            result.duplicateOf,
        },
      });
    } catch (error) {
      console.error(
        "Resume fingerprint registration failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof
              Error
              ? error.message
              : "Resume fingerprint registration failed.",
        });
    }
  }
);

inboundRouter.patch(
  "/:id",

  async (
    req,
    res
  ) => {
    try {
      const id =
        String(
          req.params.id
        );

      if (
        !/^\d+$/.test(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid inbound submission id.",
          });
      }

      const parsed =
        updateSchema.safeParse(
          req.body
        );

      if (
        !parsed.success
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid inbound update data.",

            details:
              parsed.error
                .flatten(),
          });
      }

      const submission =
        await updateInboundSubmission(
          id,
          parsed.data
        );

      return res.json({
        data:
          submission,
      });
    } catch (error) {
      console.error(
        "Inbound update failed:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            error instanceof
              Error
              ? error.message
              : "Inbound update failed.",
        });
    }
  }
);