import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/spj/transaksi-detail
// Body: { transactionId: string }
// Returns full transaction detail with vendor + documents
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId } = body as { transactionId?: string };
    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        vendor: true,
        documents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    // Group documents by type for convenience
    const documentsByType: Record<string, typeof transaction.documents> = {};
    for (const doc of transaction.documents) {
      if (!documentsByType[doc.type]) documentsByType[doc.type] = [];
      documentsByType[doc.type].push(doc);
    }
    return NextResponse.json({
      transaction,
      documentsByType,
    });
  } catch (e) {
    console.error("POST transaksi-detail error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
