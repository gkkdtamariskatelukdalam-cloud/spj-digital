import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/transactions?bulan=1&tahun=2025&vendorId=xxx&status=lunas&q=search
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bulan = url.searchParams.get("bulan");
    const tahun = url.searchParams.get("tahun");
    const vendorId = url.searchParams.get("vendorId");
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (bulan) where.bulan = parseInt(bulan);
    if (tahun) where.tahun = parseInt(tahun);
    if (vendorId) where.vendorId = vendorId;
    // Status filter: draft (belum lengkap), pending (belum bayar), lunas (sudah bayar)
    if (status === "lunas") where.status = "lunas";
    if (status === "pending") where.status = "pending";
    if (status === "draft") where.status = "draft";
    if (status === "not-draft") where.status = { not: "draft" };
    if (q) {
      where.OR = [
        { uraian: { contains: q } },
        { namaBarang: { contains: q } },
        { noBku: { contains: q } },
        { noPesan: { contains: q } },
      ];
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: { vendor: true },
        orderBy: [{ bulan: "asc" }, { noUrut: "asc" }],
        take: limit,
        skip: offset,
      }),
      db.transaction.count({ where }),
    ]);

    const totalAmount = transactions.reduce(
      (sum, t) => sum + (t.jumlah || 0),
      0
    );

    return NextResponse.json({
      transactions,
      total,
      totalAmount,
      limit,
      offset,
    });
  } catch (e) {
    console.error("GET transactions error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/transactions - create new transaction
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      noUrut,
      tglPesan,
      noPesan,
      tglBast,
      noBast,
      tglBayar,
      noBku,
      bpuCode,
      uraian,
      namaBarang,
      volume,
      satuan,
      tarifHarga,
      jumlah,
      realisasi,
      bulan,
      tahun = 2025,
      masukBku,
      status,
      vendorId,
    } = body;

    if (!uraian) {
      return NextResponse.json(
        { error: "Uraian is required" },
        { status: 400 }
      );
    }

    const computedJumlah =
      jumlah ?? (volume || 0) * (tarifHarga || 0);

    const transaction = await db.transaction.create({
      data: {
        noUrut: noUrut ? parseInt(String(noUrut)) : null,
        tglPesan,
        noPesan,
        tglBast,
        noBast,
        tglBayar,
        noBku,
        bpuCode,
        uraian,
        namaBarang,
        volume: parseFloat(String(volume || 0)),
        satuan,
        tarifHarga: parseFloat(String(tarifHarga || 0)),
        jumlah: parseFloat(String(computedJumlah || 0)),
        realisasi: parseFloat(String(realisasi || computedJumlah || 0)),
        bulan: bulan ? parseInt(String(bulan)) : null,
        tahun: parseInt(String(tahun)),
        masukBku,
        status: status || (masukBku === "MASUK BKU" ? "lunas" : "pending"),
        vendorId: vendorId || null,
      },
      include: { vendor: true },
    });

    return NextResponse.json({ transaction });
  } catch (e) {
    console.error("POST transaction error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
