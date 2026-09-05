import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import multer from "multer";

const resumeStorageDirectory =
  path.resolve(
    process.cwd(),
    "storage",
    "resumes"
  );

fs.mkdirSync(
  resumeStorageDirectory,
  {
    recursive: true,
  }
);

const allowedMimeTypes =
  new Set([
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

const allowedExtensions =
  new Set([
    ".pdf",
    ".docx",
  ]);

const storage =
  multer.diskStorage({
    destination: (
      _req,
      _file,
      callback
    ) => {
      callback(
        null,
        resumeStorageDirectory
      );
    },

    filename: (
      _req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const generatedFilename =
        `${crypto.randomUUID()}${extension}`;

      callback(
        null,
        generatedFilename
      );
    },
  });

export const resumeUpload =
  multer({
    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },

    fileFilter: (
      _req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const validMimeType =
        allowedMimeTypes.has(
          file.mimetype
        );

      const validExtension =
        allowedExtensions.has(
          extension
        );

      if (
        !validMimeType ||
        !validExtension
      ) {
        callback(
          new Error(
            "Only PDF and DOCX resume files are allowed"
          )
        );

        return;
      }

      callback(null, true);
    },
  });