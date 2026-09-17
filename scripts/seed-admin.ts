/**
 * One-off seed script: creates the default admin user (admin / admin123)
 * if it doesn't already exist. Run with:
 *   bunx tsx scripts/seed-admin.ts
 *
 * Idempotent — safe to re-run; will not overwrite an existing admin's
 * password.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "admin123";
  const name = "Administrator";
  const role = "admin";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`User '${username}' already exists — skipping seed.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashed,
      role,
      enabledFeatures: JSON.stringify([]), // admin ignores this
      isActive: true,
    },
  });
  console.log("Seeded default admin user:");
  console.log(`  id:        ${user.id}`);
  console.log(`  username:  ${user.username}`);
  console.log(`  password:  ${password} (hashed in DB)`);
  console.log(`  role:      ${user.role}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
