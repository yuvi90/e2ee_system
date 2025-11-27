import { createLogger, format, transports } from "winston";
import { ENV } from "./env";

const { combine, timestamp, colorize, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = createLogger({
  level: ENV.LOG_LEVEL,
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});

// Helper to log unhandled rejections and exceptions
process.on("unhandledRejection", (err) => {
  logger.error(`UNHANDLED REJECTION: ${(err as Error).message}`);
});

process.on("uncaughtException", (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
});
