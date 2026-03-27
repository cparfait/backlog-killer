// app/api/auth/session/route.ts
//
// Endpoint que le frontend appellera pour savoir si l'utilisateur
// est connecté et récupérer ses infos de profil.

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false });
  }

  return NextResponse.json({
    isLoggedIn: true,
    steamid: session.steamid,
    name: session.name,
    avatar: session.avatar,
    profileurl: session.profileurl,
  });
}