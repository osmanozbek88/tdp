import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import type { ErrorResponse } from "@/lib/response";

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Check for AppError-like objects (duck-typing to handle
  // Next.js module reloading where instanceof may fail).
  if (
    error instanceof AppError ||
    (error != null &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as Record<string, unknown>).statusCode === "number")
  ) {
    const appErr = error as AppError;

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: appErr.code,
          message: appErr.message,
          ...(appErr.details ? { details: appErr.details } : {}),
        },
      },
      { status: appErr.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!details[path]) details[path] = [];
      details[path]!.push(issue.message);
    }

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details,
        },
      },
      { status: 422 },
    );
  }

  // Unknown errors
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}
