import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/bosp — list all BOSP years
export async function GET() {
  try {
    const bospList = await db.tahunBOSP.findMany({
      orderBy: { tahun: "asc" },
      include: { _count: { select: { transactions: true } } },
    });
    return NextResponse.json({
      bospList: bospList.map(b => ({
        id: b.id,
        tahun: b.tahun,
        isActive: b.isActive,
        transactionCount: b._count.transactions,
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    console.error("GET /api/bosp error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/bosp — create new BOSP year (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { tahun } = body as { tahun?: string };
    
    if (!tahun?.trim()) {
      return NextResponse.json({ error: "Nama BOSP wajib diisi" }, { status: 400 });
    }
    
    // Check uniqueness
    const existing = await db.tahunBOSP.findUnique({ where: { tahun: tahun.trim() } });
    if (existing) {
      return NextResponse.json({ error: "BOSP sudah ada" }, { status: 409 });
    }
    
    const bosp = await db.tahunBOSP.create({
      data: { tahun: tahun.trim(), isActive: false },
    });
    return NextResponse.json({ bosp });
  } catch (e) {
    console.error("POST /api/bosp error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
