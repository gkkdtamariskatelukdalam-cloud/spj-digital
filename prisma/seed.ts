// Seed script for SPJ application
// Populates database with data extracted from Cetak ATK_2025.xlsm

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface SeedSchool {
  [key: number]: { label: string; value: string | null; extra: string | null };
}

interface SeedVendor {
  name: string;
  owner: string;
  phone: string;
  address: string;
}

interface SeedTransaction {
  no_urut: number | null;
  tgl_pesan: string | null;
  no_pesan: string;
  tgl_bast: string | null;
  no_bast: string;
  tgl_bayar: string | null;
  no_bku: string;
  uraian: string;
  nama_barang: string;
  volume: number;
  satuan: string;
  tarif_harga: number;
  jumlah: number;
  realisasi: number;
  bulan: number | null;
  vendor_name: string;
  masuk_bku: string;
}

async function main() {
  const analysisDir = "/home/z/my-project/analysis";

  // 1. Seed School
  console.log("🏫 Seeding school data...");
  const schoolRaw = JSON.parse(
    fs.readFileSync(path.join(analysisDir, "seed_school.json"), "utf-8")
  ) as SeedSchool;

  const schoolName = schoolRaw[2]?.value || "SMA NEGERI 1 TELUKDALAM";
  const npsn = schoolRaw[3]?.value ? String(schoolRaw[3].value) : "10258246";
  const address =
    schoolRaw[4]?.value ||
    "Jl. Pendidikan No. 13 Kelurahan Pasar Telukdalam Kecamatan Teluk Dalam";
  const principalName = schoolRaw[6]?.label || "";
  const principalNip = schoolRaw[6]?.value ? String(schoolRaw[6].value) : "";
  const principalRank = schoolRaw[6]?.extra || "";
  const treasurerName = schoolRaw[8]?.label || "";
  const treasurerNip = schoolRaw[8]?.value ? String(schoolRaw[8].value) : "";
  const treasurerRank = schoolRaw[8]?.extra || "";
  const goodsManagerName = schoolRaw[10]?.label || "";
  const goodsManagerNip = schoolRaw[10]?.value ? String(schoolRaw[10].value) : "";
  const goodsManagerRank = schoolRaw[10]?.extra || "";
  const receiverName = schoolRaw[12]?.label || "";
  const receiverPhone = schoolRaw[12]?.value ? String(schoolRaw[12].value) : "";

  await prisma.school.upsert({
    where: { id: "school-main" },
    update: {},
    create: {
      id: "school-main",
      name: schoolName,
      npsn,
      address,
      principalName,
      principalNip,
      principalRank,
      treasurerName,
      treasurerNip,
      treasurerRank,
      goodsManagerName,
      goodsManagerNip,
      goodsManagerRank,
      receiverName,
      receiverPhone,
      year: 2025,
    },
  });
  console.log(`  ✓ School: ${schoolName}`);

  // 2. Seed Vendors
  console.log("🏪 Seeding vendors...");
  const vendorsRaw = JSON.parse(
    fs.readFileSync(path.join(analysisDir, "seed_vendors.json"), "utf-8")
  ) as SeedVendor[];

  const vendorMap = new Map<string, string>();
  for (const v of vendorsRaw) {
    const cleaned = {
      name: v.name,
      owner: v.owner && !v.owner.includes("#N/A") ? v.owner : null,
      phone: v.phone && !v.phone.includes("#N/A") ? v.phone : null,
      address: v.address && !v.address.includes("#N/A") ? v.address : null,
    };
    const created = await prisma.vendor.create({ data: cleaned });
    vendorMap.set(v.name, created.id);
  }
  console.log(`  ✓ ${vendorMap.size} vendors seeded`);

  // 3. Seed BPU
  console.log("📋 Seeding BPU codes...");
  const bpuRaw = JSON.parse(
    fs.readFileSync(path.join(analysisDir, "seed_bpu.json"), "utf-8")
  ) as Array<{ code: string; name: string }>;

  let bpuCount = 0;
  for (const b of bpuRaw) {
    await prisma.bpu.create({
      data: {
        code: b.code,
        noPesan: b.name ? String(b.name) : null,
      },
    });
    bpuCount++;
  }
  console.log(`  ✓ ${bpuCount} BPU codes seeded`);

  // 4. Seed Products
  console.log("📦 Seeding products...");
  const productsRaw = JSON.parse(
    fs.readFileSync(path.join(analysisDir, "seed_products.json"), "utf-8")
  ) as Array<{
    no: number | string;
    name: string;
    spec: string | null;
    unit: string | null;
    price: number | string;
  }>;

  let productCount = 0;
  for (const p of productsRaw) {
    // In the seed file, the product name is in the "no" field
    const name = String(p.no || p.name || "").trim();
    if (!name) continue;
    const priceValue =
      typeof p.price === "number"
        ? p.price
        : typeof p.price === "string" && !isNaN(Number(p.price))
        ? Number(p.price)
        : 0;
    await prisma.product.create({
      data: {
        name,
        spec: p.spec ? String(p.spec) : null,
        unit: p.unit ? String(p.unit) : null,
        price: priceValue,
        category: "ATK",
      },
    });
    productCount++;
  }
  console.log(`  ✓ ${productCount} products seeded`);

  // 5. Seed Transactions
  console.log("💰 Seeding transactions...");
  const txRaw = JSON.parse(
    fs.readFileSync(path.join(analysisDir, "seed_transactions_clean.json"), "utf-8")
  ) as SeedTransaction[];

  let txCount = 0;
  let totalAmount = 0;
  for (const t of txRaw) {
    if (!t.uraian && !t.nama_barang) continue;
    const vendorId = t.vendor_name ? vendorMap.get(t.vendor_name) : null;
    const created = await prisma.transaction.create({
      data: {
        noUrut: t.no_urut,
        tglPesan: t.tgl_pesan,
        noPesan: t.no_pesan || null,
        tglBast: t.tgl_bast,
        noBast: t.no_bast || null,
        tglBayar: t.tgl_bayar,
        noBku: t.no_bku || null,
        bpuCode: t.no_bku || null,
        uraian: t.uraian || "",
        namaBarang: t.nama_barang || null,
        volume: t.volume || 0,
        satuan: t.satuan || null,
        tarifHarga: t.tarif_harga || 0,
        jumlah: t.jumlah || 0,
        realisasi: t.realisasi || 0,
        bulan: t.bulan && t.bulan <= 12 ? t.bulan : null,
        tahun: 2025,
        masukBku: t.masuk_bku || null,
        status: t.masuk_bku === "MASUK BKU" ? "lunas" : "pending",
        vendorId: vendorId,
      },
    });
    txCount++;
    totalAmount += t.jumlah || 0;
  }
  console.log(`  ✓ ${txCount} transactions seeded`);
  console.log(`  💎 Total amount: Rp ${totalAmount.toLocaleString("id-ID")}`);

  console.log("\n✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
