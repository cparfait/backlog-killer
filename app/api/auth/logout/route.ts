// app/api/auth/logout/route.ts
// Détruit la session et redirige vers l'accueil.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

async function destroy(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.destroy();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  return destroy(request);
}

// GET supporté pour permettre le logout via simple lien.
// SameSite=lax sur le cookie protège contre le CSRF cross-site.
export async function GET(request: NextRequest) {
  return destroy(request);
}
