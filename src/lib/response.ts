import { NextResponse } from "next/server";

// ─── Response Envelope Types ───

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ─── Success Responses ───

export function sendSuccess<T>(
  data: T,
  meta?: PaginationMeta,
  status: number = 200,
): NextResponse<SuccessResponse<T>> {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function sendCreated<T>(data: T): NextResponse<SuccessResponse<T>> {
  return sendSuccess(data, undefined, 201);
}

export function sendNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ─── Error Responses ───

export function sendBadRequest(
  message: string,
  code: string = "BAD_REQUEST",
  details?: Record<string, string[]>,
): NextResponse<ErrorResponse> {
  return sendError(400, code, message, details);
}

export function sendUnauthorized(
  message: string = "Authentication required",
): NextResponse<ErrorResponse> {
  return sendError(401, "UNAUTHORIZED", message);
}

export function sendForbidden(
  message: string = "Insufficient permissions",
): NextResponse<ErrorResponse> {
  return sendError(403, "FORBIDDEN", message);
}

export function sendNotFound(
  message: string = "Resource not found",
): NextResponse<ErrorResponse> {
  return sendError(404, "NOT_FOUND", message);
}

export function sendConflict(
  message: string,
  code: string = "CONFLICT",
): NextResponse<ErrorResponse> {
  return sendError(409, code, message);
}

export function sendValidationError(
  details: Record<string, string[]>,
): NextResponse<ErrorResponse> {
  return sendError(422, "VALIDATION_ERROR", "Request validation failed", details);
}

export function sendInternalError(
  message: string = "Internal server error",
): NextResponse<ErrorResponse> {
  return sendError(500, "INTERNAL_ERROR", message);
}

function sendError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return NextResponse.json(body, { status });
}
