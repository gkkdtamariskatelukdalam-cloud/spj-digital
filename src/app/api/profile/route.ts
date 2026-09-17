import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// PUT /api/profile — self-service update of own profile
// Authenticated users (admin OR user) can update their own:
//   - name
//   - username (must remain unique)
//   - password (must provide currentPassword to confirm; optional update)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;
    const body = await req.json();
    const { name, username, currentPassword, newPassword } = body as {
      name?: string;
      username?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    // Fetch the user's current password hash (to verify currentPassword
    // when password change is requested).
    const me = await db.user.findUnique({ where: { id: userId } });
    if (!me) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) {
      update.name = name.trim();
    }
    if (typeof username === "string" && username.trim() && username.trim() !== me.username) {
      // Check uniqueness against other users
      const existing = await db.user.findUnique({
        where: { username: username.trim() },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { error: "Username sudah dipakai" },
          { status: 409 },
        );
      }
      update.username = username.trim();
    }

    // Password change requires currentPassword to be confirmed
    if (typeof newPassword === "string" && newPassword.trim()) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Password saat ini wajib diisi untuk mengganti password" },
          { status: 400 },
        );
      }
      const ok = await bcrypt.compare(currentPassword, me.password);
      if (!ok) {
        return NextResponse.json(
          { error: "Password saat ini salah" },
          { status: 400 },
        );
      }
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 },
        );
      }
      update.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada perubahan untuk disimpan" },
        { status: 400 },
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch (e) {
    console.error("PUT /api/profile error:", e);
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 },
    );
  }
}
