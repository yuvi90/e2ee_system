import { prisma } from "./prismaClient";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@example.com";
  const password = "Admin@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Admin User",
      email,
      passwordHash,
      publicKey: "test-public-key", // Mock public key for testing
    },
  });

  console.log("✅ Seeded Admin User:", admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
