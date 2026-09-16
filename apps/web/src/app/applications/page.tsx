import ApplicationDirectory from "./application-directory";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

type Application = {
  id?: string | number;

  candidate_id?:
    string | number | null;

  candidateId?:
    string | number | null;

  job_id?:
    string | number | null;

  jobId?:
    string | number | null;

  resume_id?:
    string | number | null;

  resumeId?:
    string | number | null;

  source?:
    string | null;

  status?:
    string | null;

  applied_at?:
    string | null;

  appliedAt?:
    string | null;

  created_at?:
    string | null;

  createdAt?:
    string | null;

  overall_score?:
    number | null;

  requirements_score?:
    number | null;

  seniority_score?:
    number | null;
};

type Candidate = {
  id?: string | number;

  first_name?:
    string | null;

  firstName?:
    string | null;

  last_name?:
    string | null;

  lastName?:
    string | null;

  email?:
    string | null;
};

type Job = {
  id?: string | number;

  title?:
    string | null;

  department?:
    string | null;

  location?:
    string | null;
};

function extractArray<T>(
  value: unknown
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return [];
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  for (
    const key of [
      "data",
      "items",
      "applications",
      "candidates",
      "jobs",
      "results",
    ]
  ) {
    const nested =
      record[key];

    if (
      Array.isArray(
        nested
      )
    ) {
      return nested as T[];
    }

    if (
      typeof nested === "object" &&
      nested !== null
    ) {
      const nestedRecord =
        nested as Record<
          string,
          unknown
        >;

      for (
        const nestedKey of [
          "items",
          "applications",
          "candidates",
          "jobs",
          "results",
        ]
      ) {
        if (
          Array.isArray(
            nestedRecord[
              nestedKey
            ]
          )
        ) {
          return nestedRecord[
            nestedKey
          ] as T[];
        }
      }
    }
  }

  return [];
}

async function fetchCollection<T>(
  path: string
): Promise<{
  available: boolean;
  items: T[];
}> {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return {
        available: false,
        items: [],
      };
    }

    const raw =
      await response.json();

    return {
      available: true,
      items:
        extractArray<T>(
          raw
        ),
    };
  } catch {
    return {
      available: false,
      items: [],
    };
  }
}

export default async function ApplicationsPage() {
  const [
    applicationsResult,
    candidatesResult,
    jobsResult,
  ] =
    await Promise.all([
      fetchCollection<Application>(
        "/api/applications"
      ),

      fetchCollection<Candidate>(
        "/api/candidates"
      ),

      fetchCollection<Job>(
        "/api/jobs"
      ),
    ]);

  const candidates =
    candidatesResult.items.map(
      (candidate) => ({
        id:
          String(
            candidate.id ??
            ""
          ),

        name:
          `${
            candidate.first_name ??
            candidate.firstName ??
            ""
          } ${
            candidate.last_name ??
            candidate.lastName ??
            ""
          }`.trim(),

        email:
          candidate.email ??
          null,
      })
    );

  const jobs =
    jobsResult.items.map(
      (job) => ({
        id:
          String(
            job.id ??
            ""
          ),

        title:
          job.title ??
          "Χωρίς τίτλο",

        department:
          job.department ??
          null,

        location:
          job.location ??
          null,
      })
    );

  const applications =
    applicationsResult.items.map(
      (application) => ({
        id:
          String(
            application.id ??
            ""
          ),

        candidateId:
          String(
            application.candidate_id ??
            application.candidateId ??
            ""
          ),

        jobId:
          String(
            application.job_id ??
            application.jobId ??
            ""
          ),

        resumeId:
          application.resume_id ??
          application.resumeId ??
          null,

        source:
          application.source ??
          "other",

        status:
          application.status ??
          "new",

        appliedAt:
          application.applied_at ??
          application.appliedAt ??
          application.created_at ??
          application.createdAt ??
          null,

        overallScore:
          application.overall_score ??
          null,

        requirementsScore:
          application.requirements_score ??
          null,

        seniorityScore:
          application.seniority_score ??
          null,
      })
    );

  return (
    <ApplicationDirectory
      applications={
        applications
      }
      candidates={
        candidates
      }
      jobs={
        jobs
      }
      apiAvailable={
        applicationsResult.available
      }
    />
  );
}