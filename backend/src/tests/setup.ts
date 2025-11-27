import { prisma } from "../db/prismaClient.js";
import { app } from "../app.js";
import request from "supertest";

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  const tables = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table'
  `;
  for (const { name } of tables) {
    if (name !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

export const testClient = request(app);
