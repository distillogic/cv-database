import {
  Router,
} from "express";

import {
  createJob,
  getJobById,
  getJobs,
} from "./job.repository.js";

import {
  createJobSchema,
} from "./job.schema.js";

import {
  getJobRanking,
  scoreAndSaveCandidateForJob,
} from "./job.score.repository.js";

import {
  scoreAllCandidatesForJob,
} from "./job.score-all.js";

export const jobRouter =
  Router();

/**
 * GET /api/jobs
 */
jobRouter.get(
  "/",
  async (_req, res) => {
    try {
      const jobs =
        await getJobs();

      return res.json({
        data: jobs,
      });
    } catch (error) {
      console.error(
        "Failed to get jobs:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get jobs",
        });
    }
  }
);

/**
 * GET /api/jobs/:jobId/ranking
 *
 * Returns the latest score
 * for every scored candidate
 * for this specific job.
 */
jobRouter.get(
  "/:jobId/ranking",
  async (req, res) => {
    try {
      const jobId =
        Number(
          req.params.jobId
        );

      if (
        !Number.isInteger(
          jobId
        ) ||
        jobId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job id",
          });
      }

      const ranking =
        await getJobRanking(
          jobId
        );

      if (!ranking) {
        return res
          .status(404)
          .json({
            error:
              "Job not found",
          });
      }

      return res.json({
        data: ranking,
      });
    } catch (error) {
      console.error(
        "Failed to get job ranking:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get job ranking",
        });
    }
  }
);

/**
 * POST /api/jobs/:jobId/score-all
 *
 * Scores every candidate
 * that has a professional profile.
 */
jobRouter.post(
  "/:jobId/score-all",
  async (req, res) => {
    try {
      const jobId =
        Number(
          req.params.jobId
        );

      if (
        !Number.isInteger(
          jobId
        ) ||
        jobId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job id",
          });
      }

      const result =
        await scoreAllCandidatesForJob(
          jobId
        );

      if (
        result.status ===
        "job_not_found"
      ) {
        return res
          .status(404)
          .json({
            error:
              "Job not found",
          });
      }

      return res
        .status(201)
        .json({
          data: {
            processedCount:
              result
                .processedCount,

            scoredCount:
              result
                .scoredCount,

            failedCount:
              result
                .failedCount,

            results:
              result.results,

            ranking:
              result.ranking,
          },

          notice:
            "Ranking is decision-support only and uses documented job-related criteria. Final hiring decisions require recruiter review.",
        });
    } catch (error) {
      console.error(
        "Failed to score all candidates:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to score all candidates",
        });
    }
  }
);

/**
 * POST
 * /api/jobs/:jobId/score-candidate/:candidateId
 */
jobRouter.post(
  "/:jobId/score-candidate/:candidateId",
  async (req, res) => {
    try {
      const jobId =
        Number(
          req.params.jobId
        );

      const candidateId =
        Number(
          req.params.candidateId
        );

      if (
        !Number.isInteger(
          jobId
        ) ||
        jobId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job id",
          });
      }

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
        await scoreAndSaveCandidateForJob(
          jobId,
          candidateId
        );

      if (
        result.status ===
        "job_not_found"
      ) {
        return res
          .status(404)
          .json({
            error:
              "Job not found",
          });
      }

      if (
        result.status ===
        "candidate_not_found"
      ) {
        return res
          .status(404)
          .json({
            error:
              "Candidate not found",
          });
      }

      if (
        result.status ===
        "profile_not_found"
      ) {
        return res
          .status(409)
          .json({
            error:
              "Candidate professional profile has not been generated yet",
          });
      }

      return res
        .status(201)
        .json({
          data:
            result.score,

          profileReviewStatus:
            result
              .profileReviewStatus,

          notice:
            "This score is decision-support only. It uses documented job-related criteria and does not make an automatic hiring decision.",
        });
    } catch (error) {
      console.error(
        "Failed to score candidate:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to score candidate",
        });
    }
  }
);

/**
 * GET /api/jobs/:id
 */
jobRouter.get(
  "/:id",
  async (req, res) => {
    try {
      const jobId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          jobId
        ) ||
        jobId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job id",
          });
      }

      const job =
        await getJobById(
          jobId
        );

      if (!job) {
        return res
          .status(404)
          .json({
            error:
              "Job not found",
          });
      }

      return res.json({
        data: job,
      });
    } catch (error) {
      console.error(
        "Failed to get job:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get job",
        });
    }
  }
);

/**
 * POST /api/jobs
 */
jobRouter.post(
  "/",
  async (req, res) => {
    try {
      const parsed =
        createJobSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              "Invalid job data",

            details:
              parsed.error.flatten(),
          });
      }

      const job =
        await createJob(
          parsed.data
        );

      return res
        .status(201)
        .json({
          data: job,
        });
    } catch (error) {
      console.error(
        "Failed to create job:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to create job",
        });
    }
  }
);