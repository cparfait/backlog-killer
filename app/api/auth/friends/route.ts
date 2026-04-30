// app/api/auth/friends/route.ts
//
// Renvoie la liste d'amis Steam de l'utilisateur connecté, enrichie
// avec les noms et avatars. Nécessite que la liste d'amis du joueur
// soit publique côté Steam (sinon 401).

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getFriends } from "@/lib/steam/steamApi";
import { isSetupComplete } from "@/lib/localConfig";

export async function GET() {
  if (!isSetupComplete()) {
    return NextResponse.json(
      { error: "Setup requis", code: "setup_required" },
      { status: 503 }
    );
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn || !session.steamid) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    const friends = await getFriends(session.steamid);
    return NextResponse.json({ friends });
  } catch (e) {
    console.error("[friends] failed:", e);
    const message = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json(
      {
        error: message,
        code: /privée|priv/i.test(message)
          ? "friends_private"
          : "friends_error",
      },
      { status: 502 }
    );
  }
}
