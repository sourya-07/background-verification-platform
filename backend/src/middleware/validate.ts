import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/**
 * Generic Zod request validator. Parses the chosen request source through
 * the given schema and replaces it in-place with the parsed (typed) value
 * so downstream handlers get already-coerced data.
 */
export const validate =
  <T>(schema: ZodSchema<T>, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    // Replace the raw input with the parsed (coerced + stripped) result.
    // We cast through `any` because Express' Request types declare these
    // properties as readonly-ish — TS gets in the way here for no benefit.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
