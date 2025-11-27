import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrap async route handlers to automatically forward errors
 * to the global error handler.
 */
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
