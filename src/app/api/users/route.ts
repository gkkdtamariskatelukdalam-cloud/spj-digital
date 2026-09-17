import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authOptions, ALL_FEATURE_KEYS } from "@/lib/auth";

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
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
    // Parse enabledFeatures from JSON string → array for client convenience
    const parsed = users.map((u) => ({
      ...u,
      enabledFeatures: safeParseFeatures(u.enabledFeatures),
    }));
    return NextResponse.json({ users: parsed });
  } catch (e) {
    console.error("GET /api/users error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/users — create new user (admin only)
export async function POST(req: Request) {
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

    if (!name?.trim() || !username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Nama, username, dan password wajib diisi" },
        { status: 400 },
      );
    }
    if (role && !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Role harus 'admin' atau 'user'" },
        { status: 400 },
      );
    }

    // Check username uniqueness
    const existing = await db.user.findUnique({
      where: { username: username.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username sudah dipakai" },
        { status: 409 },
      );
    }

    // Validate & sanitize enabledFeatures
    const safeFeatures = (enabledFeatures ?? []).filter((f) =>
      (ALL_FEATURE_KEYS as readonly string[]).includes(f),
    );

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashed,
        role: role === "admin" ? "admin" : "user",
        enabledFeatures: JSON.stringify(safeFeatures),
        isActive: isActive ?? true,
      },
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
      user: { ...user, enabledFeatures: safeParseFeatures(user.enabledFeatures) },
    });
  } catch (e) {
    console.error("POST /api/users error:", e);
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
