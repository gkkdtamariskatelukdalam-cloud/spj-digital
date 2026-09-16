import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/print-status?groupKey=XXX
// Returns print status for all 7 document types for a given group key
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const groupKey = url.searchParams.get("groupKey");
    
    if (!groupKey) {
      return NextResponse.json(
        { error: "groupKey is required" },
        { status: 400 }
      );
    }
    
    const statuses = await db.printStatus.findMany({
      where: { groupKey },
    });
    
    // Build status map: docType -> { printed, printedAt, printedCount }
    const statusMap: Record<string, { printed: boolean; printedAt: string | null; printedCount: number }> = {};
    for (const s of statuses) {
      statusMap[s.docType] = {
        printed: true,
        printedAt: s.printedAt.toISOString(),
        printedCount: s.printedCount,
      };
    }
    
    return NextResponse.json({ groupKey, statuses: statusMap });
  } catch (e) {
    console.error("GET print-status error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/spj/print-status
// Mark a document as printed (or increment count if already printed)
// Body: { groupKey, docType }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupKey, docType } = body;
    
    if (!groupKey || !docType) {
      return NextResponse.json(
        { error: "groupKey and docType are required" },
        { status: 400 }
      );
    }
    
    // Upsert: if exists, increment count + update printedAt; else create
    const existing = await db.printStatus.findUnique({
      where: {
        groupKey_docType: { groupKey, docType },
      },
    });
    
    let status;
    if (existing) {
      status = await db.printStatus.update({
        where: { id: existing.id },
        data: {
          printedAt: new Date(),
          printedCount: { increment: 1 },
        },
      });
    } else {
      status = await db.printStatus.create({
        data: { groupKey, docType },
      });
    }
    
    return NextResponse.json({
      success: true,
      status: {
        docType: status.docType,
        printed: true,
        printedAt: status.printedAt.toISOString(),
        printedCount: status.printedCount,
      },
    });
  } catch (e) {
    console.error("POST print-status error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/spj/print-status?all=true
// Returns print status for ALL groups (for batch display in table)
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const getAll = url.searchParams.get("all") === "true";
    
    if (!getAll) {
      return NextResponse.json(
        { error: "Use ?all=true to get all print statuses" },
        { status: 400 }
      );
    }
    
    const allStatuses = await db.printStatus.findMany();
    
    // Build map: groupKey -> { docType -> { printed, printedAt } }
    const statusMap: Record<string, Record<string, { printed: boolean; printedAt: string }>> = {};
    for (const s of allStatuses) {
      if (!statusMap[s.groupKey]) {
        statusMap[s.groupKey] = {};
      }
      statusMap[s.groupKey][s.docType] = {
        printed: true,
        printedAt: s.printedAt.toISOString(),
      };
    }
    
    return NextResponse.json({ allStatuses: statusMap });
  } catch (e) {
    console.error("PUT print-status error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
