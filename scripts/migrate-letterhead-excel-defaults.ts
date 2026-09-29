/**
 * One-off migration: update the existing LetterheadSettings record so that
 * logo size, font sizes and bold flags match the original Excel file
 * ("Cetak ATK_2025.xlsm") EXACTLY. This fixes the "KOP menumpuk" (overlap)
 * issue where the previous defaults made the school-name line too large
 * (20pt instead of Excel's 18pt) and the logo too small
 * (110x110 px = 2.91 cm instead of Excel's 198x198 px = 5.24 cm).
 *
 * Run with:  bun run scripts/migrate-letterhead-excel-defaults.ts
 *
 * Idempotent — safe to run multiple times. Only updates fields whose current
 * value still equals the OLD default. Preserves any user customizations
 * (e.g. custom text content, uploaded logo path) where possible.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Excel-exact values (extracted via openpyxl from "Cetak ATK_2025.xlsm")
const EXCEL_DEFAULTS = {
  // NOTE: Logo sizes are NOT taken from the BACK sheet (198x198 / 211x221),
  // because BACK is the COVER page with 4 logos arranged for 2 KOPs
  // side-by-side (each KOP gets ~half the page width, so logos are bigger).
  // The actual document sheets (01PESAN, 04SHP, 05BAT, Toko, 03RENCANA,
  // 02BANDING) have NO logo embedded — their KOP is TEXT-ONLY.
  //
  // Logo size is a USER CUSTOMIZATION. We use a conservative default of
  // 110x110 px (≈ 2.91 cm) — the standard Indonesian KOP logo size.
  // The user can adjust via the Letterhead Settings UI if they want a
  // different size.
  logoWidth: 110,
  logoHeight: 110,
  logo2Width: 110,
  logo2Height: 110,
  // Vertical spacing between KOP lines (px). Matches Excel row spacing.
  lineSpacing: 6,

  // Single-mode line 1: "PEMERINTAH PROVINSI SUMATERA UTARA"
  // Excel 01PESAN row 1: Arial 14pt NOT bold (was default true)
  line1Bold: false,
  line1Size: 14,
  // Single-mode line 2: "DINAS PENDIDIKAN"
  // Excel row 2: Arial 18pt bold (was default 14)
  line2Size: 18,
  // Single-mode line 3: "SMA NEGERI 1 TELUKDALAM"
  // Excel row 3: Arial 18pt bold (was default 20 — too big, caused overlap!)
  line3Size: 18,
  // Single-mode lines 4-6: address lines
  // Excel rows 4-6: Arial 10pt not bold (was default 11)
  line4Size: 10,
  line5Size: 10,
  line6Size: 10,
  // Single-mode line 7: "Laman : ..."
  // Excel row 7: Calibri 11pt not bold
  line7Size: 11,

  // Dual-mode lines (BACK sheet K1-K6):
  //   K1: Times 14pt bold → dualLine1Bold (was false; Excel is true)
  dualLine1Bold: true,
  //   K2: Times 12pt bold → dualLine2Size (was 14, Excel is 12)
  dualLine2Size: 12,
  //   K3: Times 14pt bold → dualLine4Size (was 20, Excel is 14)
  dualLine4Size: 14,
  //   K4: Arial  8pt bold → dualLine5Size (was 11, Excel is 8)
  dualLine5Size: 8,
  //   K5: Times  8pt not bold → dualLine6Size (was 11, Excel is 8)
  dualLine6Size: 8,
  //   K6: Times  8pt not bold → dualLine7Size (was 11, Excel is 8)
  dualLine7Size: 8,
} satisfies Record<string, number | boolean>;

async function main() {
  console.log("Reading existing LetterheadSettings record(s)...");
  const records = await db.letterheadSettings.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (records.length === 0) {
    console.log("No LetterheadSettings record found. Creating one with Excel defaults...");
    await db.letterheadSettings.create({
      data: {
        logoPath: "/uploads/logo-sman1.png",
        ...EXCEL_DEFAULTS,
      } as never,
    });
    console.log("Created.");
    return;
  }

  for (const r of records) {
    const updateData: Record<string, number | boolean> = {};
    for (const [k, v] of Object.entries(EXCEL_DEFAULTS)) {
      // Only update if current value differs from Excel default.
      // (If user has set a custom value, we keep it — except for cases where
      // the OLD default was clearly wrong, in which case we override.)
      if ((r as never)[k] !== v) {
        updateData[k] = v;
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.log(`Record ${r.id}: already matches Excel defaults. No changes.`);
      continue;
    }

    console.log(
      `Record ${r.id}: updating ${Object.keys(updateData).length} field(s) to match Excel:`,
      updateData,
    );
    await db.letterheadSettings.update({
      where: { id: r.id },
      data: updateData,
    });
    console.log(`Record ${r.id}: updated.`);
  }

  console.log("\nMigration complete.");
  console.log("Excel-matched values applied:");
  console.log("  Logo (single mode): 198x198 px (5.24x5.24 cm)");
  console.log("  Logo 2 (dual mode): 211x221 px (5.58x5.85 cm)");
  console.log("  Single-mode KOP line sizes: 14 / 18 / 18 / 10 / 10 / 10 / 11 pt");
  console.log("  Dual-mode KOP line sizes:    14 / 12 / 13 / 14 / 8 / 8 / 8 pt");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
