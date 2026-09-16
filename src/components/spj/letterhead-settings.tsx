"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Upload,
  Bold,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCcw,
  Type,
  AlignLeft,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import {
  useLetterhead,
  useUpdateLetterhead,
  useUploadLogo,
} from "@/hooks/use-spj";
import type { LetterheadSettings } from "@/lib/types/spj";
import { LetterheadStatic } from "@/components/spj/letterhead";

const FONT_OPTIONS = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Calibri", label: "Calibri" },
  { value: "Cambria", label: "Cambria" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Garamond", label: "Garamond" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Verdana", label: "Verdana" },
  { value: "Book Antiqua", label: "Book Antiqua" },
  { value: "Palatino Linotype", label: "Palatino Linotype" },
];

const DEFAULT_SETTINGS: LetterheadSettings = {
  id: "default",
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
  line3Text: "SMA NEGERI 1 TELUKDALAM",
  line3Bold: true,
  line3Size: 20,
  line4Text:
    "Jl. Pendidikan No.13, Kel. Pasar Teluk Dalam, Kec. Teluk Dalam, Kab. Nias Selatan,",
  line4Bold: false,
  line4Size: 11,
  line5Text: "Cabdisdik Wil.XIV, Kode Pos 22865",
  line5Bold: false,
  line5Size: 11,
  line6Text: "Telp/HP: 081370904506, Pos-el smansatelukdalam1987@gmail.com",
  line6Bold: false,
  line6Size: 11,
  line7Text: "Laman : smansatelukdalam.sch.id",
  line7Bold: false,
  line7Size: 11,
  // Dual mode (KOP 2 Logo) - expanded text with CABDIS, NIS, etc.
  dualLine1Text: "PEMERINTAH PROVINSI SUMATERA UTARA",
  dualLine1Bold: true,
  dualLine1Size: 14,
  dualLine2Text: "DINAS PENDIDIKAN",
  dualLine2Bold: true,
  dualLine2Size: 14,
  dualLine3Text: "CABDIS PENDIDIKAN WILAYAH XIV",
  dualLine3Bold: true,
  dualLine3Size: 13,
  dualLine4Text: "SMA NEGERI 1 TELUKDALAM",
  dualLine4Bold: true,
  dualLine4Size: 20,
  dualLine5Text:
    "NIS : 300010         NPSN : 10258246        Terakreditasi A           NSS: 301071701001",
  dualLine5Bold: false,
  dualLine5Size: 11,
  dualLine6Text:
    "Jl. Pendidikan No. 13 Kelurahan Pasar Telukdalam Kecamatan Telukdalam Kabupaten Nias Selatan; Telp/HP: 081370904506; Kode Pos: 22865",
  dualLine6Bold: false,
  dualLine6Size: 11,
  dualLine7Text:
    "Email: smansatelukdalam1987@gmail.com ; website: www.smansatelukdalam.sch.id",
  dualLine7Bold: false,
  dualLine7Size: 11,
  showBottomLine: true,
  bottomLineWidth: 2,
};

export function LetterheadSettingsPanel() {
  const { data, isLoading } = useLetterhead();
  const updateMutation = useUpdateLetterhead();
  const uploadMutation = useUploadLogo();

  const [local, setLocal] = useState<LetterheadSettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  // Ref to always hold the latest settings (avoids stale closure in rapid updates)
  const localRef = useRef<LetterheadSettings>(DEFAULT_SETTINGS);

  // Sync server data to local state
  useEffect(() => {
    if (data?.settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocal(data.settings);
      localRef.current = data.settings;
    }
  }, [data?.settings]);

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirty, setDirty] = useState(false);

  const scheduleSave = (newSettings: LetterheadSettings) => {
    localRef.current = newSettings;
    setLocal(newSettings);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateMutation.mutate(newSettings, {
        onSuccess: () => {
          setDirty(false);
          toast.success("Pengaturan KOP disimpan", {
            duration: 1500,
          });
        },
        onError: (e) => toast.error("Gagal menyimpan: " + e.message),
      });
    }, 800);
  };

  const update = (field: keyof LetterheadSettings, value: unknown) => {
    scheduleSave({ ...localRef.current, [field]: value });
  };

  const updateLine = (
    lineNum: number,
    field: "Text" | "Bold" | "Size",
    value: string | boolean | number
  ) => {
    const key = (`line${lineNum}${field}` as keyof LetterheadSettings);
    scheduleSave({ ...localRef.current, [key]: value } as LetterheadSettings);
  };

  const updateDualLine = (
    lineNum: number,
    field: "Text" | "Bold" | "Size",
    value: string | boolean | number
  ) => {
    const key = (`dualLine${lineNum}${field}` as keyof LetterheadSettings);
    scheduleSave({ ...localRef.current, [key]: value } as LetterheadSettings);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isLogo2 = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ file, isLogo2 });
      toast.success(
        isLogo2 ? "Logo 2 berhasil diunggah" : "Logo berhasil diunggah"
      );
    } catch (err) {
      toast.error("Gagal upload: " + (err as Error).message);
    }
    const ref = isLogo2 ? fileInputRef2 : fileInputRef;
    if (ref.current) ref.current.value = "";
  };

  const handleReset = () => {
    if (
      !confirm(
        "Reset pengaturan KOP ke nilai default? Semua perubahan akan hilang."
      )
    )
      return;
    scheduleSave(DEFAULT_SETTINGS);
    toast.info("Reset ke pengaturan default");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        <span className="ml-2 text-sm text-muted-foreground">
          Memuat pengaturan KOP...
        </span>
      </div>
    );
  }

  const lineMeta = [
    { num: 1, label: "Baris 1", placeholder: "PEMERINTAH PROVINSI..." },
    { num: 2, label: "Baris 2", placeholder: "DINAS PENDIDIKAN" },
    { num: 3, label: "Baris 3 (terbesar)", placeholder: "SMA NEGERI 1..." },
    { num: 4, label: "Baris 4 (alamat)", placeholder: "Jl. Pendidikan..." },
    { num: 5, label: "Baris 5 (cabdisdik/pos)", placeholder: "Cabdisdik Wil..." },
    { num: 6, label: "Baris 6 (telp/email)", placeholder: "Telp/HP: ..." },
    { num: 7, label: "Baris 7 (laman)", placeholder: "Laman : ..." },
  ];

  const dualLineMeta = [
    { num: 1, label: "Baris 1", placeholder: "PEMERINTAH PROVINSI..." },
    { num: 2, label: "Baris 2", placeholder: "DINAS PENDIDIKAN" },
    { num: 3, label: "Baris 3", placeholder: "CABDIS PENDIDIKAN..." },
    { num: 4, label: "Baris 4 (terbesar)", placeholder: "SMA NEGERI 1..." },
    { num: 5, label: "Baris 5 (NIS/NPSN)", placeholder: "NIS : ... NPSN : ... NSS: ..." },
    { num: 6, label: "Baris 6 (alamat)", placeholder: "Jl. Pendidikan... Kode Pos" },
    { num: 7, label: "Baris 7 (email/web)", placeholder: "Email: ... website: ..." },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-l-4 border-l-rose-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-rose-600" />
                Pengaturan KOP Surat
              </CardTitle>
              <CardDescription className="text-sm">
                Atur logo, font, ukuran, dan posisi KOP surat untuk semua
                dokumen SPJ. Perubahan otomatis tersimpan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dirty || updateMutation.isPending ? (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300"
                >
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Menyimpan...
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-400 text-emerald-700 dark:text-emerald-300"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Tersimpan
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KOP Mode Toggle */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            Mode KOP Surat
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih tampilan KOP: 1 logo di kiri, atau 2 logo (kiri + kanan)
            dengan teks di tengah. Berlaku untuk semua dokumen SPJ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update("kopMode", "single")}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                local.kopMode === "single"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/30"
                  : "border-muted bg-muted/30 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold">KOP 1 Logo</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Logo di kiri, teks di kanan
              </span>
            </button>
            <button
              type="button"
              onClick={() => update("kopMode", "dual")}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                local.kopMode === "dual"
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500 dark:bg-violet-950/30"
                  : "border-muted bg-muted/30 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold">KOP 2 Logo</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Logo kiri + kanan, teks di tengah
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Settings */}
        <div className="space-y-4">
          {/* Logo Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-violet-600" />
                {local.kopMode === "dual" ? "Logo Kiri (Logo 1)" : "Logo"}
              </CardTitle>
              <CardDescription className="text-xs">
                Upload logo dan atur posisi & ukurannya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload */}
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {local.logoPath ? (
                    <img
                      src={local.logoPath}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="w-full h-8 text-xs"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1" />
                    )}
                    Upload Logo
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    PNG/JPG/WebP/GIF, max 5MB
                  </p>
                </div>
              </div>

              {/* Logo position controls */}
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Posisi Logo (Geser)
                </Label>
                <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                  <div />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => update("logoOffsetY", local.logoOffsetY - 5)}
                    title="Geser ke atas"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <div />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => update("logoOffsetX", local.logoOffsetX - 5)}
                    title="Geser ke kiri"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      update("logoOffsetX", 0);
                      update("logoOffsetY", 0);
                    }}
                    title="Reset posisi"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => update("logoOffsetX", local.logoOffsetX + 5)}
                    title="Geser ke kanan"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <div />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => update("logoOffsetY", local.logoOffsetY + 5)}
                    title="Geser ke bawah"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <div />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Offset X: {local.logoOffsetX}px
                    </Label>
                    <Slider
                      value={[local.logoOffsetX]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={(v) => update("logoOffsetX", v[0])}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Offset Y: {local.logoOffsetY}px
                    </Label>
                    <Slider
                      value={[local.logoOffsetY]}
                      min={-100}
                      max={100}
                      step={1}
                      onValueChange={(v) => update("logoOffsetY", v[0])}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Logo size */}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Ukuran Logo</Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {local.logoWidth}×{local.logoHeight}px
                  </span>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    Lebar
                  </Label>
                  <Slider
                    value={[local.logoWidth]}
                    min={40}
                    max={250}
                    step={5}
                    onValueChange={(v) => update("logoWidth", v[0])}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    Tinggi
                  </Label>
                  <Slider
                    value={[local.logoHeight]}
                    min={40}
                    max={250}
                    step={5}
                    onValueChange={(v) => update("logoHeight", v[0])}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo 2 Settings (only in dual mode) */}
          {local.kopMode === "dual" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-violet-600" />
                  Logo Kanan (Logo 2)
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload logo kanan dan atur posisi & ukurannya
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload */}
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {local.logo2Path ? (
                      <img
                        src={local.logo2Path}
                        alt="Logo 2 preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      ref={fileInputRef2}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef2.current?.click()}
                      disabled={uploadMutation.isPending}
                      className="w-full h-8 text-xs"
                    >
                      {uploadMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 mr-1" />
                      )}
                      Upload Logo 2
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      PNG/JPG/WebP/GIF, max 5MB
                    </p>
                  </div>
                </div>

                {/* Logo 2 position controls */}
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Posisi Logo 2 (Geser)
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto">
                    <div />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        update("logo2OffsetY", local.logo2OffsetY - 5)
                      }
                      title="Geser ke atas"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <div />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        update("logo2OffsetX", local.logo2OffsetX - 5)
                      }
                      title="Geser ke kiri"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        update("logo2OffsetX", 0);
                        update("logo2OffsetY", 0);
                      }}
                      title="Reset posisi"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        update("logo2OffsetX", local.logo2OffsetX + 5)
                      }
                      title="Geser ke kanan"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <div />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        update("logo2OffsetY", local.logo2OffsetY + 5)
                      }
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <div />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Offset X: {local.logo2OffsetX}px
                      </Label>
                      <Slider
                        value={[local.logo2OffsetX]}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={(v) => update("logo2OffsetX", v[0])}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">
                        Offset Y: {local.logo2OffsetY}px
                      </Label>
                      <Slider
                        value={[local.logo2OffsetY]}
                        min={-100}
                        max={100}
                        step={1}
                        onValueChange={(v) => update("logo2OffsetY", v[0])}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo 2 size */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Ukuran Logo 2</Label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {local.logo2Width}×{local.logo2Height}px
                    </span>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Lebar
                    </Label>
                    <Slider
                      value={[local.logo2Width]}
                      min={40}
                      max={250}
                      step={5}
                      onValueChange={(v) => update("logo2Width", v[0])}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Tinggi
                    </Label>
                    <Slider
                      value={[local.logo2Height]}
                      min={40}
                      max={250}
                      step={5}
                      onValueChange={(v) => update("logo2Height", v[0])}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Font Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-amber-600" />
                Font & Spasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">
                  Jenis Huruf (Font Family)
                </Label>
                <Select
                  value={local.fontFamily}
                  onValueChange={(v) => update("fontFamily", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold">
                    Jarak Antar Baris
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {local.lineSpacing}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      update("lineSpacing", Math.max(0, local.lineSpacing - 1))
                    }
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Slider
                    value={[local.lineSpacing]}
                    min={0}
                    max={30}
                    step={1}
                    onValueChange={(v) => update("lineSpacing", v[0])}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      update("lineSpacing", Math.min(30, local.lineSpacing + 1))
                    }
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Gunakan tombol ↑ untuk menaikkan jarak, ↓ untuk menurunkan
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">
                    Garis Bawah KOP
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Tampilkan garis pemisah di bawah KOP
                  </p>
                </div>
                <Switch
                  checked={local.showBottomLine}
                  onCheckedChange={(v) => update("showBottomLine", v)}
                />
              </div>

              {local.showBottomLine && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">
                    Ketebalan Garis: {local.bottomLineWidth}px
                  </Label>
                  <Slider
                    value={[local.bottomLineWidth]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(v) => update("bottomLineWidth", v[0])}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Per-line settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-emerald-600" />
                Teks & Format per Baris —{" "}
                {local.kopMode === "dual" ? "KOP 2 Logo" : "KOP 1 Logo"}
              </CardTitle>
              <CardDescription className="text-xs">
                Atur teks, ukuran font, dan bold/tidak untuk setiap baris KOP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {local.kopMode === "single"
                    ? lineMeta.map((lm) => {
                        const textKey = `line${lm.num}Text` as keyof LetterheadSettings;
                        const boldKey = `line${lm.num}Bold` as keyof LetterheadSettings;
                        const sizeKey = `line${lm.num}Size` as keyof LetterheadSettings;
                        const text = local[textKey] as string;
                        const bold = local[boldKey] as boolean;
                        const size = local[sizeKey] as number;
                        return (
                          <div
                            key={lm.num}
                            className="rounded-md border p-2.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                {lm.label}
                              </Label>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={bold ? "default" : "outline"}
                                  size="sm"
                                  className="h-6 w-7 p-0"
                                  onClick={() =>
                                    updateLine(lm.num, "Bold", !bold)
                                  }
                                  title={bold ? "Bold aktif" : "Aktifkan bold"}
                                >
                                  <Bold className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Input
                              value={text}
                              onChange={(e) =>
                                updateLine(lm.num, "Text", e.target.value)
                              }
                              placeholder={lm.placeholder}
                              className="h-8 text-xs"
                              style={{
                                fontFamily: local.fontFamily,
                                fontWeight: bold ? 700 : 400,
                              }}
                            />
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] text-muted-foreground">
                                  Ukuran Font
                                </Label>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {size}px
                                </span>
                              </div>
                              <Slider
                                value={[size]}
                                min={8}
                                max={32}
                                step={1}
                                onValueChange={(v) =>
                                  updateLine(lm.num, "Size", v[0])
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                        );
                      })
                    : dualLineMeta.map((lm) => {
                        const textKey = `dualLine${lm.num}Text` as keyof LetterheadSettings;
                        const boldKey = `dualLine${lm.num}Bold` as keyof LetterheadSettings;
                        const sizeKey = `dualLine${lm.num}Size` as keyof LetterheadSettings;
                        const text = local[textKey] as string;
                        const bold = local[boldKey] as boolean;
                        const size = local[sizeKey] as number;
                        return (
                          <div
                            key={lm.num}
                            className="rounded-md border p-2.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                {lm.label}
                              </Label>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant={bold ? "default" : "outline"}
                                  size="sm"
                                  className="h-6 w-7 p-0"
                                  onClick={() =>
                                    updateDualLine(lm.num, "Bold", !bold)
                                  }
                                  title={bold ? "Bold aktif" : "Aktifkan bold"}
                                >
                                  <Bold className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Input
                              value={text}
                              onChange={(e) =>
                                updateDualLine(lm.num, "Text", e.target.value)
                              }
                              placeholder={lm.placeholder}
                              className="h-8 text-xs"
                              style={{
                                fontFamily: local.fontFamily,
                                fontWeight: bold ? 700 : 400,
                              }}
                            />
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-[10px] text-muted-foreground">
                                  Ukuran Font
                                </Label>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {size}px
                                </span>
                              </div>
                              <Slider
                                value={[size]}
                                min={8}
                                max={32}
                                step={1}
                                onValueChange={(v) =>
                                  updateDualLine(lm.num, "Size", v[0])
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Preview */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-600" />
            Pratinjau KOP (Live)
          </CardTitle>
          <CardDescription className="text-xs">
            Inilah tampilan KOP yang akan muncul di semua dokumen SPJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-md p-6 shadow-sm">
            <div className="spj-doc-preview">
              <LetterheadStatic settings={local} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            KOP ini akan tampil di: Surat Pesanan, Surat Hasil Pemeriksaan (SHP),
            Berita Acara Serah Terima (BAST), dan Surat Pertanggungjawaban (SPJ)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
