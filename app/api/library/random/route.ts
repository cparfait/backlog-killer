// app/api/library/random/route.ts
//
// C'est l'endpoint central de Backlog Killer.
// Quand le frontend appelle GET /api/library/random, ce code :
// 1. Vérifie que l'utilisateur est connecté
// 2. Récupère toute sa bibliothèque Steam
// 3. Tire un jeu au hasard
// 4. Enrichit ce jeu avec les données Steam Store + HLTB + OpenCritic
// 5. Renvoie une "fiche" complète au frontend

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getOwnedGames, pickRandomGame, getGameDetails } from "@/lib/steam/steamApi";
import { getHowLongToBeat } from "@/lib/enrichment/howlongtobeat";
import { getOpenCriticScore } from "@/lib/enrichment/opencritic";

export async function GET() {
  // Vérifie la session
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  try {
    // 1. Récupère la bibliothèque complète
    const games = await getOwnedGames(session.steamid);

    // 2. Tire un jeu au hasard
    const randomGame = pickRandomGame(games);

    // 3. Récupère les détails Steam Store
    const details = await getGameDetails(
      randomGame.appid,
      randomGame.playtime_forever
    );

    // 4. Enrichissement en parallèle (les deux requêtes partent simultanément)
    // Promise.allSettled ne fait pas échouer si l'une des deux API est indisponible
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

    // 5. Renvoie la fiche complète
    return NextResponse.json({
      game: details,
      hltb,
      opencritic,
      totalGames: games.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur inconnue" },
      { status: 500 }
    );
  }
}