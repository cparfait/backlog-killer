// app/api/library/game/[appid]/route.ts
//
// Renvoie la fiche complète (Steam Store + HLTB + OpenCritic) d'un
// jeu donné par son appid, à condition qu'il appartienne bien à la
// bibliothèque de l'utilisateur connecté.

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import {
  getOwnedGames,
  getGameDetails,
} from "@/lib/steam/steamApi";
import { getHowLongToBeat } from "@/lib/enrichment/howlongtobeat";
import { getOpenCriticScore } from "@/lib/enrichment/opencritic";
import { isSetupComplete } from "@/lib/localConfig";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appid: string }> }
) {
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

  const { appid: appidStr } = await params;
  const appid = Number(appidStr);
  if (!Number.isInteger(appid) || appid <= 0) {
    return NextResponse.json({ error: "appid invalide" }, { status: 400 });
  }

  let games;
  try {
    games = await getOwnedGames(session.steamid);
  } catch (error) {
    console.error("[game] getOwnedGames failed:", error);
    return NextResponse.json(
      { error: "Bibliothèque inaccessible", code: "library_inaccessible" },
      { status: 502 }
    );
  }

  const owned = games.find((g) => g.appid === appid);
  if (!owned) {
    return NextResponse.json(
      { error: "Jeu non trouvé dans ta bibliothèque" },
      { status: 404 }
    );
  }

  let details;
  try {
    details = await getGameDetails(appid, owned.playtime_forever);
  } catch (error) {
    console.error("[game] getGameDetails failed:", error);
    return NextResponse.json(
      { error: "Détails introuvables sur le Steam Store" },
      { status: 502 }
    );
  }

  const [hltbResult, opencriticResult] = await Promise.allSettled([
    getHowLongToBeat(details.name),
    getOpenCriticScore(details.name),
  ]);

  const hltb =
    hltbResult.status === "fulfilled"
      ? hltbResult.value
      : { mainStory: null, mainExtra: null, completionist: null };

  const opencritic =
    opencriticResult.status === "fulfilled"
      ? opencriticResult.value
      : { score: null, tier: null, reviewCount: null };

  return NextResponse.json({
    game: details,
    hltb,
    opencritic,
    totalGames: games.length,
    poolSize: games.length,
  });
}
