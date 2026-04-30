// app/api/auth/callback/route.ts
//
// Steam redirige l'utilisateur ici avec une assertion OpenID signée.
// On vérifie l'assertion auprès de Steam, on récupère le profil,
// puis on crée une session cookie chiffrée.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { verifySteamAssertion } from "@/lib/steam/steamProvider";
import { getSteamApiKey } from "@/lib/localConfig";
import { getSteamProfile } from "@/lib/steam/steamApi";

export async function GET(request: NextRequest) {
  let steamId: string | null;
  try {
    steamId = await verifySteamAssertion(request.nextUrl.searchParams);
  } catch (e) {
    console.error("[steam-auth] verification error:", e);
    return NextResponse.redirect(new URL("/?error=auth", request.url));
  }

  if (!steamId) {
    return NextResponse.redirect(new URL("/?error=auth", request.url));
  }

  // Si la clé API n'est pas configurée, on envoie au setup
  if (!getSteamApiKey()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let profile = null;
  try {
    profile = await getSteamProfile(steamId);
  } catch (e) {
    console.error("[steam-auth] profile fetch failed:", e);
  }

  if (!profile?.personaname) {
    console.warn(
      "[steam-auth] profil Steam vide pour",
      steamId,
      "— vérifie la clé API et la confidentialité du profil."
    );
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.steamid = steamId;
  session.name = profile?.personaname || "";
  session.avatar = profile?.avatarfull || "";
  session.profileurl = profile?.profileurl || "";
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
