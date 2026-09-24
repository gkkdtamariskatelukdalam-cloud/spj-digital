import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spj/transactions/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { vendor: true, documents: true },
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ transaction });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/spj/transactions/[id]
// Allows updating ALL 34 imported fields (kolom A-AH from Excel) +
// computed/derived fields. Previously only 20 fields were editable —
// now includes kodeProgram, kodeRekening, tglPerencanaan, tglPeriksa,
// kategoriBelanja, spesifikasiBarang, hargaToko1/2, namaToko1/2,
// direkturToko1, alamatToko1/2, uraianKwitansi, namaPekerjaanKategori,
// satuan2, hargaSatuanSebelumPajak (kolom AB), jumlahHargaSebelumPajak (AC),
// hargaTotalAsli (AD), totalHargaSebelumDPP (AE), totalHargaAsli (AF),
// alamatSuratBalasan, noHp — so Data Belanja can edit everything imported.
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    // Integer fields (nullable)
    const intFields = ["noUrut", "bulan", "tahun"];
    // Float fields (nullable for System 2, default 0 for System 1)
    const floatFields = [
      "volume", "tarifHarga", "jumlah", "realisasi",
      // System 2 floats (kolom AB-AF) — nullable
      "hargaSatuanSebelumPajak", // kolom AB
      "jumlahHargaSebelumPajak", // kolom AC
      "hargaTotalAsli", // kolom AD
      "totalHargaSebelumDPP", // kolom AE
      "totalHargaAsli", // kolom AF
      "hargaToko1", "hargaToko2", // kolom R, S
    ];
    // String fields (nullable)
    const strFields = [
      "tglPesan", "noPesan", "tglBast", "noBast", "tglBayar",
      "noBku", "bpuCode", "uraian", "namaBarang", "satuan",
      "masukBku", "status",
      // System 1 strings
      "tglPerencanaan", "tglPeriksa", "kodeProgram", "kodeRekening",
      "kategoriBelanja", "spesifikasiBarang",
      "namaToko1", "namaToko2", "direkturToko1",
      "alamatToko1", "alamatToko2",
      "uraianKwitansi", "namaPekerjaanKategori", "satuan2",
      "alamatSuratBalasan", "noHp",
    ];
    // Special: vendorId (foreign key)
    const relFields = ["vendorId"];

    const allAllowed = [...intFields, ...floatFields, ...strFields, ...relFields];
    for (const f of allAllowed) {
      if (body[f] === undefined) continue;

      if (intFields.includes(f)) {
        updateData[f] = body[f] === null || body[f] === ""
          ? null
          : parseInt(String(body[f]));
      } else if (floatFields.includes(f)) {
        if (body[f] === null || body[f] === "") {
          // System 2 floats are nullable; System 1 floats default to 0
          if (["volume", "tarifHarga", "jumlah", "realisasi"].includes(f)) {
            updateData[f] = 0;
          } else {
            updateData[f] = null;
          }
        } else {
          updateData[f] = parseFloat(String(body[f]));
        }
      } else if (relFields.includes(f)) {
        updateData[f] = body[f] === "__none__" || body[f] === "" ? null : body[f];
      } else {
        // String field — empty string becomes null
        updateData[f] = body[f] === "" ? null : body[f];
      }
    }

    // Recompute jumlah if volume or tarif changes (System 1 pricing)
    if (body.volume !== undefined || body.tarifHarga !== undefined) {
      const current = await db.transaction.findUnique({
        where: { id },
      });
      if (current) {
        const v = body.volume !== undefined ? parseFloat(body.volume) || 0 : current.volume;
        const t = body.tarifHarga !== undefined ? parseFloat(body.tarifHarga) || 0 : current.tarifHarga;
        if (body.jumlah === undefined) {
          updateData.jumlah = (v || 0) * (t || 0);
        }
        if (body.realisasi === undefined) {
          updateData.realisasi = (v || 0) * (t || 0);
        }
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: { vendor: true },
    });
    return NextResponse.json({ transaction });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/spj/transactions/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
