import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

// Configs
import {
  applySecurity,
  corsOptions,
  apiRateLimiter,
  ENV,
  logger,
} from "./config";

// Middlewares
import { requestLogger, errorHandler } from "./middleware/index";

// Routes
import authRoutes from "./modules/v1/auth/auth.routes";
import fileRoutes from "./modules/v1/files/file.routes";
import shareRoutes from "./modules/v1/shared/shared.routes";

/**
 *  App configuration.
 */
export const app: Application = express();

/**
 * Global Middleware Stack
 */
applySecurity(app); // Helmet & secure headers
app.use(cors(corsOptions)); // Strict origin protection
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// HTTP request logging
app.use(morgan("dev"));
app.use(requestLogger);
app.use(apiRateLimiter);
// Static Files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/share", shareRoutes);

// Health Check Route
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Server is healthy!", env: ENV.NODE_ENV });
});

// Global Error Handler
app.use(errorHandler);
