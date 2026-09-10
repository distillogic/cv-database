import {
  NextResponse,
} from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const response =
      await fetch(
        `${API_BASE_URL}/api/candidates`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(body),

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
        "Candidate backend returned non-JSON:",
        text
      );

      return NextResponse.json(
        {
          error:
            "Candidate API returned an invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      data,
      {
        status:
          response.status,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create candidate:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create candidate.",
      },
      {
        status: 500,
      }
    );
  }
}