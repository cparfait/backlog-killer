// app/api/library/route.ts
//
// Renvoie la liste complète des jeux (nom + appid + temps de jeu).
// Utilisé par la page bibliothèque pour afficher tous les jeux.

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getOwnedGames } from "@/lib/steam/steamApi";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    const games = await getOwnedGames(session.steamid);

    // On trie par temps de jeu décroissant
    const sorted = games.sort(
      (a, b) => b.playtime_forever - a.playtime_forever
    );

    return NextResponse.json({ games: sorted, total: sorted.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}