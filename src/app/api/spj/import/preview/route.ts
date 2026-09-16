import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// POST /api/spj/import/preview
// Parses the Excel file and returns a preview of data without importing
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .xlsx or .xls files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Find the first sheet (or sheet named "Master")
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      if (name.toLowerCase().includes("master")) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return NextResponse.json(
        { error: `Sheet "${sheetName}" not found` },
        { status: 400 }
      );
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: null,
    }) as unknown[][];

    if (rows.length < 4) {
      return NextResponse.json(
        { error: "Excel file has insufficient rows" },
        { status: 400 }
      );
    }

    const headers = (rows[1] as unknown[]).map((h) =>
      h ? String(h).trim() : ""
    );

    // Map columns
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes("no. surat pesan")) colMap.noPesan = i;
      else if (lower.includes("no bku")) colMap.noBku = i;
      else if (lower.includes("tanggal pesanan")) colMap.tglPesan = i;
      else if (lower.includes("tanggal bayar")) colMap.tglBayar = i;
      else if (lower.includes("uraian kegiatan")) colMap.uraian = i;
      else if (lower.includes("nama barang")) colMap.namaBarang = i;
      else if (lower === "volume") colMap.volume = i;
      else if (lower === "satuan") colMap.satuan = i;
      else if (lower.includes("harga satuan")) colMap.hargaSatuan = i;
      else if (lower === "jumlah") colMap.jumlah = i;
      else if (lower.includes("nama toko 1")) colMap.namaToko1 = i;
    });

    function parseStr(val: unknown): string {
      if (val === null || val === undefined) return "";
      const str = String(val).trim();
      if (str === "#N/A") return "";
      return str;
    }

    function parseNum(val: unknown): number {
      if (val === null || val === undefined || val === "") return 0;
      if (typeof val === "number") return val;
      const cleaned = String(val).replace(/[^\d.-]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    const dataRows = rows.slice(3).filter((row) => {
      return (row as unknown[]).some(
        (cell) => cell !== null && cell !== undefined && cell !== ""
      );
    });

    // Build preview (first 10 rows)
    const preview = dataRows.slice(0, 10).map((row) => {
      const cells = row as unknown[];
      return {
        noPesan: parseStr(cells[colMap.noPesan]),
        noBku: parseStr(cells[colMap.noBku]),
        uraian: parseStr(cells[colMap.uraian]),
        namaBarang: parseStr(cells[colMap.namaBarang]),
        volume: parseNum(cells[colMap.volume]),
        satuan: parseStr(cells[colMap.satuan]),
        hargaSatuan: parseNum(cells[colMap.hargaSatuan]),
        jumlah: parseNum(cells[colMap.jumlah]),
        vendorName: parseStr(cells[colMap.namaToko1]),
      };
    });

    // Count unique vendors
    const vendorSet = new Set<string>();
    const bpuSet = new Set<string>();
    let totalAmount = 0;

    for (const row of dataRows) {
      const cells = row as unknown[];
      const vname = parseStr(cells[colMap.namaToko1]);
      if (vname) vendorSet.add(vname);
      const bku = parseStr(cells[colMap.noBku]);
      if (bku) bpuSet.add(bku);
      totalAmount += parseNum(cells[colMap.jumlah]);
    }

    return NextResponse.json({
      sheetName,
      totalRows: dataRows.length,
      totalVendors: vendorSet.size,
      totalBpu: bpuSet.size,
      totalAmount,
      preview,
      detectedColumns: {
        noPesan: colMap.noPesan !== undefined,
        noBku: colMap.noBku !== undefined,
        tglPesan: colMap.tglPesan !== undefined,
        uraian: colMap.uraian !== undefined,
        namaBarang: colMap.namaBarang !== undefined,
        volume: colMap.volume !== undefined,
        satuan: colMap.satuan !== undefined,
        hargaSatuan: colMap.hargaSatuan !== undefined,
        jumlah: colMap.jumlah !== undefined,
        vendorName: colMap.namaToko1 !== undefined,
      },
    });
  } catch (e) {
    console.error("Preview error:", e);
    return NextResponse.json(
      { error: "Failed to parse: " + (e as Error).message },
      { status: 500 }
    );
  }
}
