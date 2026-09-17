"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, User as UserIcon, Shield } from "lucide-react";
import { ProfileEditor } from "./profile-editor";

interface UserMenuProps {
  user: {
    name?: string | null;
    username?: string;
    role?: string;
  };
}

/**
 * Top-right user menu: shows username + role badge, dropdown with
 * "Profil Saya" and "Keluar" actions.
 *
 * The role badge is color-coded: admin = rose, user = slate.
 */
export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = user.role === "admin";
  const displayName = user.name || user.username || "User";

  async function handleLogout() {
    await signOut({ redirect: false });
    // Reload to clear any cached server data and show login modal again
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${
              isAdmin
                ? "bg-gradient-to-br from-rose-600 to-amber-500"
                : "bg-gradient-to-br from-slate-600 to-slate-500"
            }`}
          >
            {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
              {displayName}
            </div>
            <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">
              @{user.username || "—"}
            </div>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {open && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-sm font-semibold truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  @{user.username}
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      isAdmin
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isAdmin ? <Shield className="h-2.5 w-2.5" /> : <UserIcon className="h-2.5 w-2.5" />}
                    {isAdmin ? "ADMIN" : "USER"}
                  </span>
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    setProfileOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Profil Saya
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ProfileEditor
        open={profileOpen}
        onOpenChange={setProfileOpen}
        initialName={user.name || ""}
        initialUsername={user.username || ""}
        onUpdated={() => {
          // Force reload to refresh the session (name/username come from JWT)
          if (typeof window !== "undefined") window.location.reload();
        }}
      />
    </>
  );
}
