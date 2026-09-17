/**
 * Seed a default School record into Neon DB.
 * Idempotent — will not overwrite existing School record.
 *
 * Run with: bunx tsx scripts/seed-school.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.school.findFirst();
  if (existing) {
    console.log(`School already exists (id: ${existing.id}, name: ${existing.name}) — skipping seed.`);
    return;
  }

  const school = await prisma.school.create({
    data: {
      name: "SMA NEGERI 1 TELUKDALAM",
      npsn: "10258246",
      address: "Jl. Pendidikan No. 13 Kel. Pasar Teluk Dalam, Kec. Teluk Dalam, Kab. Nias Selatan, Kode Pos 22865",
      // Officials (from original Excel analysis — visible in PDF documents)
      principalName: "Nursari Rindu Simanullang, S.Pd., M.M.",
      principalNip: "19691208 200502 2 001",
      principalRank: "Pembina Tk I",
      treasurerName: "Riama Tiodora Siahaan, S.Pd",
      treasurerNip: "19800301 201001 2 016",
      treasurerRank: "Penata TK. I",
      goodsManagerName: "Radius S. K. Siburian, S.Pd",
      goodsManagerNip: "19861005 201903 1 009",
      goodsManagerRank: "Penata Muda",
      year: 2025,
    },
  });
  console.log("Seeded default School record:");
  console.log(`  id: ${school.id}`);
  console.log(`  name: ${school.name}`);
  console.log(`  principal: ${school.principalName} (NIP ${school.principalNip})`);
  console.log(`  treasurer: ${school.treasurerName} (NIP ${school.treasurerNip})`);
  console.log(`  goodsManager: ${school.goodsManagerName} (NIP ${school.goodsManagerNip})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
