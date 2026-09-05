import crypto from "node:crypto";
import fs from "node:fs/promises";

import { Router } from "express";

import {
  applicationBelongsToCandidate,
  candidateExists,
  completeResumeAnalysisRun,
  createResume,
  createResumeAnalysisRun,
  failResumeAnalysisRun,
  getResumeById,
  markResumeExtracting,
  markResumeExtractionFailed,
  markResumeSanitizing,
  markResumeSanitizationFailed,
  saveExtractedResumeText,
  saveSanitizedResumeText,
} from "./resume.repository.js";

import {
  analyzeResumeWithLocalAi,
  RESUME_ANALYSIS_PROMPT_VERSION,
} from "./resume.ai.js";

import {
  extractResumeText,
} from "./resume.parser.js";

import {
  sanitizeResumeText,
} from "./resume.sanitizer.js";

import {
  resumeUpload,
} from "./resume.upload.js";

export const resumeRouter = Router();

/**
 * Fix UTF-8 filenames that may arrive
 * incorrectly encoded through multipart upload.
 */
function normalizeUploadFilename(
  filename: string
): string {
  if (!/[\u00C0-\u00FF]/.test(filename)) {
    return filename;
  }

  try {
    const decoded = Buffer
      .from(filename, "latin1")
      .toString("utf8");

    if (decoded.includes("�")) {
      return filename;
    }

    return decoded;
  } catch {
    return filename;
  }
}

/**
 * Calculate SHA-256 hash for uploaded resume.
 */
async function calculateSha256(
  filePath: string
): Promise<string> {
  const fileBuffer =
    await fs.readFile(filePath);

  return crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");
}

/**
 * -------------------------------------------------------
 * UPLOAD RESUME
 *
 * POST /api/resumes/upload
 * -------------------------------------------------------
 */
resumeRouter.post(
  "/upload",

  resumeUpload.single("resume"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error:
            "Resume file is required",
        });
      }

      const candidateId =
        Number(
          req.body.candidateId
        );

      const applicationId =
        req.body.applicationId
          ? Number(
              req.body.applicationId
            )
          : null;

      /**
       * Validate candidate ID.
       */
      if (
        !Number.isInteger(
          candidateId
        ) ||
        candidateId <= 0
      ) {
        await fs
          .unlink(req.file.path)
          .catch(
            () => undefined
          );

        return res.status(400).json({
          error:
            "Valid candidateId is required",
        });
      }

      /**
       * Validate application ID,
       * when supplied.
       */
      if (
        applicationId !== null &&
        (
          !Number.isInteger(
            applicationId
          ) ||
          applicationId <= 0
        )
      ) {
        await fs
          .unlink(req.file.path)
          .catch(
            () => undefined
          );

        return res.status(400).json({
          error:
            "Invalid applicationId",
        });
      }

      /**
       * Candidate must exist.
       */
      const exists =
        await candidateExists(
          candidateId
        );

      if (!exists) {
        await fs
          .unlink(req.file.path)
          .catch(
            () => undefined
          );

        return res.status(404).json({
          error:
            "Candidate not found",
        });
      }

      /**
       * If an application was supplied,
       * it must belong to this candidate.
       */
      if (
        applicationId !== null
      ) {
        const validApplication =
          await applicationBelongsToCandidate(
            applicationId,
            candidateId
          );

        if (!validApplication) {
          await fs
            .unlink(req.file.path)
            .catch(
              () => undefined
            );

          return res.status(400).json({
            error:
              "Application does not belong to candidate",
          });
        }
      }

      /**
       * Generate file hash.
       */
      const fileHash =
        await calculateSha256(
          req.file.path
        );

      /**
       * Fix Greek / UTF-8 filename.
       */
      const originalFilename =
        normalizeUploadFilename(
          req.file.originalname
        );

      /**
       * Save resume metadata
       * to PostgreSQL.
       */
      const resume =
        await createResume({
          candidateId,

          applicationId,

          originalFilename,

          storedFilename:
            req.file.filename,

          storagePath:
            req.file.path,

          mimeType:
            req.file.mimetype,

          fileSizeBytes:
            req.file.size,

          fileHash,
        });

      return res
        .status(201)
        .json({
          data: resume,
        });
    } catch (error) {
      console.error(
        "Resume upload failed:",
        error
      );

      /**
       * Delete file if DB/storage
       * processing failed.
       */
      if (req.file) {
        await fs
          .unlink(req.file.path)
          .catch(
            () => undefined
          );
      }

      return res.status(500).json({
        error:
          "Resume upload failed",
      });
    }
  }
);

/**
 * -------------------------------------------------------
 * EXTRACT RESUME TEXT
 *
 * POST /api/resumes/:id/extract
 * -------------------------------------------------------
 */
resumeRouter.post(
  "/:id/extract",

  async (req, res) => {
    const resumeId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        resumeId
      ) ||
      resumeId <= 0
    ) {
      return res.status(400).json({
        error:
          "Invalid resume id",
      });
    }

    try {
      const resume =
        await getResumeById(
          resumeId
        );

      if (!resume) {
        return res.status(404).json({
          error:
            "Resume not found",
        });
      }

      await markResumeExtracting(
        resumeId
      );

      const extractedText =
        await extractResumeText(
          resume.storage_path,
          resume.mime_type
        );

      if (
        !extractedText.trim()
      ) {
        throw new Error(
          "No text could be extracted from resume"
        );
      }

      const updatedResume =
        await saveExtractedResumeText(
          resumeId,
          extractedText
        );

      return res.json({
        data: {
          ...updatedResume,

          extractedTextLength:
            extractedText.length,

          preview:
            extractedText.slice(
              0,
              1000
            ),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown extraction error";

      await markResumeExtractionFailed(
        resumeId,
        message
      ).catch(
        () => undefined
      );

      console.error(
        "Resume extraction failed:",
        error
      );

      return res.status(500).json({
        error:
          "Resume extraction failed",

        details:
          message,
      });
    }
  }
);

/**
 * -------------------------------------------------------
 * SANITIZE RESUME TEXT
 *
 * POST /api/resumes/:id/sanitize
 * -------------------------------------------------------
 */
resumeRouter.post(
  "/:id/sanitize",

  async (req, res) => {
    const resumeId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        resumeId
      ) ||
      resumeId <= 0
    ) {
      return res.status(400).json({
        error:
          "Invalid resume id",
      });
    }

    try {
      const resume =
        await getResumeById(
          resumeId
        );

      if (!resume) {
        return res.status(404).json({
          error:
            "Resume not found",
        });
      }

      /**
       * Extraction must happen first.
       */
      if (
        !resume.extracted_text ||
        !resume.extracted_text.trim()
      ) {
        return res.status(409).json({
          error:
            "Resume text has not been extracted yet",
        });
      }

      await markResumeSanitizing(
        resumeId
      );

      /**
       * Remove personal / sensitive
       * information before AI analysis.
       */
      const analysisText =
        sanitizeResumeText(
          resume.extracted_text
        );

      if (
        !analysisText.trim()
      ) {
        throw new Error(
          "No usable text remained after sanitization"
        );
      }

      const updatedResume =
        await saveSanitizedResumeText(
          resumeId,
          analysisText
        );

      return res.json({
        data: {
          ...updatedResume,

          originalTextLength:
            resume
              .extracted_text
              .length,

          analysisTextLength:
            analysisText.length,

          preview:
            analysisText.slice(
              0,
              1500
            ),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown sanitization error";

      await markResumeSanitizationFailed(
        resumeId,
        message
      ).catch(
        () => undefined
      );

      console.error(
        "Resume sanitization failed:",
        error
      );

      return res.status(500).json({
        error:
          "Resume sanitization failed",

        details:
          message,
      });
    }
  }
);

/**
 * -------------------------------------------------------
 * LOCAL AI RESUME ANALYSIS
 *
 * POST /api/resumes/:id/analyze
 * -------------------------------------------------------
 */
resumeRouter.post(
  "/:id/analyze",

  async (req, res) => {
    const resumeId =
      Number(
        req.params.id
      );

    if (
      !Number.isInteger(
        resumeId
      ) ||
      resumeId <= 0
    ) {
      return res.status(400).json({
        error:
          "Invalid resume id",
      });
    }

    let analysisRunId:
      number | null = null;

    try {
      /**
       * Load resume.
       */
      const resume =
        await getResumeById(
          resumeId
        );

      if (!resume) {
        return res.status(404).json({
          error:
            "Resume not found",
        });
      }

      /**
       * The AI is ONLY allowed to
       * receive sanitized analysis_text.
       */
      if (
        !resume.analysis_text ||
        !resume.analysis_text.trim()
      ) {
        return res.status(409).json({
          error:
            "Resume must be sanitized before AI analysis",
        });
      }

      const configuredModel =
        process.env
          .OLLAMA_MODEL ??
        "qwen3:4b-instruct";

      /**
       * Create analysis history record.
       */
      const analysisRun =
        await createResumeAnalysisRun(
          resumeId,
          configuredModel,
          RESUME_ANALYSIS_PROMPT_VERSION
        );

      analysisRunId =
        Number(
          analysisRun.id
        );

      /**
       * Send ONLY sanitized text
       * to local Ollama.
       */
      const aiResult =
        await analyzeResumeWithLocalAi(
          resume.analysis_text
        );

      /**
       * Save structured JSON
       * to PostgreSQL.
       */
      const completedRun =
        await completeResumeAnalysisRun(
          analysisRunId,
          resumeId,
          aiResult.analysis
        );

      return res.json({
        data: {
          resumeId:
            String(
              resumeId
            ),

          analysisRunId:
            String(
              completedRun.id
            ),

          model:
            aiResult.model,

          promptVersion:
            RESUME_ANALYSIS_PROMPT_VERSION,

          status:
            "analyzed",

          analysis:
            aiResult.analysis,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown AI analysis error";

      /**
       * If an analysis run was already
       * created, mark it as failed.
       */
      if (
        analysisRunId !== null
      ) {
        await failResumeAnalysisRun(
          analysisRunId,
          resumeId,
          message
        ).catch(
          () => undefined
        );
      }

      console.error(
        "Resume AI analysis failed:",
        error
      );

      return res.status(500).json({
        error:
          "Resume AI analysis failed",

        details:
          message,
      });
    }
  }
);