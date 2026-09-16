"use client";

import { useLetterhead } from "@/hooks/use-spj";
import type { LetterheadSettings } from "@/lib/types/spj";

// ============ Letterhead Component (reusable KOP for all documents) ============
// Renders the KOP based on saved settings. Used inside document print area.

const FALLBACK: LetterheadSettings = {
  id: "fallback",
  logoPath: "/uploads/logo-sman1.png",
  logoWidth: 110,
  logoHeight: 110,
  logoOffsetX: 0,
  logoOffsetY: 0,
  fontFamily: "Arial",
  lineSpacing: 6,
  line1Text: "PEMERINTAH PROVINSI SUMATERA UTARA",
  line1Bold: true,
  line1Size: 14,
  line2Text: "DINAS PENDIDIKAN",
  line2Bold: true,
  line2Size: 14,
  line3Text: "SMA NEGERI 1 TELUKDALAM",
  line3Bold: true,
  line3Size: 20,
  line4Text: "Jl. Pendidikan No.13, Kel. Pasar Teluk Dalam, Kec. Teluk Dalam, Kab. Nias Selatan,",
  line4Bold: false,
  line4Size: 11,
  line5Text: "Cabdisdik Wil XIV, Kode Pos 22865",
  line5Bold: false,
  line5Size: 11,
  line6Text: "Telp/HP: 081370904506, Pos-el smansatelukdalam1987@gmail.com",
  line6Bold: false,
  line6Size: 11,
  line7Text: "Laman : smansatelukdalam.sch.id",
  line7Bold: false,
  line7Size: 11,
  showBottomLine: true,
  bottomLineWidth: 2,
};

// Server-renderable version with explicit settings (no hook)
export function LetterheadStatic({ settings }: { settings: LetterheadSettings }) {
  const s = settings;
  const lines = [
    { text: s.line1Text, bold: s.line1Bold, size: s.line1Size },
    { text: s.line2Text, bold: s.line2Bold, size: s.line2Size },
    { text: s.line3Text, bold: s.line3Bold, size: s.line3Size },
    { text: s.line4Text, bold: s.line4Bold, size: s.line4Size },
    { text: s.line5Text, bold: s.line5Bold, size: s.line5Size },
    { text: s.line6Text, bold: s.line6Bold, size: s.line6Size },
    { text: s.line7Text, bold: s.line7Bold, size: s.line7Size },
  ].filter((l) => l.text.trim());

  return (
    <div className="kop-surat" style={{ fontFamily: s.fontFamily }}>
      <div className="flex items-start gap-3" style={{ position: "relative" }}>
        {/* Logo */}
        {s.logoPath && (
          <div
            style={{
              position: "relative",
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

        {/* Text lines */}
        <div
          className="flex-1 text-center flex flex-col items-center justify-center"
          style={{ paddingTop: "4px" }}
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

      {/* Bottom border line */}
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

// Client component that fetches settings via React Query
export function Letterhead() {
  const { data, isLoading } = useLetterhead();
  const settings = data?.settings ?? FALLBACK;

  if (isLoading) {
    return (
      <div className="kop-surat" style={{ minHeight: "120px", opacity: 0.6 }}>
        <div className="flex items-start gap-3">
          <div
            style={{
              width: `${settings.logoWidth}px`,
              height: `${settings.logoHeight}px`,
              background: "#e2e8f0",
              borderRadius: "4px",
            }}
          />
          <div className="flex-1 text-center">
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
