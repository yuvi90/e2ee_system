import { PrismaClient } from "./prisma/client";
import { logger } from "../config";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

// Optional: log queries in development
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    logger.info(`📘 Prisma Query: ${e.query}`);
  });
}

// Log warnings and errors globally
prisma.$on("warn", (e) => logger.warn(`Prisma Warning: ${e.message}`));
prisma.$on("error", (e) => logger.error(`Prisma Error: ${e.message}`));

// Graceful shutdown handlers
let isDisconnecting = false;

const gracefulDisconnect = async () => {
  if (isDisconnecting) return;
  isDisconnecting = true;

  try {
    logger.info("Disconnecting Prisma...");
    await prisma.$disconnect();
    logger.info("Prisma disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting Prisma:", error);
  }
};

// Handle different exit scenarios
process.on("beforeExit", gracefulDisconnect);
process.on("SIGTERM", gracefulDisconnect);
process.on("SIGINT", gracefulDisconnect);

export default prisma;
