import {
  NextResponse,
} from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

export const maxDuration =
  180;

type ProcessStep = {
  step: string;
  status:
    | "completed"
    | "failed";
};

async function backendRequest(
  url: string,
  options?: RequestInit
): Promise<unknown> {
  const response =
    await fetch(
      url,
      {
        ...options,
        cache: "no-store",
      }
    );

  const text =
    await response.text();

  let data: unknown;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      `Backend returned non-JSON response (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Backend request failed (${response.status}): ${text}`
    );
  }

  return data;
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await params;

    const body =
      (await request.json()) as {
        candidateId?: string;
      };

    const resumeId =
      Number(id);

    const candidateId =
      Number(
        body.candidateId
      );

    if (
      !Number.isInteger(
        resumeId
      ) ||
      resumeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid resume id.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        candidateId
      ) ||
      candidateId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid candidate id.",
        },
        {
          status: 400,
        }
      );
    }

    const steps:
      ProcessStep[] = [];

    /**
     * 1. EXTRACT
     */
    await backendRequest(
      `${API_BASE_URL}/api/resumes/${resumeId}/extract`,
      {
        method: "POST",
      }
    );

    steps.push({
      step: "extract",
      status: "completed",
    });

    /**
     * 2. SANITIZE
     */
    await backendRequest(
      `${API_BASE_URL}/api/resumes/${resumeId}/sanitize`,
      {
        method: "POST",
      }
    );

    steps.push({
      step: "sanitize",
      status: "completed",
    });

    /**
     * 3. LOCAL AI ANALYSIS
     */
    await backendRequest(
      `${API_BASE_URL}/api/resumes/${resumeId}/analyze`,
      {
        method: "POST",
      }
    );

    steps.push({
      step: "analyze",
      status: "completed",
    });

    /**
     * 4. BUILD PROFESSIONAL PROFILE
     */
    await backendRequest(
      `${API_BASE_URL}/api/candidates/${candidateId}/profile/from-resume/${resumeId}`,
      {
        method: "POST",
      }
    );

    steps.push({
      step:
        "professional-profile",
      status: "completed",
    });

    /**
     * 5. SCORE NEW CANDIDATE
     * AGAINST ALL OPEN JOBS
     */
    let scoredJobs = 0;
    let failedJobs = 0;

    try {
      const jobsData =
        (await backendRequest(
          `${API_BASE_URL}/api/jobs`
        )) as {
          data?: Array<{
            id:
              | string
              | number;
            status?: string;
          }>;
        };

      const openJobs =
        (
          jobsData.data ??
          []
        ).filter(
          (job) =>
            job.status ===
            "open"
        );

      for (
        const job of
          openJobs
      ) {
        try {
          await backendRequest(
            `${API_BASE_URL}/api/jobs/${job.id}/score-candidate/${candidateId}`,
            {
              method:
                "POST",
            }
          );

          scoredJobs++;
        } catch (scoreError) {
          console.error(
            `Failed scoring candidate ${candidateId} for job ${job.id}:`,
            scoreError
          );

          failedJobs++;
        }
      }

      steps.push({
        step:
          "job-matching",
        status:
          failedJobs === 0
            ? "completed"
            : "failed",
      });
    } catch (jobsError) {
      console.error(
        "Automatic job scoring failed:",
        jobsError
      );

      steps.push({
        step:
          "job-matching",
        status:
          "failed",
      });
    }

    return NextResponse.json(
      {
        data: {
          candidateId:
            String(
              candidateId
            ),

          resumeId:
            String(
              resumeId
            ),

          status:
            "completed",

          scoredJobs,
          failedJobs,

          steps,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Resume processing failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Resume processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}