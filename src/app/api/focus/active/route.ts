/**
 * Get Active Focus Session API Route
 * GET /api/focus/active - Get current active session
 */

import { NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";
import { getActiveFocusSession } from "@/lib/db";
import { ensureUserExists } from "@/lib/db/repositories/users";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

async function getDB(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { DB?: D1Database }).DB ?? null;
  } catch {
    try {
      const env = (globalThis as unknown as { env?: { DB?: D1Database } }).env;
      return env?.DB ?? null;
    } catch {
      return null;
    }
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDB();
    if (!db) {
      return NextResponse.json({ session: null });
    }

    // Get the database user ID
    const dbUser = await ensureUserExists(db, session.user.id, {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    const activeSession = await getActiveFocusSession(db, dbUser.id);
    return NextResponse.json({ session: activeSession });
  } catch (error) {
    console.error("GET /api/focus/active error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

