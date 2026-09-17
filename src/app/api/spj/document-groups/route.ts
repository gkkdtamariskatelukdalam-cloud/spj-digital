import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/document-groups
// Returns transactions grouped by noPesan (or noBku if noPesan missing)
// Each group contains all items needed to render document templates
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bulan = url.searchParams.get("bulan");
    const q = url.searchParams.get("q");

    const where: Record<string, unknown> = {};
    if (bulan) where.bulan = parseInt(bulan);

    const transactions = await db.transaction.findMany({
      where,
      include: { vendor: true },
      orderBy: [{ bulan: "asc" }, { noUrut: "asc" }],
    });

    type Group = {
      key: string;
      noPesan: string;
      noBku: string;
      bpuCode: string;
      tglPesan: string | null;
      tglBast: string | null;
      tglBayar: string | null;
      bulan: number | null;
      tahun: number;
      vendorId: string | null;
      vendorName: string | null;
      vendorOwner: string | null;
      vendorPhone: string | null;
      vendorAddress: string | null;
      kodeProgram: string | null;
      kodeRekening: string | null;
      items: Array<{
        id: string;
        uraian: string;
        namaBarang: string | null;
        volume: number;
        satuan: string | null;
        tarifHarga: number;
        jumlah: number;
        realisasi: number;
        noBku: string | null;
        noBast: string | null;
        tglBayar: string | null;
      }>;
      totalJumlah: number;
      totalRealisasi: number;
      itemCount: number;
    };

    const groupMap = new Map<string, Group>();

    for (const t of transactions) {
      const key = t.noPesan || t.noBku || `unknown-${t.id}`;

      if (q) {
        const testStr = `${t.noPesan} ${t.noBku} ${t.uraian} ${t.vendor?.name || ""}`.toLowerCase();
        if (!testStr.includes(q.toLowerCase())) continue;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          noPesan: t.noPesan || "",
          noBku: t.noBku || "",
          bpuCode: t.bpuCode || t.noBku || "",
          tglPesan: t.tglPesan,
          tglBast: t.tglBast,
          tglBayar: t.tglBayar,
          bulan: t.bulan,
          tahun: t.tahun,
          vendorId: t.vendorId,
          vendorName: t.vendor?.name || null,
          vendorOwner: t.vendor?.owner || null,
          vendorPhone: t.vendor?.phone || null,
          vendorAddress: t.vendor?.address || null,
          kodeProgram: t.kodeProgram,
          kodeRekening: t.kodeRekening,
          items: [],
          totalJumlah: 0,
          totalRealisasi: 0,
          itemCount: 0,
        });
      }

      const group = groupMap.get(key)!;
      group.items.push({
        id: t.id,
        uraian: t.uraian,
        namaBarang: t.namaBarang,
        volume: t.volume,
        satuan: t.satuan,
        tarifHarga: t.tarifHarga,
        jumlah: t.jumlah,
        realisasi: t.realisasi,
        noBku: t.noBku,
        noBast: t.noBast,
        tglBayar: t.tglBayar,
        spesifikasiBarang: t.spesifikasiBarang,
      });
      group.totalJumlah += t.jumlah;
      group.totalRealisasi += t.realisasi;
      group.itemCount += 1;

      if (!group.noBast && t.noBast) group.noBast = t.noBast;
      if (!group.tglBast && t.tglBast) group.tglBast = t.tglBast;
      if (!group.tglBayar && t.tglBayar) group.tglBayar = t.tglBayar;
    }

    const groups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.bulan !== b.bulan) return (a.bulan || 99) - (b.bulan || 99);
      return a.noPesan.localeCompare(b.noPesan);
    });

    const totalGroups = groups.length;
    const totalAllAmount = groups.reduce((s, g) => s + g.totalJumlah, 0);
    const withVendor = groups.filter((g) => g.vendorId).length;

    return NextResponse.json({
      groups,
      summary: {
        totalGroups,
        totalAllAmount,
        withVendor,
        withoutVendor: totalGroups - withVendor,
      },
    });
  } catch (e) {
    console.error("Document groups error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
