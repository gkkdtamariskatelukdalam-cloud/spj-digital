import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// All doc types that can be toggled
const ALL_DOC_TYPES = [
  "surat-pesanan",
  "dokumen-pembanding",
  "dokumen-rencana",
  "surat-hasil-pemeriksaan",
  "berita-acara-serah-terima",
  "surat-penawaran-toko",
  "kuitansi",
];

// GET /api/spj/print-doc-settings
// Returns which doc types are enabled/disabled.
// Default: all enabled (true) when no record exists.
export async function GET() {
  try {
    const records = await db.printDocSettings.findMany();
    const settings: Record<string, boolean> = {};
    for (const dt of ALL_DOC_TYPES) {
      const rec = records.find((r) => r.docType === dt);
      settings[dt] = rec ? rec.enabled : true;
    }
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("GET print-doc-settings error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// PUT /api/spj/print-doc-settings
// Body: { "docType": "dokumen-pembanding", "enabled": false }
// Upserts the setting (creates if missing, updates if exists).
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { docType, enabled } = body;

    if (!docType || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: docType, enabled" },
        { status: 400 },
      );
    }

    const existing = await db.printDocSettings.findUnique({
      where: { docType },
    });

    if (existing) {
      await db.printDocSettings.update({
        where: { id: existing.id },
        data: { enabled },
      });
    } else {
      await db.printDocSettings.create({
        data: { docType, enabled },
      });
    }

    // Return all settings
    const records = await db.printDocSettings.findMany();
    const settings: Record<string, boolean> = {};
    for (const dt of ALL_DOC_TYPES) {
      const rec = records.find((r) => r.docType === dt);
      settings[dt] = rec ? rec.enabled : true;
    }

    return NextResponse.json({ settings, updated: { docType, enabled } });
  } catch (e) {
    console.error("PUT print-doc-settings error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
