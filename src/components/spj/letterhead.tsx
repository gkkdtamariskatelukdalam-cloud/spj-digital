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
  line1Text: "PEMERINTAH PROVINSI SUMATERA UTARA",
  line1Bold: true,
  line1Size: 14,
  line2Text: "DINAS PENDIDIKAN",
  line2Bold: true,
  line2Size: 14,
  line3Text: "CABDIS PENDIDIKAN WILAYAH XIV",
  line3Bold: true,
  line3Size: 13,
  line4Text: "SMA NEGERI 1 TELUKDALAM",
  line4Bold: true,
  line4Size: 20,
  line5Text: "NIS : 300010         NPSN : 10258246        Terakreditasi A           NSS: 301071701001",
  line5Bold: false,
  line5Size: 11,
  line6Text: "Jl. Pendidikan No. 13 Kelurahan Pasar Telukdalam Kecamatan Telukdalam Kabupaten Nias Selatan; Telp/HP: 081370904506; Kode Pos: 22865",
  line6Bold: false,
  line6Size: 11,
  line7Text: "Email: smansatelukdalam1987@gmail.com ; website: www.smansatelukdalam.sch.id",
  line7Bold: false,
  line7Size: 11,
  showBottomLine: true,
  bottomLineWidth: 2,
};

// ============ LetterheadStatic (server-renderable with explicit settings) ============
export function LetterheadStatic({ settings }: { settings: LetterheadSettings }) {
  const s = settings;
  const isDual = s.kopMode === "dual";
  
  const lines = [
    { text: s.line1Text, bold: s.line1Bold, size: s.line1Size },
    { text: s.line2Text, bold: s.line2Bold, size: s.line2Size },
    { text: s.line3Text, bold: s.line3Bold, size: s.line3Size },
    { text: s.line4Text, bold: s.line4Bold, size: s.line4Size },
    { text: s.line5Text, bold: s.line5Bold, size: s.line5Size },
    { text: s.line6Text, bold: s.line6Bold, size: s.line6Size },
    { text: s.line7Text, bold: s.line7Bold, size: s.line7Size },
  ].filter((l) => l.text.trim());

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
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: `${line.size}px`,
                  fontWeight: line.bold ? 700 : 400,
                  lineHeight: 1.3,
                  marginTop: i > 0 ? `${s.lineSpacing}px` : "0",
                  textTransform: line.size >= 14 ? "uppercase" : "none",
                }}
              >
                {line.text}
              </div>
            ))}
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
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: `${line.size}px`,
                fontWeight: line.bold ? 700 : 400,
                lineHeight: 1.3,
                marginTop: i > 0 ? `${s.lineSpacing}px` : "0",
                textTransform: line.size >= 14 ? "uppercase" : "none",
              }}
            >
              {line.text}
            </div>
          ))}
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
