import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { getLogger } from "@/lib/logger";
import type { ErrorResponse } from "@/lib/response";

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  const logger = getLogger();

  if (error instanceof AppError) {
    logger.warn({ code: error.code, statusCode: error.statusCode }, error.message);

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!details[path]) details[path] = [];
      details[path]!.push(issue.message);
    }

    logger.warn({ details }, "Validation error");

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
  logger.error({ err: error }, "Unhandled error");

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
