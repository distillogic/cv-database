import {
  NextResponse,
} from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:4000";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params:
      Promise<{
        id: string;
      }>;
  }
) {
  try {
    const { id } =
      await params;

    const body =
      await request.json();

    const response =
      await fetch(
        `${API_BASE_URL}/api/applications/${id}/status`,
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              body
            ),

          cache:
            "no-store",
        }
      );

    const text =
      await response.text();

    const data =
      text
        ? JSON.parse(
            text
          )
        : {};

    return NextResponse.json(
      data,
      {
        status:
          response.status,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Application status update failed.",
      },
      {
        status: 500,
      }
    );
  }
}