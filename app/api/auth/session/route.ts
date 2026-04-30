// app/api/auth/session/route.ts
//
// Endpoint que le frontend appelle pour savoir si l'utilisateur
// est connecté. Si la session existe mais le profil Steam (nom/avatar)
// est manquant — ça arrive si la clé API n'était pas en place au moment
// du login — on le rafraîchit à la volée et on persiste dans le cookie.

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getSteamProfile } from "@/lib/steam/steamApi";
import { isSetupComplete } from "@/lib/localConfig";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn || !session.steamid) {
    return NextResponse.json({ isLoggedIn: false });
  }

  // Refresh paresseux : si on n'a pas le nom (ou qu'on a le fallback
  // legacy) et qu'on a une clé API, on récupère le profil maintenant.
  const needsRefresh = !session.name || session.name === "Joueur Steam";
  if (needsRefresh && isSetupComplete()) {
    try {
      const profile = await getSteamProfile(session.steamid);
      if (profile?.personaname) {
        session.name = profile.personaname;
        session.avatar = profile.avatarfull;
        session.profileurl = profile.profileurl;
        await session.save();
      }
    } catch (e) {
      console.error("[session] profile refresh failed:", e);
    }
  }

  return NextResponse.json({
    isLoggedIn: true,
    steamid: session.steamid,
    name: session.name,
    avatar: session.avatar,
    profileurl: session.profileurl,
  });
}
