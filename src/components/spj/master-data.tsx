"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  GraduationCap,
  Hash,
  Info,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Save,
  School as SchoolIcon,
  Search,
  Store,
  Tag,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Calendar,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/user-management/user-management";
import { BospManagement } from "@/components/bosp/bosp-management";
import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useBpu,
  useCreateBpu,
  useCreateProduct,
  useCreateVendor,
  useDeleteBpu,
  useDeleteProduct,
  useDeleteVendor,
  useProducts,
  useSchool,
  useUpdateProduct,
  useUpdateSchool,
  useUpdateVendor,
  useVendors,
} from "@/hooks/use-spj";
import type { Bpu, Product, School, Vendor } from "@/lib/types/spj";
import { formatNumber, formatRupiah } from "@/lib/format";

// ============================================================================
// Shared helpers
// ============================================================================

type Tone = "rose" | "violet" | "amber" | "emerald" | "cyan" | "slate";

const toneStyles: Record<
  Tone,
  { accent: string; soft: string; text: string; ring: string; bar: string }
> = {
  rose: {
    accent: "bg-rose-600 hover:bg-rose-700 text-white",
    soft: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
    text: "text-rose-700 dark:text-rose-300",
    ring: "focus-visible:ring-rose-500/40",
    bar: "bg-rose-500",
  },
  violet: {
    accent: "bg-violet-600 hover:bg-violet-700 text-white",
    soft: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900",
    text: "text-violet-700 dark:text-violet-300",
    ring: "focus-visible:ring-violet-500/40",
    bar: "bg-violet-500",
  },
  amber: {
    accent: "bg-amber-600 hover:bg-amber-700 text-white",
    soft: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-300",
    ring: "focus-visible:ring-amber-500/40",
    bar: "bg-amber-500",
  },
  emerald: {
    accent: "bg-emerald-600 hover:bg-emerald-700 text-white",
    soft: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "focus-visible:ring-emerald-500/40",
    bar: "bg-emerald-500",
  },
  cyan: {
    accent: "bg-cyan-600 hover:bg-cyan-700 text-white",
    soft: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900",
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "focus-visible:ring-cyan-500/40",
    bar: "bg-cyan-500",
  },
  slate: {
    accent: "bg-slate-700 hover:bg-slate-800 text-white",
    soft: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    ring: "focus-visible:ring-slate-500/40",
    bar: "bg-slate-500",
  },
};

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ============================================================================
// Small reusable bits
// ============================================================================

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Card className="border-dashed border-slate-300 dark:border-slate-700">
      <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-500">
        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-center max-w-sm">{description}</p>}
      </CardContent>
    </Card>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="size-6 animate-spin text-rose-500" />
        <p className="text-sm">{label}</p>
      </CardContent>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-rose-200 dark:border-rose-900">
      <CardContent className="py-12 flex flex-col items-center gap-3 text-rose-700 dark:text-rose-300">
        <AlertCircle className="size-6" />
        <p className="text-sm">Gagal memuat data</p>
        <p className="text-xs text-slate-500">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterHeader({
  children,
  tone = "rose",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <Card
      className={`border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur sticky top-0 z-30 rounded-xl shadow-sm`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {children}
        </div>
        <div
          className={`mt-3 h-0.5 rounded-full ${toneStyles[tone].bar} opacity-70`}
        />
      </CardContent>
    </Card>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  tone = "rose",
}: {
  onEdit: () => void;
  onDelete: () => void;
  tone?: Tone;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 text-slate-500" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:dark:text-rose-300"
        >
          <Trash2 className="size-4" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function MasterData() {
  const [tab, setTab] = useState<string>("vendor");
  // Lazy-import useSession to avoid adding client-side coupling at module
  // load time. We just need the role to decide whether to show the
  // "Pengguna" admin tab.
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-slate-100 dark:bg-slate-900 h-auto p-1 gap-1">
            <TabsTrigger
              value="vendor"
              className="data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <Store className="size-3.5" />
              Vendor
            </TabsTrigger>
            <TabsTrigger
              value="product"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <Boxes className="size-3.5" />
              Produk
            </TabsTrigger>
            <TabsTrigger
              value="bpu"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <Hash className="size-3.5" />
              BPU
            </TabsTrigger>
            <TabsTrigger
              value="school"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
            >
              <SchoolIcon className="size-3.5" />
              Sekolah
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="bosp"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
              >
                <Calendar className="size-3.5" />
                BOSP
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5"
              >
                <Users className="size-3.5" />
                Pengguna
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="vendor">
          <VendorTab />
        </TabsContent>
        <TabsContent value="product">
          <ProductTab />
        </TabsContent>
        <TabsContent value="bpu">
          <BpuTab />
        </TabsContent>
        <TabsContent value="school">
          <SchoolTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="bosp">
            <BospManagement />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============================================================================
// Tab 1: Vendor
// ============================================================================

interface VendorForm {
  name: string;
  owner: string;
  phone: string;
  address: string;
}

const emptyVendorForm: VendorForm = {
  name: "",
  owner: "",
  phone: "",
  address: "",
};

function VendorTab() {
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounced(searchInput);

  const { data, isLoading, isError, error, refetch } = useVendors(q || undefined);
  const items = data?.items ?? [];

  const createMut = useCreateVendor();
  const updateMut = useUpdateVendor();
  const deleteMut = useDeleteVendor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyVendorForm);

  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyVendorForm);
    setDialogOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditingId(v.id);
    setForm({
      name: v.name ?? "",
      owner: v.owner ?? "",
      phone: v.phone ?? "",
      address: v.address ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama vendor wajib diisi");
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      owner: form.owner.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    if (editingId) {
      updateMut.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success("Vendor diperbarui");
            setDialogOpen(false);
          },
          onError: (e: Error) => toast.error("Gagal memperbarui: " + e.message),
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Vendor ditambahkan");
          setDialogOpen(false);
        },
        onError: (e: Error) => toast.error("Gagal menambah: " + e.message),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Vendor dihapus");
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error("Gagal menghapus: " + e.message),
    });
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <FilterHeader tone="rose">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Cari vendor berdasarkan nama atau pemilik..."
        />
        <Button
          onClick={openCreate}
          className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Tambah Vendor
        </Button>
      </FilterHeader>

      {isLoading ? (
        <LoadingState label="Memuat vendor..." />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message ?? "Unknown error"}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Belum ada vendor"
          description="Tambah toko/rekanan pertama dengan tombol di atas. Vendor dipakai pada transaksi pengadaan ATK."
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="max-h-[calc(100vh-18rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[0_1px_0_0_rgb(0_0_0_/_0.05)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="min-w-40">Nama</TableHead>
                    <TableHead className="min-w-32">Pemilik</TableHead>
                    <TableHead className="min-w-32">No. HP</TableHead>
                    <TableHead className="min-w-64">Alamat</TableHead>
                    <TableHead className="w-12 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((v, idx) => (
                    <TableRow
                      key={v.id}
                      className="hover:bg-rose-50/40 dark:hover:bg-rose-950/10 transition-colors"
                    >
                      <TableCell className="text-center text-slate-400 text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                            <Store className="size-3.5" />
                          </div>
                          {v.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {v.owner ?? (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.phone ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-[11px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          >
                            <Phone className="size-3 mr-1 text-emerald-500" />
                            {v.phone}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {v.address ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 cursor-help text-slate-600 dark:text-slate-300">
                                <MapPin className="size-3 inline mr-1 text-amber-500" />
                                {v.address}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {v.address}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <RowActions
                          onEdit={() => openEdit(v)}
                          onDelete={() => {
                            setDeleteTarget(v);
                            setDeleteOpen(true);
                          }}
                          tone="rose"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((v) => (
              <Card
                key={v.id}
                className="border-slate-200 dark:border-slate-800"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                        <Store className="size-4" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                        {v.name}
                      </span>
                    </div>
                    <RowActions
                      onEdit={() => openEdit(v)}
                      onDelete={() => {
                        setDeleteTarget(v);
                        setDeleteOpen(true);
                      }}
                      tone="rose"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Pemilik</p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {v.owner ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">No. HP</p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {v.phone ?? "—"}
                      </p>
                    </div>
                  </div>
                  {v.address && (
                    <div className="text-xs">
                      <p className="text-slate-400">Alamat</p>
                      <p className="text-slate-700 dark:text-slate-200 line-clamp-2">
                        {v.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-slate-500 px-1">
            Menampilkan {items.length} vendor
          </p>
        </>
      )}

      {/* === Add/Edit dialog === */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <Store className="size-4" />
              </div>
              {editingId ? "Edit Vendor" : "Tambah Vendor"}
            </DialogTitle>
            <DialogDescription>
              Data toko/rekanan yang dipakai pada transaksi pengadaan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="v-name">
                Nama Vendor <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="v-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Toko ATK Sentosa"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="v-owner">Pemilik</Label>
                <Input
                  id="v-owner"
                  value={form.owner}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, owner: e.target.value }))
                  }
                  placeholder="Budi Santoso"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="v-phone">No. HP</Label>
                <Input
                  id="v-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="0812-3456-7890"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="v-address">Alamat</Label>
              <Textarea
                id="v-address"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Jl. Merdeka No. 1, Telukdalam"
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete AlertDialog === */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Hapus Vendor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus vendor{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {deleteTarget?.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan. Vendor yang masih memiliki
              transaksi tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Tab 2: Product
// ============================================================================

interface ProductForm {
  name: string;
  spec: string;
  unit: string;
  price: string;
  category: string;
}

const emptyProductForm: ProductForm = {
  name: "",
  spec: "",
  unit: "unit",
  price: "0",
  category: "ATK",
};

const CATEGORY_TONES: Record<string, string> = {
  ATK: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900",
  Konsumsi:
    "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  Jasa: "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900",
  Lainnya:
    "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

function CategoryBadge({ category }: { category: string }) {
  const tone =
    CATEGORY_TONES[category] ?? CATEGORY_TONES.Lainnya;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-medium ${tone}`}
    >
      {category || "Lainnya"}
    </Badge>
  );
}

function ProductTab() {
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounced(searchInput);

  const { data, isLoading, isError, error, refetch } = useProducts(
    q || undefined
  );
  const items = data?.items ?? [];

  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProductForm);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyProductForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      spec: p.spec ?? "",
      unit: p.unit ?? "unit",
      price: String(p.price ?? 0),
      category: p.category ?? "ATK",
    });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      spec: form.spec.trim() || null,
      unit: form.unit.trim() || null,
      price: parseFloat(form.price) || 0,
      category: form.category.trim() || "ATK",
    };

    if (editingId) {
      updateMut.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success("Produk diperbarui");
            setDialogOpen(false);
          },
          onError: (e: Error) => toast.error("Gagal memperbarui: " + e.message),
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Produk ditambahkan");
          setDialogOpen(false);
        },
        onError: (e: Error) => toast.error("Gagal menambah: " + e.message),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Produk dihapus");
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error("Gagal menghapus: " + e.message),
    });
  }

  const isSaving = createMut.isPending || updateMut.isPending;
  const pricePreview = formatRupiah(parseFloat(form.price) || 0);

  return (
    <div className="space-y-4">
      <FilterHeader tone="violet">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Cari produk berdasarkan nama..."
        />
        <Button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Tambah Produk
        </Button>
      </FilterHeader>

      {isLoading ? (
        <LoadingState label="Memuat produk..." />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message ?? "Unknown error"}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-5" />}
          title="Belum ada produk"
          description="Tambah produk ATK pertama dengan tombol di atas. Produk dipakai untuk katalog pengadaan."
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="max-h-[calc(100vh-18rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[0_1px_0_0_rgb(0_0_0_/_0.05)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="min-w-44">Nama Produk</TableHead>
                    <TableHead className="min-w-64">Spesifikasi</TableHead>
                    <TableHead className="min-w-20">Satuan</TableHead>
                    <TableHead className="text-right min-w-32">Harga</TableHead>
                    <TableHead className="text-center min-w-24">Kategori</TableHead>
                    <TableHead className="w-12 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p, idx) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-violet-50/40 dark:hover:bg-violet-950/10 transition-colors"
                    >
                      <TableCell className="text-center text-slate-400 text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                            <Tag className="size-3.5" />
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 cursor-help max-w-[12rem]">
                                {p.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {p.name}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {p.spec ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 cursor-help text-slate-600 dark:text-slate-300">
                                {p.spec}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              {p.spec}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        >
                          {p.unit ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-rose-700 dark:text-rose-300">
                        {formatRupiah(p.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <CategoryBadge category={p.category} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RowActions
                          onEdit={() => openEdit(p)}
                          onDelete={() => {
                            setDeleteTarget(p);
                            setDeleteOpen(true);
                          }}
                          tone="violet"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((p) => (
              <Card
                key={p.id}
                className="border-slate-200 dark:border-slate-800"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                        <Tag className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
                          {p.name}
                        </p>
                        <CategoryBadge category={p.category} />
                      </div>
                    </div>
                    <RowActions
                      onEdit={() => openEdit(p)}
                      onDelete={() => {
                        setDeleteTarget(p);
                        setDeleteOpen(true);
                      }}
                      tone="violet"
                    />
                  </div>
                  {p.spec && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {p.spec}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Satuan:{" "}
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] bg-slate-50 dark:bg-slate-900"
                      >
                        {p.unit ?? "—"}
                      </Badge>
                    </span>
                    <span className="font-mono font-semibold text-rose-700 dark:text-rose-300 text-sm">
                      {formatRupiah(p.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-slate-500 px-1">
            Menampilkan {items.length} produk
          </p>
        </>
      )}

      {/* === Add/Edit dialog === */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                <Boxes className="size-4" />
              </div>
              {editingId ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              Katalog produk ATK untuk pengadaan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="p-name">
                Nama Produk <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Kertas HVS A4 70 gsm"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="p-spec">Spesifikasi</Label>
              <Textarea
                id="p-spec"
                value={form.spec}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, spec: e.target.value }))
                }
                placeholder="Merk Sinar Dunia, rim 500 lembar"
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="p-unit">Satuan</Label>
                <Input
                  id="p-unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="rim"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="p-category">Kategori</Label>
                <Input
                  id="p-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="ATK"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="p-price">Harga (Rp)</Label>
              <Input
                id="p-price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="0"
                className="mt-1"
                min={0}
              />
              <p className="text-xs text-slate-500 mt-1">
                Preview:{" "}
                <span className="font-mono font-medium text-rose-700 dark:text-rose-300">
                  {pricePreview}
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete AlertDialog === */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Hapus Produk
            </AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus produk{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {deleteTarget?.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Tab 3: BPU
// ============================================================================

interface BpuForm {
  code: string;
  noPesan: string;
}

const emptyBpuForm: BpuForm = {
  code: "",
  noPesan: "",
};

function BpuTab() {
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounced(searchInput);

  const { data, isLoading, isError, error, refetch } = useBpu(q || undefined);
  const items = data?.items ?? [];

  const createMut = useCreateBpu();
  const deleteMut = useDeleteBpu();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BpuForm>(emptyBpuForm);

  const [deleteTarget, setDeleteTarget] = useState<Bpu | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Suggest next code based on existing items
  const suggestedCode = useMemo(() => {
    const nums = items
      .map((b) => b.code)
      .map((c) => parseInt((c.match(/(\d+)/) ?? [])[1] ?? "0", 10))
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `BPU${String(max + 1).padStart(3, "0")}`;
  }, [items]);

  function openCreate() {
    setForm({ ...emptyBpuForm, code: suggestedCode });
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.code.trim()) {
      toast.error("Kode BPU wajib diisi");
      return;
    }
    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      noPesan: form.noPesan.trim() || null,
      isActive: true,
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success("BPU ditambahkan");
        setDialogOpen(false);
      },
      onError: (e: Error) => toast.error("Gagal menambah: " + e.message),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("BPU dihapus");
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error("Gagal menghapus: " + e.message),
    });
  }

  return (
    <div className="space-y-4">
      <FilterHeader tone="amber">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Cari BPU berdasarkan kode..."
        />
        <Button
          onClick={openCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Tambah BPU
        </Button>
      </FilterHeader>

      {/* Info note */}
      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="p-3 flex items-start gap-2.5">
          <div className="size-7 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Info className="size-4" />
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-0.5">Tentang BPU</p>
            <p className="text-amber-700/90 dark:text-amber-300/80">
              BPU = nomor urut Bendahara Pengguna Anggaran, dipakai untuk
              tracking dokumen pengadaan.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState label="Memuat BPU..." />
      ) : isError ? (
        <ErrorState
          message={(error as Error)?.message ?? "Unknown error"}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Hash className="size-5" />}
          title="Belum ada BPU"
          description="Tambah kode BPU pertama dengan tombol di atas. Format disarankan: BPU001."
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="max-h-[calc(100vh-22rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[0_1px_0_0_rgb(0_0_0_/_0.05)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="min-w-32">Kode BPU</TableHead>
                    <TableHead className="min-w-40">No. Pesan</TableHead>
                    <TableHead className="text-center min-w-24">Status</TableHead>
                    <TableHead className="w-12 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((b, idx) => (
                    <TableRow
                      key={b.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors"
                    >
                      <TableCell className="text-center text-slate-400 text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px] bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                        >
                          <Hash className="size-3 mr-1" />
                          {b.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {b.noPesan ?? (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {b.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <RowActions
                          onEdit={() => {
                            toast.info("BPU tidak dapat diedit. Hapus dan buat baru bila perlu.");
                          }}
                          onDelete={() => {
                            setDeleteTarget(b);
                            setDeleteOpen(true);
                          }}
                          tone="amber"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((b) => (
              <Card
                key={b.id}
                className="border-slate-200 dark:border-slate-800"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <Hash className="size-4" />
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                      >
                        {b.code}
                      </Badge>
                    </div>
                    <RowActions
                      onEdit={() => {
                        toast.info("BPU tidak dapat diedit. Hapus dan buat baru bila perlu.");
                      }}
                      onDelete={() => {
                        setDeleteTarget(b);
                        setDeleteOpen(true);
                      }}
                      tone="amber"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-400">No. Pesan</p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {b.noPesan ?? "—"}
                      </p>
                    </div>
                    {b.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="size-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500"
                      >
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-slate-500 px-1">
            Menampilkan {items.length} BPU
          </p>
        </>
      )}

      {/* === Add dialog === */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Hash className="size-4" />
              </div>
              Tambah BPU
            </DialogTitle>
            <DialogDescription>
              Tambah kode Bendahara Pengguna Anggaran baru untuk tracking dokumen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="b-code">
                Kode BPU <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="b-code"
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="BPU001"
                className="mt-1 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Saranan:{" "}
                <span className="font-mono text-amber-700 dark:text-amber-300">
                  {suggestedCode}
                </span>
              </p>
            </div>
            <div>
              <Label htmlFor="b-nopesan">No. Pesan (opsional)</Label>
              <Input
                id="b-nopesan"
                value={form.noPesan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, noPesan: e.target.value }))
                }
                placeholder="001/SPJ/..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete AlertDialog === */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-rose-500" />
              Hapus BPU
            </AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus BPU{" "}
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                {deleteTarget?.code}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Tab 4: Sekolah
// ============================================================================

interface SchoolForm {
  name: string;
  npsn: string;
  address: string;
  year: string;
  principalName: string;
  principalNip: string;
  principalRank: string;
  treasurerName: string;
  treasurerNip: string;
  treasurerRank: string;
  goodsManagerName: string;
  goodsManagerNip: string;
  goodsManagerRank: string;
  receiverName: string;
  receiverPhone: string;
}

const emptySchoolForm: SchoolForm = {
  name: "",
  npsn: "",
  address: "",
  year: String(new Date().getFullYear()),
  principalName: "",
  principalNip: "",
  principalRank: "",
  treasurerName: "",
  treasurerNip: "",
  treasurerRank: "",
  goodsManagerName: "",
  goodsManagerNip: "",
  goodsManagerRank: "",
  receiverName: "",
  receiverPhone: "",
};

function FormSection({
  title,
  icon,
  tone = "emerald",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`border-slate-200 dark:border-slate-800 ${toneStyles[tone].soft} border`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div
            className={`size-7 rounded-md ${toneStyles[tone].soft} ${toneStyles[tone].text} flex items-center justify-center border`}
          >
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function OfficerField({
  def,
  form,
  setForm,
}: {
  def: OfficerFieldDef;
  form: SchoolForm;
  setForm: React.Dispatch<React.SetStateAction<SchoolForm>>;
}) {
  return (
    <div>
      <Label htmlFor={`f-${def.key}`} className="text-xs">
        {def.label}
      </Label>
      <Input
        id={`f-${def.key}`}
        value={(form[def.key] as string) ?? ""}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, [def.key]: e.target.value }))
        }
        className={`mt-1 text-sm h-9 ${def.mono ? "font-mono" : ""}`}
        placeholder={def.placeholder}
      />
    </div>
  );
}

interface OfficerFieldDef {
  key: keyof SchoolForm;
  label: string;
  placeholder?: string;
  mono?: boolean;
}

function OfficerBlock({
  title,
  icon,
  tone,
  fields,
  form,
  setForm,
}: {
  title: string;
  icon: React.ReactNode;
  tone: Tone;
  fields: OfficerFieldDef[];
  form: SchoolForm;
  setForm: React.Dispatch<React.SetStateAction<SchoolForm>>;
}) {
  const cols =
    fields.length >= 3
      ? "sm:grid-cols-3"
      : fields.length === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-1";
  return (
    <div
      className={`rounded-lg border p-3 space-y-2.5 ${toneStyles[tone].soft}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${toneStyles[tone].text} flex items-center gap-1.5`}
      >
        {icon}
        {title}
      </p>
      <div className={`grid grid-cols-1 ${cols} gap-2.5`}>
        {fields.map((def) => (
          <OfficerField
            key={def.key}
            def={def}
            form={form}
            setForm={setForm}
          />
        ))}
      </div>
    </div>
  );
}

// Convert School DTO to local form state
function schoolToForm(school: School | null): SchoolForm {
  if (!school) return { ...emptySchoolForm };
  return {
    name: school.name ?? "",
    npsn: school.npsn ?? "",
    address: school.address ?? "",
    year: String(school.year ?? new Date().getFullYear()),
    principalName: school.principalName ?? "",
    principalNip: school.principalNip ?? "",
    principalRank: school.principalRank ?? "",
    treasurerName: school.treasurerName ?? "",
    treasurerNip: school.treasurerNip ?? "",
    treasurerRank: school.treasurerRank ?? "",
    goodsManagerName: school.goodsManagerName ?? "",
    goodsManagerNip: school.goodsManagerNip ?? "",
    goodsManagerRank: school.goodsManagerRank ?? "",
    receiverName: school.receiverName ?? "",
    receiverPhone: school.receiverPhone ?? "",
  };
}

const PRINCIPAL_FIELDS: OfficerFieldDef[] = [
  { key: "principalName", label: "Nama" },
  { key: "principalNip", label: "NIP", mono: true },
  {
    key: "principalRank",
    label: "Pangkat/Golongan",
    placeholder: "Pembina Tk. I / IV-d",
  },
];

const TREASURER_FIELDS: OfficerFieldDef[] = [
  { key: "treasurerName", label: "Nama" },
  { key: "treasurerNip", label: "NIP", mono: true },
  {
    key: "treasurerRank",
    label: "Pangkat/Golongan",
    placeholder: "Pembina Tk. I / IV-d",
  },
];

const GOODS_MANAGER_FIELDS: OfficerFieldDef[] = [
  { key: "goodsManagerName", label: "Nama" },
  { key: "goodsManagerNip", label: "NIP", mono: true },
  {
    key: "goodsManagerRank",
    label: "Pangkat/Golongan",
    placeholder: "Pembina / IV-a",
  },
];

const RECEIVER_FIELDS: OfficerFieldDef[] = [
  { key: "receiverName", label: "Nama" },
  {
    key: "receiverPhone",
    label: "No. HP",
    mono: true,
    placeholder: "0812-xxxx-xxxx",
  },
];

// Inner form component: mounted with `key` so initial state is derived once
// from props, avoiding setState-in-effect.
function SchoolFormInner({
  initialSchool,
}: {
  initialSchool: School | null;
}) {
  const updateMut = useUpdateSchool();
  const [form, setForm] = useState<SchoolForm>(() =>
    schoolToForm(initialSchool)
  );

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama sekolah wajib diisi");
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      npsn: form.npsn.trim() || null,
      address: form.address.trim() || null,
      year: parseInt(form.year) || new Date().getFullYear(),
      principalName: form.principalName.trim() || null,
      principalNip: form.principalNip.trim() || null,
      principalRank: form.principalRank.trim() || null,
      treasurerName: form.treasurerName.trim() || null,
      treasurerNip: form.treasurerNip.trim() || null,
      treasurerRank: form.treasurerRank.trim() || null,
      goodsManagerName: form.goodsManagerName.trim() || null,
      goodsManagerNip: form.goodsManagerNip.trim() || null,
      goodsManagerRank: form.goodsManagerRank.trim() || null,
      receiverName: form.receiverName.trim() || null,
      receiverPhone: form.receiverPhone.trim() || null,
    };

    updateMut.mutate(payload, {
      onSuccess: () => {
        toast.success("Data sekolah disimpan");
      },
      onError: (e: Error) => toast.error("Gagal menyimpan: " + e.message),
    });
  }

  function handleReset() {
    setForm(schoolToForm(initialSchool));
    toast.info("Form dikembalikan ke data tersimpan");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/80 via-slate-50 to-cyan-50/80 dark:from-emerald-950/30 dark:via-slate-950 dark:to-cyan-950/30">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <SchoolIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold">
                Profil Sekolah
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {form.name || "Belum dikonfigurasi"}
              </p>
              <p className="text-xs text-slate-500">
                Tahun Anggaran {form.year}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={updateMut.isPending}
              size="sm"
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMut.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              {updateMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan Perubahan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Sekolah */}
      <FormSection
        title="Informasi Sekolah"
        icon={<Building2 className="size-4" />}
        tone="emerald"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="s-name">
              Nama Sekolah <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="s-name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="SMA Negeri 1 Telukdalam"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="s-npsn">NPSN</Label>
            <Input
              id="s-npsn"
              value={form.npsn}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, npsn: e.target.value }))
              }
              placeholder="107021xxx"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="s-year">Tahun Anggaran</Label>
            <Input
              id="s-year"
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, year: e.target.value }))
              }
              placeholder="2025"
              className="mt-1 font-mono"
              min={2000}
              max={2100}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="s-address">Alamat</Label>
            <Textarea
              id="s-address"
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Jl. ... Telukdalam, Nias Selatan"
              rows={2}
              className="mt-1 resize-none"
            />
          </div>
        </div>
      </FormSection>

      {/* Pejabat Sekolah */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="size-7 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <UserCog className="size-4" />
            </div>
            Pejabat Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <OfficerBlock
            title="Kepala Sekolah"
            icon={<GraduationCap className="size-3.5" />}
            tone="violet"
            form={form}
            setForm={setForm}
            fields={PRINCIPAL_FIELDS}
          />
          <OfficerBlock
            title="Bendahara"
            icon={<Wallet className="size-3.5" />}
            tone="amber"
            form={form}
            setForm={setForm}
            fields={TREASURER_FIELDS}
          />
          <OfficerBlock
            title="Pengurus Barang"
            icon={<Boxes className="size-3.5" />}
            tone="rose"
            form={form}
            setForm={setForm}
            fields={GOODS_MANAGER_FIELDS}
          />
          <OfficerBlock
            title="Penerima Barang"
            icon={<UserCheck className="size-3.5" />}
            tone="cyan"
            form={form}
            setForm={setForm}
            fields={RECEIVER_FIELDS}
          />
        </CardContent>
      </Card>

      {/* Footer save */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
            <Info className="size-4" />
            <span>
              Data sekolah dipakai pada cetakan dokumen SPJ (kuitansi, BAST,
              BKU).
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateMut.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
          >
            {updateMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SchoolTab() {
  const { data, isLoading, isError, error, refetch } = useSchool();
  const school = data?.item ?? null;

  if (isLoading) {
    return <LoadingState label="Memuat data sekolah..." />;
  }
  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message ?? "Unknown error"}
        onRetry={() => refetch()}
      />
    );
  }

  // `key` ensures form re-initializes from server data when school id changes
  // (or when school becomes available). Avoids setState-in-effect.
  return (
    <SchoolFormInner
      key={school?.id ?? "new"}
      initialSchool={school}
    />
  );
}
