import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/spj/document-visibility?groupKey=XXX
//   Returns per-group visibility flags for a single pesanan.
//   Default: all visible (true) — if no record exists, treated as visible.
//   Response: { "visibility": { "dokumen-pembanding": true, ... } }
//
// GET /api/spj/document-visibility?all=true
//   Returns ALL visibility records grouped by groupKey.
//   Response: { "allVisibilities": { "noPesan-01": { "dokumen-pembanding": false }, ... } }
//
// If neither param is provided, returns empty object.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupKey = searchParams.get("groupKey");
    const all = searchParams.get("all");

    // ?all=true → return ALL groups' visibilities
    if (all === "true") {
      const records = await db.documentVisibility.findMany();
      const allVisibilities: Record<string, Record<string, boolean>> = {};
      for (const r of records) {
        if (!allVisibilities[r.groupKey]) {
          allVisibilities[r.groupKey] = {};
        }
        allVisibilities[r.groupKey][r.docType] = r.visible;
      }
      return NextResponse.json({ allVisibilities });
    }

    // ?groupKey=XXX → return single group's visibility
    if (!groupKey) {
      return NextResponse.json({ visibility: {} });
    }

    const records = await db.documentVisibility.findMany({
      where: { groupKey },
    });

    // Build a map of docType → visible
    const visibility: Record<string, boolean> = {};
    for (const r of records) {
      visibility[r.docType] = r.visible;
    }

    return NextResponse.json({ visibility });
  } catch (e) {
    console.error("GET document-visibility error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// PUT /api/spj/document-visibility
// Body: { "groupKey": "XXX", "docType": "dokumen-pembanding", "visible": false }
//
// Upserts the visibility record (creates if missing, updates if exists).
// Returns the updated visibility map for the group.
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { groupKey, docType, visible } = body;

    if (!groupKey || !docType || typeof visible !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: groupKey, docType, visible" },
        { status: 400 },
      );
    }

    // Upsert: create or update the visibility record
    const existing = await db.documentVisibility.findUnique({
      where: {
        groupKey_docType: { groupKey, docType },
      },
    });

    if (existing) {
      await db.documentVisibility.update({
        where: { id: existing.id },
        data: { visible },
      });
    } else {
      await db.documentVisibility.create({
        data: { groupKey, docType, visible },
      });
    }

    // Return the full visibility map for this group
    const records = await db.documentVisibility.findMany({
      where: { groupKey },
    });
    const visibility: Record<string, boolean> = {};
    for (const r of records) {
      visibility[r.docType] = r.visible;
    }

    return NextResponse.json({ visibility, updated: { groupKey, docType, visible } });
  } catch (e) {
    console.error("PUT document-visibility error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
