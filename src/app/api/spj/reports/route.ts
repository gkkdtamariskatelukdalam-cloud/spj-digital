import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/reports?type=monthly|vendor|category|status|summary&bulan=X&tahun=Y
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "monthly";
    const bulanParam = url.searchParams.get("bulan");
    const tahunParam = url.searchParams.get("tahun");

    // Fetch all transactions once - we'll reuse for different report types
    const transactions = await db.transaction.findMany({
      select: {
        id: true,
        uraian: true,
        namaBarang: true,
        jumlah: true,
        realisasi: true,
        bulan: true,
        tahun: true,
        status: true,
        masukBku: true,
        vendorId: true,
        tglBayar: true,
      },
    });

    switch (type) {
      case "monthly":
        return NextResponse.json({ type, data: buildMonthly(transactions) });

      case "vendor":
        return NextResponse.json({
          type,
          data: await buildVendor(transactions),
        });

      case "category":
        return NextResponse.json({ type, data: buildCategory(transactions) });

      case "status":
        return NextResponse.json({ type, data: buildStatus(transactions) });

      case "summary": {
        const bulan = bulanParam ? parseInt(bulanParam) : null;
        const tahun = tahunParam ? parseInt(tahunParam) : null;
        return NextResponse.json({
          type,
          bulan,
          tahun,
          data: buildSummary(transactions, bulan, tahun),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("GET reports error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

type Tx = {
  id: string;
  uraian: string;
  namaBarang: string | null;
  jumlah: number;
  realisasi: number;
  bulan: number | null;
  tahun: number;
  status: string;
  masukBku: string | null;
  vendorId: string | null;
  tglBayar: string | null;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function monthName(m: number | null): string {
  if (!m || m < 1 || m > 12) return "Tanpa Bulan";
  return MONTH_NAMES[m - 1];
}

function buildMonthly(txs: Tx[]) {
  const map = new Map<number, { total: number; count: number }>();
  for (const t of txs) {
    const m = t.bulan ?? 0;
    const ex = map.get(m) || { total: 0, count: 0 };
    ex.total += t.jumlah || 0;
    ex.count += 1;
    map.set(m, ex);
  }
  return Array.from(map.entries())
    .map(([month, data]) => ({
      month,
      monthName: monthName(month),
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => a.month - b.month);
}

async function buildVendor(txs: Tx[]) {
  const map = new Map<string, number>();
  const countMap = new Map<string, number>();
  for (const t of txs) {
    if (!t.vendorId) continue;
    map.set(t.vendorId, (map.get(t.vendorId) || 0) + (t.jumlah || 0));
    countMap.set(t.vendorId, (countMap.get(t.vendorId) || 0) + 1);
  }
  const vendorIds = Array.from(map.keys());
  const vendors = await db.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, owner: true, phone: true },
  });
  const unknown = { total: 0, count: 0 };
  for (const t of txs) {
    if (!t.vendorId) {
      unknown.total += t.jumlah || 0;
      unknown.count += 1;
    }
  }
  const byVendor = vendorIds
    .map((id) => {
      const v = vendors.find((x) => x.id === id);
      return {
        vendorId: id,
        name: v?.name || "Unknown",
        owner: v?.owner || null,
        phone: v?.phone || null,
        total: map.get(id) || 0,
        count: countMap.get(id) || 0,
      };
    })
    .sort((a, b) => b.total - a.total);
  return {
    byVendor,
    noVendor: unknown,
    totalVendors: vendorIds.length,
  };
}

const KONSUMSI_KEYWORDS = [
  "nasi",
  "kue",
  "aqua",
  "air mineral",
  "minuman",
  "roti",
  "kopi",
  "teh",
  "snack",
];
const JASA_KEYWORDS = ["jasa", "perbaikan", "servis", "cetak", "ongkos"];
const ATK_KEYWORDS = [
  "kertas",
  "pulpen",
  "bolpoin",
  "spidol",
  "buku",
  "arsip",
  "amplop",
  "stapler",
  "tinta",
];

function categorize(namaBarang: string | null): string {
  if (!namaBarang) return "Lainnya";
  const s = namaBarang.toLowerCase();
  if (KONSUMSI_KEYWORDS.some((k) => s.includes(k))) return "Konsumsi";
  if (JASA_KEYWORDS.some((k) => s.includes(k))) return "Jasa";
  if (ATK_KEYWORDS.some((k) => s.includes(k))) return "ATK";
  return "Lainnya";
}

function buildCategory(txs: Tx[]) {
  const map = new Map<string, { total: number; count: number }>();
  const order = ["Konsumsi", "Jasa", "ATK", "Lainnya"];
  for (const c of order) map.set(c, { total: 0, count: 0 });
  for (const t of txs) {
    const c = categorize(t.namaBarang);
    const ex = map.get(c) || { total: 0, count: 0 };
    ex.total += t.jumlah || 0;
    ex.count += 1;
    map.set(c, ex);
  }
  return order.map((category) => ({
    category,
    total: map.get(category)?.total || 0,
    count: map.get(category)?.count || 0,
  }));
}

function buildStatus(txs: Tx[]) {
  const lunas = {
    count: 0,
    amount: 0,
  };
  const pending = {
    count: 0,
    amount: 0,
  };
  for (const t of txs) {
    const isLunas = t.status === "lunas" || t.masukBku === "MASUK BKU";
    if (isLunas) {
      lunas.count += 1;
      lunas.amount += t.jumlah || 0;
    } else {
      pending.count += 1;
      pending.amount += t.jumlah || 0;
    }
  }
  return {
    lunas,
    pending,
    total: {
      count: txs.length,
      amount: lunas.amount + pending.amount,
    },
  };
}

function buildSummary(txs: Tx[], bulan: number | null, tahun: number | null) {
  const filtered = txs.filter((t) => {
    if (tahun !== null && t.tahun !== tahun) return false;
    if (bulan !== null && t.bulan !== bulan) return false;
    return true;
  });

  const total = filtered.reduce((s, t) => s + (t.jumlah || 0), 0);
  const realisasi = filtered.reduce((s, t) => s + (t.realisasi || 0), 0);

  const lunas = filtered.filter(
    (t) => t.status === "lunas" || t.masukBku === "MASUK BKU"
  );
  const pendingCount = filtered.length - lunas.length;
  const lunasAmount = lunas.reduce((s, t) => s + (t.jumlah || 0), 0);

  // Top vendors in this month
  const vendorMap = new Map<string, number>();
  for (const t of filtered) {
    if (!t.vendorId) continue;
    vendorMap.set(t.vendorId, (vendorMap.get(t.vendorId) || 0) + (t.jumlah || 0));
  }
  const topVendors = Array.from(vendorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Category breakdown for this month
  const catMap = new Map<string, { total: number; count: number }>();
  for (const t of filtered) {
    const c = categorize(t.namaBarang);
    const ex = catMap.get(c) || { total: 0, count: 0 };
    ex.total += t.jumlah || 0;
    ex.count += 1;
    catMap.set(c, ex);
  }
  const categories = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    bulan,
    tahun,
    bulanName: monthName(bulan),
    transactionCount: filtered.length,
    totalAmount: total,
    realisasiAmount: realisasi,
    status: {
      lunas: { count: lunas.length, amount: lunasAmount },
      pending: { count: pendingCount, amount: total - lunasAmount },
    },
    topVendorIds: topVendors.map(([id, amount]) => ({ vendorId: id, amount })),
    categories,
  };
}
