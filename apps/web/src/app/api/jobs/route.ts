import { NextResponse } from "next/server";

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
        `${API_BASE_URL}/api/jobs`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    return NextResponse.json(
      data,
      {
        status: response.status,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create job:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create job",
      },
      {
        status: 500,
      }
    );
  }
}