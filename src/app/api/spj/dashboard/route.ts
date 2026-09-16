import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [transactions, vendors, products, bpu, school, documents] =
      await Promise.all([
        db.transaction.findMany({
          select: {
            id: true,
            jumlah: true,
            realisasi: true,
            bulan: true,
            tahun: true,
            status: true,
            vendorId: true,
            tglBayar: true,
            masukBku: true,
          },
        }),
        db.vendor.count(),
        db.product.count(),
        db.bpu.count(),
        db.school.findFirst(),
        db.document.count(),
      ]);

    // Calculate stats
    const totalAmount = transactions.reduce(
      (sum, t) => sum + (t.jumlah || 0),
      0
    );
    const totalRealisasi = transactions.reduce(
      (sum, t) => sum + (t.realisasi || 0),
      0
    );
    const lunasCount = transactions.filter(
      (t) => t.status === "lunas" || t.masukBku === "MASUK BKU"
    ).length;
    const pendingCount = transactions.length - lunasCount;

    // Monthly breakdown
    const monthlyMap = new Map<number, { total: number; count: number }>();
    for (const t of transactions) {
      const m = t.bulan || 0;
      if (m < 1 || m > 12) continue;
      const existing = monthlyMap.get(m) || { total: 0, count: 0 };
      existing.total += t.jumlah || 0;
      existing.count += 1;
      monthlyMap.set(m, existing);
    }
    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        monthName: getMonthName(month),
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month - b.month);

    // Vendor breakdown (top 5 by total amount)
    const vendorMap = new Map<string, number>();
    for (const t of transactions) {
      if (!t.vendorId) continue;
      vendorMap.set(
        t.vendorId,
        (vendorMap.get(t.vendorId) || 0) + (t.jumlah || 0)
      );
    }
    const vendorIds = Array.from(vendorMap.keys());
    const vendorRecords = await db.vendor.findMany({
      where: { id: { in: vendorIds } },
    });
    const byVendor = vendorIds
      .map((id) => ({
        vendorId: id,
        name: vendorRecords.find((v) => v.id === id)?.name || "Unknown",
        total: vendorMap.get(id) || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Status breakdown
    const statusBreakdown = {
      lunas: lunasCount,
      pending: pendingCount,
      total: transactions.length,
    };

    return NextResponse.json({
      school,
      stats: {
        totalAmount,
        totalRealisasi,
        transactionCount: transactions.length,
        vendorCount: vendors,
        productCount: products,
        bpuCount: bpu,
        documentCount: documents,
        statusBreakdown,
      },
      monthly,
      byVendor,
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json(
      { error: "Failed to load dashboard: " + (e as Error).message },
      { status: 500 }
    );
  }
}

function getMonthName(m: number): string {
  const names = [
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
  return names[m - 1] || "Unknown";
}
