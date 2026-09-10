import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

export async function POST(
  _request: Request,
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

    const response =
      await fetch(
        `${API_BASE_URL}/api/jobs/${encodeURIComponent(id)}/score-all`,
        {
          method: "POST",
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
      console.error(
        "Backend returned non-JSON:",
        text
      );

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

    return NextResponse.json(
      data,
      {
        status: response.status,
      }
    );
  } catch (error) {
    console.error(
      "Failed to recalculate candidates:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to recalculate candidates",
      },
      {
        status: 500,
      }
    );
  }
}