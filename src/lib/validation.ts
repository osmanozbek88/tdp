import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { handleApiError } from "@/lib/error-handler";

type HandlerWithBody<T> = (
  req: NextRequest,
  body: T,
) => Promise<Response> | Response;

type HandlerWithoutBody = (
  req: NextRequest,
) => Promise<Response> | Response;

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Wraps an API handler with Zod validation for body, query, and/or params.
 * Parsed and validated data is passed to the handler.
 */
export function withValidation<T>(
  schemas: ValidationSchemas,
  handler: HandlerWithBody<T>,
): HandlerWithoutBody;

export function withValidation(
  schemas: ValidationSchemas,
  handler: HandlerWithBody<unknown>,
): HandlerWithoutBody {
  return async (req: NextRequest) => {
    try {
      let body: unknown = undefined;

      if (schemas.body) {
        const raw = await req.json();
        body = schemas.body.parse(raw);
      }

      if (schemas.query) {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        schemas.query.parse(queryParams);
      }

      return handler(req, body);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wraps an API handler that doesn't need body validation.
 */
export function withApiHandler(handler: HandlerWithoutBody): HandlerWithoutBody {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
