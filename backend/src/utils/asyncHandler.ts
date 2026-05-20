import { NextFunction, Request, Response } from "express";

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async route handler so rejected promises flow into Express'
 * error handling middleware instead of being silently swallowed.
 */
export const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
