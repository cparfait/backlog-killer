// app/api/auth/login/route.ts
// Redirige le navigateur vers la page de connexion Steam OpenID.

import { NextResponse } from "next/server";
import { buildSteamLoginUrl } from "@/lib/steam/steamProvider";

export async function GET() {
  return NextResponse.redirect(buildSteamLoginUrl());
}
