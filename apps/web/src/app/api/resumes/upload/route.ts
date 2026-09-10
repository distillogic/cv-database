import {
  NextResponse,
} from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

function findId(
  value: unknown,
  depth = 0
): string | null {
  if (
    depth > 4 ||
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof record.id === "string" ||
    typeof record.id === "number"
  ) {
    return String(
      record.id
    );
  }

  const keys = [
    "data",
    "resume",
    "result",
  ];

  for (const key of keys) {
    const found =
      findId(
        record[key],
        depth + 1
      );

    if (found) {
      return found;
    }
  }

  return null;
}

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const response =
      await fetch(
        `${API_BASE_URL}/api/resumes/upload`,
        {
          method: "POST",
          body: formData,
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
      return NextResponse.json(
        {
          error:
            "Backend returned an invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        data,
        {
          status:
            response.status,
        }
      );
    }

    const resumeId =
      findId(data);

    if (!resumeId) {
      return NextResponse.json(
        {
          error:
            "Resume was uploaded but its ID could not be determined.",
          backendResponse:
            data,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      {
        data,
        resumeId,
      },
      {
        status:
          response.status,
      }
    );
  } catch (error) {
    console.error(
      "Resume upload failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to upload resume.",
      },
      {
        status: 500,
      }
    );
  }
}