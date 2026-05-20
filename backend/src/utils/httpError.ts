/**
 * Tiny error class for throwing typed HTTP errors from services /
 * controllers. The error handler middleware inspects the `status` field
 * to produce the response.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "HttpError";
  }
}

export const BadRequest = (msg: string, details?: unknown): HttpError =>
  new HttpError(400, msg, details);

export const Unauthorized = (msg = "Unauthorized"): HttpError =>
  new HttpError(401, msg);

export const Forbidden = (msg = "Forbidden"): HttpError =>
  new HttpError(403, msg);

export const NotFound = (msg = "Not found"): HttpError =>
  new HttpError(404, msg);

export const Conflict = (msg: string): HttpError => new HttpError(409, msg);
