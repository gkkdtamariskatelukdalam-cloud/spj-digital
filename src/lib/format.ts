// Indonesian currency formatter
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0";
  return new Intl.NumberFormat("id-ID").format(amount);
}

// Indonesian date formatting
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    // Try ISO format
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    }
    // Try dd/mm/yyyy
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
        return new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(d);
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getMonthName(m: number): string {
  const names = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return names[m - 1] || "Unknown";
}

export function getMonthShort(m: number): string {
  const names = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return names[m - 1] || "?";
}

// Convert number to Indonesian words (for SPJ documents)
export function terbilang(num: number): string {
  if (num === 0) return "nol rupiah";
  const ones = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
    "sepuluh", "sebelas",
  ];

  function convert(n: number): string {
    if (n < 12) return ones[n];
    if (n < 20) return convert(n - 10) + " belas";
    if (n < 100) return (
      convert(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + convert(n % 10) : "")
    );
    if (n < 200) return "seratus" + (n - 100 ? " " + convert(n - 100) : "");
    if (n < 1000) return (
      convert(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + convert(n % 100) : "")
    );
    if (n < 2000) return "seribu" + (n - 1000 ? " " + convert(n - 1000) : "");
    if (n < 1000000) return (
      convert(Math.floor(n / 1000)) + " ribu" + (n % 1000 ? " " + convert(n % 1000) : "")
    );
    if (n < 1000000000) return (
      convert(Math.floor(n / 1000000)) + " juta" + (n % 1000000 ? " " + convert(n % 1000000) : "")
    );
    if (n < 1000000000000) return (
      convert(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 ? " " + convert(n % 1000000) : "")
    );
    return "terlalu besar";
  }

  const intPart = Math.floor(num);
  const result = convert(intPart);
  return result + " rupiah";
}
