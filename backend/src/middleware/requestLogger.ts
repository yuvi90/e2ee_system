import { Request, Response, NextFunction } from "express";
import { logger } from "../config";

export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.info(`➡️ ${req.method} ${req.originalUrl}`);
  next();
};
