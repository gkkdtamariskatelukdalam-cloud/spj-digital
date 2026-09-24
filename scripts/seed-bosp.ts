import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Delete all transactions (kosongkan data)
  console.log("Deleting all transactions...");
  const deleted = await prisma.transaction.deleteMany({});
  console.log(`  Deleted ${deleted.count} transactions`);
  
  // 2. Delete all documents
  console.log("Deleting all documents...");
  const deletedDocs = await prisma.document.deleteMany({});
  console.log(`  Deleted ${deletedDocs.count} documents`);
  
  // 3. Create BOSP 2025 (active)
  console.log("Creating BOSP 2025...");
  const bosp2025 = await prisma.tahunBOSP.create({
    data: { tahun: "BOSP 2025", isActive: true },
  });
  console.log(`  Created: ${bosp2025.tahun} (id: ${bosp2025.id}, active: ${bosp2025.isActive})`);
  
  // 4. Update School year to 2025
  console.log("Updating School year...");
  const school = await prisma.school.findFirst();
  if (school) {
    await prisma.school.update({
      where: { id: school.id },
      data: { year: 2025 },
    });
    console.log("  School year set to 2025");
  }
  
  console.log("\nDone! Database siap untuk BOSP 2025.");
}

main()
  .catch((e) => { console.error("Failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
