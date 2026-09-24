import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

// PUT /api/bosp/[id] — activate this BOSP year (deactivate all others)
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Deactivate all
    await db.tahunBOSP.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    
    // Activate selected
    const bosp = await db.tahunBOSP.update({
      where: { id: params.id },
      data: { isActive: true },
    });
    
    // Update School year
    const yearMatch = bosp.tahun.match(/\d{4}/);
    if (yearMatch) {
      const school = await db.school.findFirst();
      if (school) {
        await db.school.update({
          where: { id: school.id },
          data: { year: parseInt(yearMatch[0]) },
        });
      }
    }
    
    return NextResponse.json({ bosp });
  } catch (e) {
    console.error("PUT /api/bosp/[id] error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/bosp/[id] — delete BOSP year (admin only, guard: cannot delete active or with transactions)
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const target = await db.tahunBOSP.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (target.isActive) {
      return NextResponse.json({ error: "Tidak bisa menghapus BOSP yang aktif" }, { status: 400 });
    }
    
    const txCount = await db.transaction.count({ where: { tahunBospId: params.id } });
    if (txCount > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus — masih ada ${txCount} transaksi` },
        { status: 400 },
      );
    }
    
    await db.tahunBOSP.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bosp/[id] error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
