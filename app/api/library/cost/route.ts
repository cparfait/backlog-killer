// app/api/library/cost/route.ts
//
// Calcule le coût total actuel de la collection Steam : on récupère
// les prix actuels de tous les jeux possédés (en lots de 50) et on
// somme. Les jeux gratuits sont comptés à 0. Les jeux dont le prix
// est introuvable (retirés du store, freeware tiers...) sont comptés
// à part.

import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { getOwnedGames, getStorePrices } from "@/lib/steam/steamApi";
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

  let games;
  try {
    games = await getOwnedGames(session.steamid);
  } catch (error) {
    console.error("[cost] getOwnedGames failed:", error);
    return NextResponse.json(
      {
        error: "Bibliothèque inaccessible — profil probablement privé",
        code: "library_inaccessible",
      },
      { status: 502 }
    );
  }

  const appids = games.map((g) => g.appid);
  const priceMap = await getStorePrices(appids);

  let totalCents = 0;
  let currency = "EUR";
  let priced = 0;
  let free = 0;
  let unknown = 0;

  for (const appid of appids) {
    const p = priceMap.get(appid);
    if (!p) {
      unknown++;
      continue;
    }
    if (p.isFree) {
      free++;
      continue;
    }
    totalCents += p.finalCents;
    currency = p.currency;
    priced++;
  }

  // Détail par jeu — utilisé côté UI pour trier par prix.
  const breakdown = games.map((g) => {
    const p = priceMap.get(g.appid);
    return {
      appid: g.appid,
      name: g.name,
      playtime_forever: g.playtime_forever,
      finalCents: p?.isFree ? 0 : p?.finalCents ?? null,
      formatted: p?.isFree ? "Gratuit" : p?.formatted ?? null,
      isFree: p?.isFree ?? false,
    };
  });

  return NextResponse.json({
    totalCents,
    totalFormatted: formatPrice(totalCents, currency),
    currency,
    counts: {
      total: games.length,
      priced,
      free,
      unknown,
    },
    games: breakdown,
  });
}

function formatPrice(cents: number, currency: string): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}
