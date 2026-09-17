import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authOptions, ALL_FEATURE_KEYS } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id] — fetch single user (admin only)
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        enabledFeatures: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      user: { ...user, enabledFeatures: safeParseFeatures(user.enabledFeatures) },
    });
  } catch (e) {
    console.error("GET /api/users/[id] error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// PUT /api/users/[id] — update user (admin only)
// Body fields (all optional except metadata):
//   - name, username, role, enabledFeatures, isActive
//   - password (optional; if provided, will be re-hashed)
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, username, password, role, enabledFeatures, isActive } =
      body as {
        name?: string;
        username?: string;
        password?: string;
        role?: string;
        enabledFeatures?: string[];
        isActive?: boolean;
      };

    // Build update payload (only fields provided)
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (typeof username === "string" && username.trim()) {
      // uniqueness check (excluding current id)
      const exists = await db.user.findUnique({
        where: { username: username.trim() },
      });
      if (exists && exists.id !== params.id) {
        return NextResponse.json(
          { error: "Username sudah dipakai" },
          { status: 409 },
        );
      }
      update.username = username.trim();
    }
    if (typeof password === "string" && password.trim()) {
      update.password = await bcrypt.hash(password, 10);
    }
    if (role === "admin" || role === "user") update.role = role;
    if (Array.isArray(enabledFeatures)) {
      const safe = enabledFeatures.filter((f) =>
        (ALL_FEATURE_KEYS as readonly string[]).includes(f),
      );
      update.enabledFeatures = JSON.stringify(safe);
    }
    if (typeof isActive === "boolean") update.isActive = isActive;

    const updated = await db.user.update({
      where: { id: params.id },
      data: update,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        enabledFeatures: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      user: {
        ...updated,
        enabledFeatures: safeParseFeatures(updated.enabledFeatures),
      },
    });
  } catch (e) {
    console.error("PUT /api/users/[id] error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id] — delete user (admin only)
// Guard: cannot delete the last remaining admin
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = await db.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Prevent deleting the last admin
    if (target.role === "admin") {
      const adminCount = await db.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Tidak bisa menghapus admin terakhir" },
          { status: 400 },
        );
      }
    }
    // Prevent self-deletion
    if (target.id === (session.user as any).id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 },
      );
    }
    await db.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/users/[id] error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

function safeParseFeatures(s: string): string[] {
  try {
    const parsed = JSON.parse(s || "[]");
    if (Array.isArray(parsed)) {
      return parsed.filter((f) => typeof f === "string");
    }
  } catch {
    /* ignore */
  }
  return [];
}
