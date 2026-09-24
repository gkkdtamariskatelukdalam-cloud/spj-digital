import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

// POST /api/spj/import
// Accepts multipart form data with file field "file" (Excel .xlsx)
// Parses the Excel and imports transactions, vendors, and BPU codes.
//
// DEDUP STRATEGY (per user requirement):
//   1. Primary match: excelRowNum (Excel row position)
//      → Stable even when user later fills in empty cells in same file
//   2. Secondary match: composite key `${noPesan}|${noBku}|${namaBarang}`
//      → Catches rows that moved positions but kept same identity
//   3. No match → CREATE new
//
// All rows with any meaningful data are imported, even if some cells are empty.
// Re-importing the same file (with filled-in cells) updates existing rows, not duplicates.

interface ParsedTx {
  noUrut: number | null;
  noPesan: string;
  noBku: string;
  bpuCode: string;
  kodeProgram: string;
  kodeRekening: string;
  tglPerencanaan: string | null;
  tglPesan: string | null;
  tglBast: string | null;
  tglPeriksa: string | null;
  tglBayar: string | null;
  uraian: string;
  namaBarang: string;
  volume: number;
  satuan: string;
  tarifHarga: number;
  jumlah: number;
  kategoriBelanja: string;
  spesifikasiBarang: string;
  hargaToko1: number | null;
  hargaToko2: number | null;
  namaToko1: string;
  namaToko2: string;
  direkturToko1: string;
  alamatToko1: string;
  alamatToko2: string;
  uraianKwitansi: string;
  namaPekerjaanKategori: string;
  satuan2: string;
  hargaSatuanSebelumPajak: number | null;
  jumlahHargaSebelumPajak: number | null;
  hargaTotalAsli: number | null;
  totalHargaSebelumDPP: number | null;
  totalHargaAsli: number | null;
  alamatSuratBalasan: string;
  noHp: string;
  bulan: number | null;
  vendorName: string;
  vendorOwner: string;
  vendorPhone: string;
  vendorAddress: string;
  excelRowNum: number;
}

// Treat these as "empty" (data belum diisi / formula error)
const ERROR_TOKENS = new Set([
  "",
  "0",
  "#N/A",
  "#N/a",
  "#n/a",
  "#REF!",
  "#VALUE!",
  "#DIV/0!",
  "#NAME?",
  "#NULL!",
  "#NUM!",
  "FALSE",
  "false",
]);

function parseStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") {
    // Numeric "0" in text columns means "belum diisi"
    if (val === 0) return "";
    return String(val).trim();
  }
  const str = String(val).trim();
  if (ERROR_TOKENS.has(str)) return "";
  return str;
}

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (ERROR_TOKENS.has(s)) return 0;
  // Remove currency formatting like "Rp 1.234.567" or "1,234,567.89"
  const cleaned = s.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseNumNullable(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val === 0 ? null : val;
  const s = String(val).trim();
  if (ERROR_TOKENS.has(s)) return null;
  const cleaned = s.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDate(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;

  // JS Date object (xlsx library returns this when cellDates: true)
  if (val instanceof Date) {
    // Excel "0" serial = 1899-12-30 (the epoch for empty date cells)
    const y = val.getFullYear();
    if (y <= 1901) return null;
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Numeric Excel serial date
  if (typeof val === "number") {
    if (val <= 60) return null; // 0 or very small = empty
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.y > 1901) {
        const m = String(parsed.m).padStart(2, "0");
        const d = String(parsed.d).padStart(2, "0");
        return `${parsed.y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
    return null;
  }

  const str = String(val).trim();
  if (ERROR_TOKENS.has(str)) return null;

  // Format dd/MM/yyyy (Indonesia)
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const year = parseInt(y, 10);
      if (year < 2000) return null;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // Format dd-MM-yyyy or dd.MM.yyyy
  if (str.includes("-") || str.includes(".")) {
    const sep = str.includes("-") ? "-" : ".";
    const parts = str.split(sep);
    if (parts.length === 3) {
      let [a, b, c] = parts;
      // Detect ISO yyyy-mm-dd
      if (a.length === 4) {
        const year = parseInt(a, 10);
        if (year < 2000) return null;
        return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
      }
      // dd-mm-yyyy
      const year = parseInt(c, 10);
      if (year < 2000) return null;
      return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    }
  }

  return str.substring(0, 50);
}

function isRowEmpty(cells: unknown[]): boolean {
  return !cells.some((c) => {
    if (c === null || c === undefined) return false;
    if (typeof c === "number") return c !== 0;
    if (c instanceof Date) {
      // Excel "0" serial = 1899-12-30 00:00:00 — treat as empty
      return c.getFullYear() > 1901;
    }
    const s = String(c).trim();
    return !ERROR_TOKENS.has(s);
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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

    // Pick the first sheet or one named "Master"
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
        {
          error:
            "Excel file has insufficient rows (need at least: title, header, numbers, data)",
        },
        { status: 400 }
      );
    }

    // Row 1 (index 0): Title (skip)
    // Row 2 (index 1): Headers
    // Row 3 (index 2): Column numbers - skip
    // Row 4+ (index 3+): Data
    const headers = (rows[1] as unknown[]).map((h) =>
      h ? String(h).trim() : ""
    );

    // Map column indices by header text (case-insensitive contains)
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const lower = h.toLowerCase();
      // Order matters: more specific matches first
      if (lower.includes("no. surat pesan") || lower === "no surat pesan")
        colMap.noPesan = i;
      else if (lower.includes("no bku") || lower.includes("no. bku"))
        colMap.noBku = i;
      else if (lower.includes("kode program")) colMap.kodeProgram = i;
      else if (lower.includes("kode rekening")) colMap.kodeRekening = i;
      else if (lower.includes("tanggal perencanaan")) colMap.tglPerencanaan = i;
      else if (lower.includes("tanggal pesanan")) colMap.tglPesan = i;
      else if (lower.includes("tanggal bast")) colMap.tglBast = i;
      else if (lower.includes("tanggal pemeriksaan")) colMap.tglPeriksa = i;
      else if (lower.includes("tanggal bayar")) colMap.tglBayar = i;
      else if (lower.includes("uraian kegiatan")) colMap.uraian = i;
      else if (lower.includes("nama barang")) colMap.namaBarang = i;
      else if (lower === "volume") colMap.volume = i;
      else if (lower === "satuan") {
        // First "Satuan" → col M (Col 13), second → col AA (Col 27)
        if (colMap.satuan === undefined) colMap.satuan = i;
        else colMap.satuan2 = i;
      } else if (lower.includes("harga satuan sebelum"))
        colMap.hargaSatuanSebelumPajak = i;
      else if (lower.includes("harga satuan")) colMap.hargaSatuan = i;
      else if (lower === "jumlah") {
        if (colMap.jumlah === undefined) colMap.jumlah = i;
      } else if (lower.includes("jumlah harga sebelum"))
        colMap.jumlahHargaSebelumPajak = i;
      else if (lower.includes("kategori belanja")) colMap.kategoriBelanja = i;
      else if (lower.includes("spesifikasi")) colMap.spesifikasiBarang = i;
      else if (lower.includes("harga toko 1")) colMap.hargaToko1 = i;
      else if (lower.includes("harga toko 2")) colMap.hargaToko2 = i;
      else if (lower.includes("nama toko 1")) colMap.namaToko1 = i;
      else if (lower.includes("nama toko 2")) colMap.namaToko2 = i;
      else if (lower.includes("direktur toko 1")) colMap.direkturToko1 = i;
      else if (lower.includes("alamat toko 1")) colMap.alamatToko1 = i;
      else if (lower.includes("alamat toko 2")) colMap.alamatToko2 = i;
      else if (lower.includes("uraian kwitansi")) colMap.uraianKwitansi = i;
      else if (lower.includes("nama pekerjaan")) colMap.namaPekerjaanKategori = i;
      else if (lower.includes("harga total asli")) colMap.hargaTotalAsli = i;
      else if (lower.includes("total harga sebelum dpp"))
        colMap.totalHargaSebelumDPP = i;
      else if (lower.includes("total harga asli")) colMap.totalHargaAsli = i;
      else if (lower.includes("alamat surat balasan"))
        colMap.alamatSuratBalasan = i;
      else if (lower.includes("no hp") || lower.includes("no. hp"))
        colMap.noHp = i;
    });

    const get = (cells: unknown[], key: string): unknown => {
      const idx = colMap[key];
      if (idx === undefined || idx === null) return null;
      return cells[idx] ?? null;
    };

    // Parse all data rows starting at Excel row 4 (index 3)
    const parsed: ParsedTx[] = [];
    for (let rowIdx = 3; rowIdx < rows.length; rowIdx++) {
      const cells = (rows[rowIdx] as unknown[]) ?? [];

      if (isRowEmpty(cells)) continue;

      const excelRowNum = rowIdx + 1; // 1-based Excel row number (data starts at row 4)

      const noPesan = parseStr(get(cells, "noPesan"));
      const noBku = parseStr(get(cells, "noBku"));
      const uraian = parseStr(get(cells, "uraian"));
      const namaBarang = parseStr(get(cells, "namaBarang"));
      const vendorName = parseStr(get(cells, "namaToko1"));
      const vendorOwner = parseStr(get(cells, "direkturToko1"));
      const vendorPhone = parseStr(get(cells, "noHp"));
      const vendorAddress = parseStr(get(cells, "alamatToko1"));

      const tglPesan = parseDate(get(cells, "tglPesan"));
      const tglBast = parseDate(get(cells, "tglBast"));
      const tglBayar = parseDate(get(cells, "tglBayar"));
      const tglPerencanaan = parseDate(get(cells, "tglPerencanaan"));
      const tglPeriksa = parseDate(get(cells, "tglPeriksa"));

      // Determine bulan from tglPesan (fallback: tglBayar, tglBast)
      let bulan: number | null = null;
      const bulanSrc = tglPesan || tglBayar || tglBast || tglPerencanaan;
      if (bulanSrc) {
        const m = parseInt(bulanSrc.split("-")[1] || "0", 10);
        if (m >= 1 && m <= 12) bulan = m;
      }

      const volume = parseNum(get(cells, "volume"));
      const tarifHarga = parseNum(get(cells, "hargaSatuan"));
      const jumlah = parseNum(get(cells, "jumlah"));

      parsed.push({
        noUrut: parseStr(get(cells, "noPesan"))
          ? parseInt(parseStr(get(cells, "noPesan")), 10) || null
          : null,
        noPesan,
        noBku,
        bpuCode: noBku,
        kodeProgram: parseStr(get(cells, "kodeProgram")),
        kodeRekening: parseStr(get(cells, "kodeRekening")),
        tglPerencanaan,
        tglPesan,
        tglBast,
        tglPeriksa,
        tglBayar,
        uraian: uraian || namaBarang || vendorName || "(tidak ada uraian)",
        namaBarang,
        volume,
        satuan: parseStr(get(cells, "satuan")),
        tarifHarga,
        jumlah,
        kategoriBelanja: parseStr(get(cells, "kategoriBelanja")),
        spesifikasiBarang: parseStr(get(cells, "spesifikasiBarang")),
        hargaToko1: parseNumNullable(get(cells, "hargaToko1")),
        hargaToko2: parseNumNullable(get(cells, "hargaToko2")),
        namaToko1: vendorName,
        namaToko2: parseStr(get(cells, "namaToko2")),
        direkturToko1: vendorOwner,
        alamatToko1: vendorAddress,
        alamatToko2: parseStr(get(cells, "alamatToko2")),
        uraianKwitansi: parseStr(get(cells, "uraianKwitansi")),
        namaPekerjaanKategori: parseStr(get(cells, "namaPekerjaanKategori")),
        satuan2: parseStr(get(cells, "satuan2")),
        hargaSatuanSebelumPajak: parseNumNullable(
          get(cells, "hargaSatuanSebelumPajak")
        ),
        jumlahHargaSebelumPajak: parseNumNullable(
          get(cells, "jumlahHargaSebelumPajak")
        ),
        hargaTotalAsli: parseNumNullable(get(cells, "hargaTotalAsli")),
        totalHargaSebelumDPP: parseNumNullable(
          get(cells, "totalHargaSebelumDPP")
        ),
        totalHargaAsli: parseNumNullable(get(cells, "totalHargaAsli")),
        alamatSuratBalasan: parseStr(get(cells, "alamatSuratBalasan")),
        noHp: vendorPhone,
        bulan,
        vendorName,
        vendorOwner,
        vendorPhone,
        vendorAddress,
        excelRowNum,
      });
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in Excel file" },
        { status: 400 }
      );
    }

    // Resolve active BOSP year (link imported transactions to it)
    const activeBosp = await db.tahunBOSP.findFirst({
      where: { isActive: true },
    });
    const tahunBospId = activeBosp?.id || null;
    const tahun = activeBosp?.tahun
      ? parseInt(activeBosp.tahun.replace(/\D/g, ""), 10) || 2025
      : 2025;

    // ====== Phase 1: Create/update vendors ======
    const vendorMap = new Map<
      string,
      { name: string; owner: string | null; phone: string | null; address: string | null }
    >();
    for (const tx of parsed) {
      if (tx.vendorName && !vendorMap.has(tx.vendorName)) {
        vendorMap.set(tx.vendorName, {
          name: tx.vendorName,
          owner: tx.vendorOwner || null,
          phone: tx.vendorPhone || null,
          address: tx.vendorAddress || null,
        });
      }
    }

    let vendorsCreated = 0;
    let vendorsUpdated = 0;
    const vendorIdMap = new Map<string, string>();
    for (const [name, vdata] of vendorMap) {
      const existing = await db.vendor.findFirst({ where: { name } });
      if (existing) {
        // Update vendor info if any new fields are non-empty
        const needsUpdate =
          (vdata.owner && vdata.owner !== existing.owner) ||
          (vdata.phone && vdata.phone !== existing.phone) ||
          (vdata.address && vdata.address !== existing.address);
        if (needsUpdate) {
          await db.vendor.update({
            where: { id: existing.id },
            data: {
              owner: vdata.owner || existing.owner,
              phone: vdata.phone || existing.phone,
              address: vdata.address || existing.address,
            },
          });
          vendorsUpdated++;
        }
        vendorIdMap.set(name, existing.id);
      } else {
        const created = await db.vendor.create({
          data: {
            name: vdata.name,
            owner: vdata.owner,
            phone: vdata.phone,
            address: vdata.address,
          },
        });
        vendorIdMap.set(name, created.id);
        vendorsCreated++;
      }
    }

    // ====== Phase 2: Create BPU codes ======
    let bpuCreated = 0;
    const bpuSet = new Set<string>();
    for (const tx of parsed) {
      if (tx.noBku) bpuSet.add(tx.noBku);
    }
    for (const code of bpuSet) {
      const existing = await db.bpu.findFirst({ where: { code } });
      if (!existing) {
        await db.bpu.create({ data: { code } });
        bpuCreated++;
      }
    }

    // ====== Phase 3: DEDUP LOOKUP ======
    // For each parsed row, find matching existing transaction by:
    //   1. excelRowNum (primary - most stable)
    //   2. composite key `${noPesan}|${noBku}|${namaBarang}` (secondary)
    // We do this with a single DB query per strategy for efficiency.

    const rowByNum = new Map<number, ParsedTx>();
    const rowByComp = new Map<string, ParsedTx>();
    for (const tx of parsed) {
      rowByNum.set(tx.excelRowNum, tx);
      // Only use composite key when ALL three fields are present
      if (tx.noPesan && tx.noBku && tx.namaBarang) {
        rowByComp.set(
          `${tx.noPesan}|${tx.noBku}|${tx.namaBarang}`,
          tx
        );
      }
    }

    // Query existing transactions matching by excelRowNum
    const existingByRowNum = await db.transaction.findMany({
      where: { excelRowNum: { in: Array.from(rowByNum.keys()) } },
      select: { id: true, excelRowNum: true },
    });
    // Query existing transactions matching by composite key
    // Since we can't easily query composite, fetch a wider pool and filter in JS
    const allNoPesan = Array.from(
      new Set(parsed.map((t) => t.noPesan).filter(Boolean))
    );
    const allNoBku = Array.from(
      new Set(parsed.map((t) => t.noBku).filter(Boolean))
    );
    const allNamaBarang = Array.from(
      new Set(parsed.map((t) => t.namaBarang).filter(Boolean))
    );

    let existingByComp: { id: string; noPesan: string | null; noBku: string | null; namaBarang: string | null }[] = [];
    if (allNoPesan.length > 0 && allNoBku.length > 0 && allNamaBarang.length > 0) {
      existingByComp = await db.transaction.findMany({
        where: {
          AND: [
            { noPesan: { in: allNoPesan } },
            { noBku: { in: allNoBku } },
            { namaBarang: { in: allNamaBarang } },
          ],
        },
        select: { id: true, noPesan: true, noBku: true, namaBarang: true },
      });
    }

    // Build dedup lookup map: dedupKey -> existingId
    const dedupMap = new Map<string, string>();
    // excelRowNum strategy (HIGHER PRIORITY)
    for (const ex of existingByRowNum) {
      if (ex.excelRowNum) {
        dedupMap.set(`row:${ex.excelRowNum}`, ex.id);
      }
    }
    // Composite strategy (LOWER PRIORITY — only set if not already matched by row)
    for (const ex of existingByComp) {
      if (ex.noPesan && ex.noBku && ex.namaBarang) {
        const key = `${ex.noPesan}|${ex.noBku}|${ex.namaBarang}`;
        if (!dedupMap.has(key)) {
          dedupMap.set(key, ex.id);
        }
      }
    }

    // ====== Phase 4: UPSERT transactions ======
    let txCreated = 0;
    let txUpdated = 0;
    let txUnchanged = 0;

    for (const tx of parsed) {
      const vendorId = tx.vendorName
        ? vendorIdMap.get(tx.vendorName) || null
        : null;

      // Determine status
      const isComplete = tx.uraian && tx.namaBarang;
      const hasAmount = tx.jumlah > 0;
      let status = "pending";
      if (!isComplete || !hasAmount) status = "draft";
      else if (tx.tglBayar) status = "lunas";

      const txData = {
        noUrut: tx.noUrut,
        noPesan: tx.noPesan || null,
        noBku: tx.noBku || null,
        kodeProgram: tx.kodeProgram || null,
        kodeRekening: tx.kodeRekening || null,
        tglPerencanaan: tx.tglPerencanaan,
        tglPesan: tx.tglPesan,
        tglBast: tx.tglBast,
        noBast: null,
        tglPeriksa: tx.tglPeriksa,
        tglBayar: tx.tglBayar,
        uraian: tx.uraian || "",
        namaBarang: tx.namaBarang || null,
        volume: tx.volume,
        satuan: tx.satuan || null,
        tarifHarga: tx.tarifHarga,
        jumlah: tx.jumlah,
        kategoriBelanja: tx.kategoriBelanja || null,
        spesifikasiBarang: tx.spesifikasiBarang || null,
        hargaToko1: tx.hargaToko1,
        hargaToko2: tx.hargaToko2,
        namaToko1: tx.namaToko1 || null,
        namaToko2: tx.namaToko2 || null,
        direkturToko1: tx.direkturToko1 || null,
        alamatToko1: tx.alamatToko1 || null,
        alamatToko2: tx.alamatToko2 || null,
        uraianKwitansi: tx.uraianKwitansi || null,
        namaPekerjaanKategori: tx.namaPekerjaanKategori || null,
        satuan2: tx.satuan2 || null,
        hargaSatuanSebelumPajak: tx.hargaSatuanSebelumPajak,
        jumlahHargaSebelumPajak: tx.jumlahHargaSebelumPajak,
        hargaTotalAsli: tx.hargaTotalAsli,
        totalHargaSebelumDPP: tx.totalHargaSebelumDPP,
        totalHargaAsli: tx.totalHargaAsli,
        alamatSuratBalasan: tx.alamatSuratBalasan || null,
        noHp: tx.noHp || null,
        realisasi: tx.jumlah,
        bulan: tx.bulan,
        tahun,
        masukBku: tx.tglBayar ? "MASUK BKU" : null,
        status,
        bpuCode: tx.bpuCode || null,
        vendorId,
        tahunBospId,
        excelRowNum: tx.excelRowNum,
      };

      // Primary dedup: excelRowNum
      const rowKey = `row:${tx.excelRowNum}`;
      // Secondary dedup: composite key (only when all 3 present)
      const compKey =
        tx.noPesan && tx.noBku && tx.namaBarang
          ? `${tx.noPesan}|${tx.noBku}|${tx.namaBarang}`
          : null;

      const existingId =
        dedupMap.get(rowKey) || (compKey ? dedupMap.get(compKey) : null);

      if (existingId) {
        await db.transaction.update({
          where: { id: existingId },
          data: txData,
        });
        txUpdated++;
        // Update dedup map so subsequent rows with same key hit the same record
        if (compKey && !dedupMap.has(compKey)) dedupMap.set(compKey, existingId);
      } else {
        const created = await db.transaction.create({ data: txData });
        // Register dedup keys for this new record
        dedupMap.set(rowKey, created.id);
        if (compKey) dedupMap.set(compKey, created.id);
        txCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: parsed.length,
        transactionsImported: txCreated,
        transactionsUpdated: txUpdated,
        transactionsUnchanged: txUnchanged,
        vendorsCreated,
        vendorsUpdated,
        bpuCreated,
        sheetName,
        bospYear: activeBosp?.tahun || null,
        dedupStrategy: "excelRowNum (primary) + composite noPesan|noBku|namaBarang (secondary)",
      },
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json(
      { error: "Failed to import: " + (e as Error).message },
      { status: 500 }
    );
  }
}
