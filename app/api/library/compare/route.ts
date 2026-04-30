import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import {
  getOwnedGames,
  getSteamProfile,
  getStorePrices,
  SteamGame,
} from "@/lib/steam/steamApi";
import { isSetupComplete } from "@/lib/localConfig";

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

  const friendId = request.nextUrl.searchParams.get("steamid")?.trim() ?? "";
  if (!/^\d{17}$/.test(friendId)) {
    return NextResponse.json(
      {
        error: "SteamID invalide (17 chiffres attendus, ex. 76561198…)",
        code: "invalid_id",
      },
      { status: 400 }
    );
  }
  if (friendId === session.steamid) {
    return NextResponse.json(
      { error: "C'est ton propre SteamID", code: "self" },
      { status: 400 }
    );
  }

  const [meGames, friendGames, meProfile, friendProfile] = await Promise.all([
    getOwnedGames(session.steamid).catch((e) => {
      console.error("[compare] me games:", e);
      return null;
    }),
    getOwnedGames(friendId).catch((e) => {
      console.error("[compare] friend games:", e);
      return null;
    }),
    getSteamProfile(session.steamid).catch(() => null),
    getSteamProfile(friendId).catch(() => null),
  ]);

  if (!meGames) {
    return NextResponse.json(
      { error: "Ta bibliothèque est inaccessible", code: "me_private" },
      { status: 502 }
    );
  }
  if (!friendGames) {
    return NextResponse.json(
      {
        error: "La bibliothèque de cet ami est privée ou injoignable",
        code: "friend_private",
      },
      { status: 502 }
    );
  }

  const mePlaytime = meGames.reduce((acc, g) => acc + g.playtime_forever, 0);
  const friendPlaytime = friendGames.reduce((acc, g) => acc + g.playtime_forever, 0);

  let meCost: { totalCents: number; totalFormatted: string; currency: string } | null = null;
  let friendCost: { totalCents: number; totalFormatted: string; currency: string } | null = null;

  try {
    const [mePriceMap, friendPriceMap] = await Promise.all([
      getStorePrices(meGames.map((g) => g.appid)),
      getStorePrices(friendGames.map((g) => g.appid)),
    ]);

    let meCents = 0, meCurrency = "EUR";
    for (const g of meGames) {
      const p = mePriceMap.get(g.appid);
      if (p && !p.isFree) { meCents += p.finalCents; meCurrency = p.currency; }
    }
    meCost = { totalCents: meCents, totalFormatted: formatPrice(meCents, meCurrency), currency: meCurrency };

    let fCents = 0, fCurrency = "EUR";
    for (const g of friendGames) {
      const p = friendPriceMap.get(g.appid);
      if (p && !p.isFree) { fCents += p.finalCents; fCurrency = p.currency; }
    }
    friendCost = { totalCents: fCents, totalFormatted: formatPrice(fCents, fCurrency), currency: fCurrency };
  } catch (e) {
    console.error("[compare] price calculation failed:", e);
  }

  const meMap = new Map<number, SteamGame>(
    meGames.map((g) => [g.appid, g])
  );
  const common = friendGames
    .filter((g) => meMap.has(g.appid))
    .map((friendGame) => {
      const mine = meMap.get(friendGame.appid)!;
      return {
        appid: friendGame.appid,
        name: friendGame.name || mine.name,
        myPlaytime: mine.playtime_forever,
        friendPlaytime: friendGame.playtime_forever,
      };
    })
    .sort(
      (a, b) =>
        b.myPlaytime + b.friendPlaytime - (a.myPlaytime + a.friendPlaytime)
    );

  return NextResponse.json({
    me: {
      steamid: session.steamid,
      name: meProfile?.personaname ?? session.name ?? "Toi",
      avatar: meProfile?.avatarfull ?? session.avatar ?? "",
      total: meGames.length,
      totalPlaytimeMinutes: mePlaytime,
      cost: meCost,
    },
    friend: {
      steamid: friendId,
      name: friendProfile?.personaname ?? "Ami",
      avatar: friendProfile?.avatarfull ?? "",
      total: friendGames.length,
      totalPlaytimeMinutes: friendPlaytime,
      cost: friendCost,
    },
    common,
  });
}
