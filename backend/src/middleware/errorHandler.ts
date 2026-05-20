import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";
import { isProduction } from "../config/env";

interface FieldError {
  field: string;
  message: string;
}

/**
 * Global error handler.
 *
 * Catches anything thrown anywhere in the request lifecycle and converts
 * it into a JSON response with the standard `{ success, message, errors? }`
 * envelope. Express identifies error middleware by the four-arg signature,
 * so the unused `_next` parameter must stay.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod schema failures get a 400 with field-level details so the
  // frontend can highlight the offending inputs.
  if (err instanceof ZodError) {
    const errors: FieldError[] = err.errors.map((e) => ({
      field: e.path.join(".") || "(root)",
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  // Anything else is treated as an unexpected server error. We log the
  // full error server-side, but don't leak its details to the client in
  // production — stack traces in browser dev tools is how secrets escape.
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  const fallbackMessage =
    err instanceof Error && !isProduction
      ? err.message
      : "Internal server error";

  res.status(500).json({
    success: false,
    message: fallbackMessage,
    ...(!isProduction && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
