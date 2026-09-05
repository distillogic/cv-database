import { Router } from "express";

import {
  createCandidate,
  getCandidateById,
  getCandidates,
} from "./candidate.repository.js";

import {
  createCandidateSchema,
} from "./candidate.schema.js";

import {
  getCandidateProfessionalProfile,
  getResumeAnalysisSource,
  replaceCandidateProfessionalProfile,
} from "./candidate.profile.repository.js";

import {
  resumeAnalysisSchema,
} from "../resumes/resume.analysis.schema.js";

export const candidateRouter =
  Router();

/**
 * GET /api/candidates
 */
candidateRouter.get(
  "/",
  async (_req, res) => {
    try {
      const candidates =
        await getCandidates();

      return res.json({
        data: candidates,
      });
    } catch (error) {
      console.error(
        "Failed to get candidates:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get candidates",
        });
    }
  }
);

/**
 * POST /api/candidates
 */
candidateRouter.post(
  "/",
  async (req, res) => {
    try {
      const parsed =
        createCandidateSchema
          .safeParse(
            req.body
          );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              "Invalid candidate data",

            details:
              parsed.error.flatten(),
          });
      }

      const candidate =
        await createCandidate(
          parsed.data
        );

      return res
        .status(201)
        .json({
          data: candidate,
        });
    } catch (error) {
      console.error(
        "Failed to create candidate:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to create candidate",
        });
    }
  }
);

/**
 * GET /api/candidates/:id/profile
 */
candidateRouter.get(
  "/:id/profile",
  async (req, res) => {
    try {
      const candidateId =
        Number(req.params.id);

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

      const profile =
        await getCandidateProfessionalProfile(
          candidateId
        );

      if (!profile) {
        return res
          .status(404)
          .json({
            error:
              "Candidate professional profile not found",
          });
      }

      return res.json({
        data: profile,
      });
    } catch (error) {
      console.error(
        "Failed to get candidate profile:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get candidate profile",
        });
    }
  }
);

/**
 * POST
 * /api/candidates/:id/profile/from-resume/:resumeId
 *
 * Builds the candidate's current professional
 * profile from the latest completed validated
 * analysis for that resume.
 */
candidateRouter.post(
  "/:id/profile/from-resume/:resumeId",
  async (req, res) => {
    try {
      const candidateId =
        Number(req.params.id);

      const resumeId =
        Number(
          req.params.resumeId
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

      if (
        !Number.isInteger(
          resumeId
        ) ||
        resumeId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid resume id",
          });
      }

      const source =
        await getResumeAnalysisSource(
          candidateId,
          resumeId
        );

      if (!source) {
        return res
          .status(404)
          .json({
            error:
              "Resume not found for candidate",
          });
      }

      if (
        !source.analysis_run_id ||
        !source.analysis_json
      ) {
        return res
          .status(409)
          .json({
            error:
              "Resume does not have a completed AI analysis",
          });
      }

      const parsedAnalysis =
        resumeAnalysisSchema
          .safeParse(
            source.analysis_json
          );

      if (
        !parsedAnalysis.success
      ) {
        console.error(
          "Stored analysis failed schema validation:",
          parsedAnalysis.error
        );

        return res
          .status(500)
          .json({
            error:
              "Stored resume analysis is invalid",
          });
      }

      await replaceCandidateProfessionalProfile(
        candidateId,
        resumeId,
        source.analysis_run_id,
        parsedAnalysis.data
      );

      const profile =
        await getCandidateProfessionalProfile(
          candidateId
        );

      return res
        .status(201)
        .json({
          data: profile,
        });
    } catch (error) {
      console.error(
        "Failed to build candidate profile:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to build candidate professional profile",
        });
    }
  }
);

/**
 * GET /api/candidates/:id
 */
candidateRouter.get(
  "/:id",
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid candidate id",
          });
      }

      const candidate =
        await getCandidateById(
          id
        );

      if (!candidate) {
        return res
          .status(404)
          .json({
            error:
              "Candidate not found",
          });
      }

      return res.json({
        data: candidate,
      });
    } catch (error) {
      console.error(
        "Failed to get candidate:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to get candidate",
        });
    }
  }
);