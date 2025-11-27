import { Response } from "express";
import { ApiResponse } from "../types/api.js";

/**
 * Send a standardized success response.
 */
export function success<T>(
  res: Response,
  message: string,
  data?: T,
  status = 200
): Response<ApiResponse<T>> {
  return res.status(status).json({ success: true, message, data });
}

/**
 * Send a standardized error response.
 */
export function fail(
  res: Response,
  message: string,
  status = 400,
  error?: any
): Response<ApiResponse> {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}
