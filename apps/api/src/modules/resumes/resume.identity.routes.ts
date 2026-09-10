import {
  Router,
} from "express";

import multer
  from "multer";

import {
  identifyCandidateFromResume,
} from "./resume.identity.js";

export const resumeIdentityRouter =
  Router();

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },
  });

resumeIdentityRouter.post(
  "/identify",

  upload.single(
    "resume"
  ),

  async (
    req,
    res
  ) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
            error:
              "Resume file is required.",
          });
      }

      const identity =
        await identifyCandidateFromResume(
          req.file
        );

      return res
        .status(200)
        .json({
          data: identity,
        });
    } catch (error) {
      console.error(
        "Resume identity extraction failed:",
        error
      );

      return res
        .status(422)
        .json({
          error:
            error instanceof
              Error
              ? error.message
              : "Resume identity extraction failed.",
        });
    }
  }
);