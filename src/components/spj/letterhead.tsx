"use client";

import { useLetterhead } from "@/hooks/use-spj";
import type { LetterheadSettings } from "@/lib/types/spj";

// ============ Fallback defaults ============
const FALLBACK: LetterheadSettings = {
  id: "fallback",
  logoPath: "/uploads/logo-sman1.png",
  logoWidth: 110,
  logoHeight: 110,
  logoOffsetX: 0,
  logoOffsetY: 0,
  logo2Path: null,
  logo2Width: 110,
  logo2Height: 110,
  logo2OffsetX: 0,
  logo2OffsetY: 0,
  kopMode: "single",
  fontFamily: "Arial",
  lineSpacing: 6,
  // Single mode (KOP 1 Logo)
  line1Text: "PEMERINTAH PROVINSI SUMATERA UTARA",
  line1Bold: true, line1Size: 14,
  line2Text: "DINAS PENDIDIKAN",
  line2Bold: true, line2Size: 14,
  line3Text: "SMA NEGERI 1 TELUKDALAM",
  line3Bold: true, line3Size: 20,
  line4Text: "Jl. Pendidikan No.13, Kel. Pasar Teluk Dalam, Kec. Teluk Dalam, Kab. Nias Selatan,",
  line4Bold: false, line4Size: 11,
  line5Text: "Cabdisdik Wil.XIV, Kode Pos 22865",
  line5Bold: false, line5Size: 11,
  line6Text: "Telp/HP: 081370904506, Pos-el smansatelukdalam1987@gmail.com",
  line6Bold: false, line6Size: 11,
  line7Text: "Laman : smansatelukdalam.sch.id",
  line7Bold: false, line7Size: 11,
  // Dual mode (KOP 2 Logo)
  dualLine1Text: "PEMERINTAH PROVINSI SUMATERA UTARA",
  dualLine1Bold: true, dualLine1Size: 14,
  dualLine2Text: "DINAS PENDIDIKAN",
  dualLine2Bold: true, dualLine2Size: 14,
  dualLine3Text: "CABDIS PENDIDIKAN WILAYAH XIV",
  dualLine3Bold: true, dualLine3Size: 13,
  dualLine4Text: "SMA NEGERI 1 TELUKDALAM",
  dualLine4Bold: true, dualLine4Size: 20,
  dualLine5Text: "NIS : 300010         NPSN : 10258246        Terakreditasi A           NSS: 301071701001",
  dualLine5Bold: false, dualLine5Size: 11,
  dualLine6Text: "Jl. Pendidikan No. 13 Kelurahan Pasar Telukdalam Kecamatan Telukdalam Kabupaten Nias Selatan; Telp/HP: 081370904506; Kode Pos: 22865",
  dualLine6Bold: false, dualLine6Size: 11,
  dualLine7Text: "Email: smansatelukdalam1987@gmail.com ; website: www.smansatelukdalam.sch.id",
  dualLine7Bold: false, dualLine7Size: 11,
  showBottomLine: true,
  bottomLineWidth: 2,
};

// ============ LetterheadStatic (server-renderable with explicit settings) ============
export function LetterheadStatic({ settings }: { settings: LetterheadSettings }) {
  const s = settings;
  const isDual = s.kopMode === "dual";
  
  // Select lines based on kopMode: "single" uses line1-7, "dual" uses dualLine1-7
  const lines = isDual
    ? [
        { text: s.dualLine1Text, bold: s.dualLine1Bold, size: s.dualLine1Size },
        { text: s.dualLine2Text, bold: s.dualLine2Bold, size: s.dualLine2Size },
        { text: s.dualLine3Text, bold: s.dualLine3Bold, size: s.dualLine3Size },
        { text: s.dualLine4Text, bold: s.dualLine4Bold, size: s.dualLine4Size },
        { text: s.dualLine5Text, bold: s.dualLine5Bold, size: s.dualLine5Size },
        { text: s.dualLine6Text, bold: s.dualLine6Bold, size: s.dualLine6Size },
        { text: s.dualLine7Text, bold: s.dualLine7Bold, size: s.dualLine7Size },
      ].filter((l) => l.text.trim())
    : [
        { text: s.line1Text, bold: s.line1Bold, size: s.line1Size },
        { text: s.line2Text, bold: s.line2Bold, size: s.line2Size },
        { text: s.line3Text, bold: s.line3Bold, size: s.line3Size },
        { text: s.line4Text, bold: s.line4Bold, size: s.line4Size },
        { text: s.line5Text, bold: s.line5Bold, size: s.line5Size },
        { text: s.line6Text, bold: s.line6Bold, size: s.line6Size },
        { text: s.line7Text, bold: s.line7Bold, size: s.line7Size },
      ].filter((l) => l.text.trim());

  // Helper: detect if a line is the NIS/NPSN/Terakreditasi/NSS row
  // and split it into evenly distributed segments
  function renderLine(line: { text: string; bold: boolean; size: number }, index: number) {
    const isIdentityRow = line.text.includes("NIS") && line.text.includes("NPSN");
    const isLongLine = line.text.length > 60; // alamat, email lines - ensure no wrap
    
    if (isIdentityRow) {
      // Split by multiple spaces (2+) and render as flex space-around
      const segments = line.text.split(/\s{2,}/).filter((seg) => seg.trim());
      return (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            fontSize: `${line.size}px`,
            fontWeight: line.bold ? 700 : 400,
            lineHeight: 1.3,
            marginTop: index > 0 ? `${s.lineSpacing}px` : "0",
          }}
        >
          {segments.map((seg, si) => (
            <span key={si}>{seg.trim()}</span>
          ))}
        </div>
      );
    }

    // Normal line render - ensure long lines (alamat, email) stay on 1 line
    return (
      <div
        key={index}
        style={{
          fontSize: `${line.size}px`,
          fontWeight: line.bold ? 700 : 400,
          lineHeight: 1.3,
          marginTop: index > 0 ? `${s.lineSpacing}px` : "0",
          textTransform: line.size >= 14 ? "uppercase" : "none",
          whiteSpace: isLongLine ? "nowrap" : "normal",
        }}
      >
        {line.text}
      </div>
    );
  }

  if (isDual) {
    // === DUAL LOGO MODE: logo kiri + teks tengah + logo kanan ===
    return (
      <div className="kop-surat" style={{ fontFamily: s.fontFamily }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Logo kiri */}
          {s.logoPath && (
            <div
              style={{
                transform: `translate(${s.logoOffsetX}px, ${s.logoOffsetY}px)`,
                flexShrink: 0,
              }}
            >
              <img
                src={s.logoPath}
                alt="Logo Kiri"
                style={{
                  width: `${s.logoWidth}px`,
                  height: s.logoHeight > 0 ? `${s.logoHeight}px` : "auto",
                  objectFit: "contain",
                }}
              />
            </div>
          )}

          {/* Teks tengah */}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {lines.map((line, i) => renderLine(line, i))}
          </div>

          {/* Logo kanan */}
          {s.logo2Path && (
            <div
              style={{
                transform: `translate(${s.logo2OffsetX}px, ${s.logo2OffsetY}px)`,
                flexShrink: 0,
              }}
            >
              <img
                src={s.logo2Path}
                alt="Logo Kanan"
                style={{
                  width: `${s.logo2Width}px`,
                  height: s.logo2Height > 0 ? `${s.logo2Height}px` : "auto",
                  objectFit: "contain",
                }}
              />
            </div>
          )}
        </div>

        {/* Garis bawah */}
        {s.showBottomLine && (
          <div
            style={{
              borderTop: `${s.bottomLineWidth}px solid #000`,
              marginTop: "8px",
            }}
          />
        )}
      </div>
    );
  }

  // === SINGLE LOGO MODE: logo kiri + teks kanan (centered dalam bloknya) ===
  return (
    <div className="kop-surat" style={{ fontFamily: s.fontFamily }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Logo kiri */}
        {s.logoPath && (
          <div
            style={{
              transform: `translate(${s.logoOffsetX}px, ${s.logoOffsetY}px)`,
              flexShrink: 0,
            }}
          >
            <img
              src={s.logoPath}
              alt="Logo"
              style={{
                width: `${s.logoWidth}px`,
                height: s.logoHeight > 0 ? `${s.logoHeight}px` : "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Teks */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "4px",
          }}
        >
          {lines.map((line, i) => renderLine(line, i))}
        </div>
      </div>

      {/* Garis bawah */}
      {s.showBottomLine && (
        <div
          style={{
            borderTop: `${s.bottomLineWidth}px solid #000`,
            marginTop: "8px",
          }}
        />
      )}
    </div>
  );
}

// ============ Letterhead (client component with React Query) ============
export function Letterhead() {
  const { data, isLoading } = useLetterhead();
  const settings = data?.settings ?? FALLBACK;

  if (isLoading) {
    return (
      <div className="kop-surat" style={{ minHeight: "120px", opacity: 0.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: `${settings.logoWidth}px`,
              height: `${settings.logoHeight}px`,
              background: "#e2e8f0",
              borderRadius: "4px",
            }}
          />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="animate-pulse h-4 bg-slate-200 rounded mb-2 mx-auto" style={{ width: "60%" }} />
            <div className="animate-pulse h-4 bg-slate-200 rounded mb-2 mx-auto" style={{ width: "40%" }} />
            <div className="animate-pulse h-6 bg-slate-200 rounded mb-2 mx-auto" style={{ width: "50%" }} />
          </div>
        </div>
        <div style={{ borderTop: "2px solid #000", marginTop: "8px" }} />
      </div>
    );
  }

  return <LetterheadStatic settings={settings} />;
}
