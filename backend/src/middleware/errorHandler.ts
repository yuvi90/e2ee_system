import { Request, Response, NextFunction } from "express";
import { logger } from "../config";

interface ApiError extends Error {
  status?: number;
}

/**
 * Global error handler for catching all runtime and async errors.
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
  });
};
