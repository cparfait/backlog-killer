// app/api/library/duel/route.ts
//
// Tire DEUX jeux au hasard pour permettre à l'utilisateur de choisir.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getOwnedGames } from "@/lib/steam/steamApi";
import { isSetupComplete } from "@/lib/localConfig";
import {
  applyPreFilters,
  drawOne,
  parseFiltersFromQuery,
} from "@/lib/steam/drawGame";

export async function GET(request: NextRequest) {
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

  const filters = parseFiltersFromQuery(request.nextUrl.searchParams);

  let games;
  try {
    games = await getOwnedGames(session.steamid);
  } catch (error) {
    console.error("[duel] getOwnedGames failed:", error);
    return NextResponse.json(
      {
        error: "Bibliothèque inaccessible — profil probablement privé",
        code: "library_inaccessible",
      },
      { status: 502 }
    );
  }

  const pool = applyPreFilters(games, filters);
  if (pool.length < 2) {
    return NextResponse.json(
      {
        error: "Pas assez de jeux pour un duel avec ces filtres",
        code: "no_match",
      },
      { status: 404 }
    );
  }

  const first = await drawOne(pool, filters);
  if (!first) {
    return NextResponse.json(
      { error: "Aucun jeu trouvé", code: "no_match" },
      { status: 404 }
    );
  }
  const second = await drawOne(pool, filters, new Set([first.game.appid]));
  if (!second) {
    return NextResponse.json(
      { error: "Un seul jeu trouvé pour le duel", code: "no_match" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    contenders: [first, second],
    totalGames: games.length,
    poolSize: pool.length,
  });
}
