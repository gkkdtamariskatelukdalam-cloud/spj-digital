"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
  User as UserIcon,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ALL_FEATURE_KEYS,
  FEATURE_LABELS,
} from "@/lib/auth";

interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  enabledFeatures: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Management UI — shown inside the Master Data tab.
 *
 * Admin-only. Lists all users with add/edit/delete + activate toggles.
 * The edit/add form includes a feature-permission checklist (only
 * relevant for role=user; admin always has full access).
 */
export function UserManagement() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery<{ users: User[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal memuat user");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User berhasil dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengubah status");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status user diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
        <AlertCircle className="h-4 w-4" />
        {(error as Error).message}
      </div>
    );
  }

  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manajemen Pengguna</h2>
          <p className="text-xs text-muted-foreground">
            Tambah, edit, atau nonaktifkan pengguna aplikasi
          </p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Tambah User
        </Button>
      </div>

      {/* Users table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nama</th>
              <th className="text-left font-medium px-3 py-2">Username</th>
              <th className="text-left font-medium px-3 py-2">Role</th>
              <th className="text-left font-medium px-3 py-2 hidden md:table-cell">
                Fitur
              </th>
              <th className="text-center font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  Belum ada pengguna. Tambah user pertama.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t hover:bg-slate-50 dark:hover:bg-slate-900/40"
                >
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">@{u.username}</td>
                  <td className="px-3 py-2">
                    {u.role === "admin" ? (
                      <Badge
                        variant="outline"
                        className="text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-mono text-[10px]"
                      >
                        <Shield className="h-2.5 w-2.5 mr-1" /> ADMIN
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-mono text-[10px]"
                      >
                        <UserIcon className="h-2.5 w-2.5 mr-1" /> USER
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {u.role === "admin" ? (
                      <span className="text-[11px] text-muted-foreground italic">
                        Semua fitur (admin)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.enabledFeatures.length === 0 ? (
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                            Tidak ada akses
                          </span>
                        ) : (
                          u.enabledFeatures.map((f) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-[10px] font-mono"
                            >
                              {(FEATURE_LABELS as Record<string, string>)[f] || f}
                            </Badge>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: u.id,
                          isActive: u.isActive,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        u.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {u.isActive ? "AKTIF" : "NONAKTIF"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(u)}
                        className="h-7 w-7 p-0"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus user "${u.name}" (@${u.username})? Tindakan ini tidak bisa dibatalkan.`,
                            )
                          ) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit dialog */}
      {(creating || editing) && (
        <UserFormDialog
          user={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// User Form Dialog (create or edit)
// ============================================================

interface UserFormDialogProps {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserFormDialog({ user, onClose, onSaved }: UserFormDialogProps) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">(
    (user?.role as "admin" | "user") ?? "user",
  );
  const [features, setFeatures] = useState<string[]>(user?.enabledFeatures ?? []);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For admin role: features are ignored (admin has full access).
  // We still keep the array but disable the checkboxes visually.
  useEffect(() => {
    if (role === "admin") setFeatures([]);
  }, [role]);

  function toggleFeature(key: string) {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/users/${user!.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        name,
        username,
        role,
        enabledFeatures: features,
        isActive,
      };
      // For edit: password optional (only update if provided)
      // For create: password required
      if (isEdit) {
        if (password) body.password = password;
      } else {
        if (!password) throw new Error("Password wajib diisi");
        body.password = password;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success(isEdit ? "User diperbarui" : "User ditambahkan");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uf-name">Nama</Label>
            <Input
              id="uf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf-username">Username</Label>
            <Input
              id="uf-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf-password">
              Password{" "}
              {isEdit && (
                <span className="text-[11px] text-muted-foreground">
                  (kosongkan jika tidak ingin mengubah)
                </span>
              )}
            </Label>
            <Input
              id="uf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              autoComplete="new-password"
              placeholder={isEdit ? "••••••••" : "min. 6 karakter"}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  role === "user"
                    ? "border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-xs font-medium">User</div>
                  <div className="text-[10px] text-muted-foreground">
                    Akses terbatas
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  role === "admin"
                    ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40"
                    : "border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                <Shield className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-xs font-medium">Admin</div>
                  <div className="text-[10px] text-muted-foreground">
                    Akses penuh
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Feature permissions (only meaningful for role=user) */}
          <div className="space-y-2">
            <Label>Fitur yang Dapat Diakses</Label>
            {role === "admin" ? (
              <div className="text-[11px] text-muted-foreground italic bg-muted/40 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                Admin selalu memiliki akses ke semua fitur.
              </div>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground">
                  Pilih fitur yang dapat diakses oleh pengguna ini. Pengguna
                  hanya akan melihat tab yang dicentang.
                </p>
                <div className="grid grid-cols-2 gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                  {ALL_FEATURE_KEYS.map((key) => {
                    const checked = features.includes(key);
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${
                          checked
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFeature(key)}
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            checked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </button>
                        <span>{(FEATURE_LABELS as Record<string, string>)[key]}</span>
                      </label>
                    );
                  })}
                </div>
                {features.length === 0 && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Tidak ada fitur dipilih — user tidak akan melihat tab apa
                    pun.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  isActive
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  !isActive
                    ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                Nonaktif
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-1" /> Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" /> Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
