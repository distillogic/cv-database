import {
  Router,
} from "express";

import {
  getCandidateJobMatches,
} from "./candidate-job-match.repository.js";

export const candidateJobMatchRouter =
  Router();

/**
 * GET
 * /api/candidates/:candidateId/job-matches
 *
 * Returns the latest saved
 * job-specific score for every
 * Job that this candidate has
 * been scored against.
 *
 * No new scoring is performed
 * by this endpoint.
 */
candidateJobMatchRouter.get(
  "/:candidateId/job-matches",

  async (
    req,
    res
  ) => {
    try {
      const candidateId =
        Number(
          req.params
            .candidateId
        );

      if (
        !Number.isInteger(
          candidateId
        ) ||
        candidateId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid candidate id",
          });
      }

      const result =
        await getCandidateJobMatches(
          candidateId
        );

      if (!result) {
        return res
          .status(404)
          .json({
            error:
              "Candidate not found",
          });
      }

      return res.json({
        data:
          result,

        notice:
          "Scores are job-specific decision-support based on documented professional criteria. They do not make an automatic hiring decision.",
      });
    } catch (error) {
      console.error(
        "Failed to get candidate job matches:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get candidate job matches",
        });
    }
  }
);