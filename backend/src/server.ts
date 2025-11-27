import { app } from "./app";
import { ENV, logger } from "./config";
import { prisma } from "./db/prismaClient";

/**
 * Start the HTTP server.
 * Includes graceful shutdown and DB health check.
 */
async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info("Database connected successfully.");

    const server = app.listen(ENV.PORT, () => {
      logger.info(
        `Server running on http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");
      await prisma.$disconnect();
      server.close(() => {
        logger.info("Server closed. Goodbye!");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    logger.error(`Server startup failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

startServer();
