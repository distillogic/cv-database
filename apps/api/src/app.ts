import { resumeRouter } from "./modules/resumes/resume.routes.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { pool } from "./db/pool.js";
import { candidateRouter } from "./modules/Candidates/candidate.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp());

app.get("/", (_req, res) => {
  res.json({
    name: "Melas Recruitment CRM API",
    version: "0.1.0",
    status: "running",
  });
});

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        NOW() AS database_time
    `);

    res.json({
      status: "ok",
      database: "connected",
      connection: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error
    );

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/Candidates", candidateRouter);
app.use("/api/resumes", resumeRouter);