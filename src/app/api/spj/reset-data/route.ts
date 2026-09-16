import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/spj/reset-data
// Deletes all transactions, vendors (except default), BPU (except default)
// and resets the database to a clean state (keeps school + products + letterhead settings)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = body.scope || "transactions"; // transactions, all, vendors, bpu

    let deletedCounts: Record<string, number> = {};

    if (scope === "transactions" || scope === "all") {
      // Delete all documents first (they reference transactions)
      const docs = await db.document.deleteMany({});
      deletedCounts.documents = docs.count;
      // Delete all transactions
      const tx = await db.transaction.deleteMany({});
      deletedCounts.transactions = tx.count;
    }

    if (scope === "vendors" || scope === "all") {
      const v = await db.vendor.deleteMany({});
      deletedCounts.vendors = v.count;
    }

    if (scope === "bpu" || scope === "all") {
      const b = await db.bpu.deleteMany({});
      deletedCounts.bpu = b.count;
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCounts,
      message: `Database berhasil di-reset: ${Object.entries(deletedCounts)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ") || "tidak ada yang dihapus"}`,
    });
  } catch (e) {
    console.error("Reset error:", e);
    return NextResponse.json(
      { error: "Failed to reset: " + (e as Error).message },
      { status: 500 }
    );
  }
}
