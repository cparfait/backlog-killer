// lib/steam/steamApi.ts
// Client de l'API Web Steam (côté serveur uniquement — la clé API ne
// doit JAMAIS être exposée au navigateur).

import { getSteamApiKey } from "../localConfig";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_BASE = "https://store.steampowered.com/api";

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  has_community_visible_stats: boolean;
}

export interface PriceOverview {
  finalCents: number;       // prix actuel en centimes (après remise)
  initialCents: number;     // prix avant remise (= final s'il n'y en a pas)
  discountPercent: number;  // 0..100
  currency: string;         // "EUR", "USD"...
  formatted: string;        // "19,99€" / "Gratuit"
  isFree: boolean;
}

export interface GameMovie {
  mp4: string | null;
  webm: string | null;
  thumbnail: string;
}

export interface GameDetails {
  appid: number;
  name: string;
  headerImage: string;
  description: string;
  genres: string[];
  tags: string[];
  metacriticScore: number | null;
  releaseDate: string;
  developers: string[];
  playtimeForever: number;
  screenshots: string[];
  movies: GameMovie[];
  price: PriceOverview | null;
}

function parsePriceOverview(
  rawPrice: {
    final?: number;
    initial?: number;
    discount_percent?: number;
    currency?: string;
    final_formatted?: string;
  } | undefined,
  isFree: boolean
): PriceOverview | null {
  if (isFree) {
    return {
      finalCents: 0,
      initialCents: 0,
      discountPercent: 0,
      currency: "EUR",
      formatted: "Gratuit",
      isFree: true,
    };
  }
  if (!rawPrice) return null;
  return {
    finalCents: rawPrice.final ?? 0,
    initialCents: rawPrice.initial ?? rawPrice.final ?? 0,
    discountPercent: rawPrice.discount_percent ?? 0,
    currency: rawPrice.currency ?? "EUR",
    formatted: rawPrice.final_formatted ?? "—",
    isFree: false,
  };
}

function getApiKey(): string {
  const apiKey = getSteamApiKey();
  if (!apiKey) {
    throw new Error("Setup requis — clé API Steam manquante");
  }
  return apiKey;
}

export interface SteamProfile {
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export interface Friend {
  steamid: string;
  name: string;
  avatar: string;
  friendSince: number; // timestamp Unix (0 si inconnu)
}

// Récupère la liste d'amis du joueur, enrichie avec les noms et
// avatars (via GetPlayerSummaries en batchs de 100).
// Throw si Steam refuse l'accès (liste d'amis privée).
export async function getFriends(steamId: string): Promise<Friend[]> {
  assertValidSteamId(steamId);
  const apiKey = getApiKey();

  const friendsUrl = `${STEAM_API_BASE}/ISteamUser/GetFriendList/v0001/?key=${encodeURIComponent(
    apiKey
  )}&steamid=${steamId}&relationship=friend`;

  const friendsRes = await fetch(friendsUrl, { cache: "no-store" });
  if (friendsRes.status === 401) {
    throw new Error("Ta liste d'amis Steam est privée");
  }
  if (!friendsRes.ok) {
    throw new Error(`Steam API ${friendsRes.status}`);
  }

  const friendsData = await friendsRes.json();
  const rawFriends = (friendsData?.friendslist?.friends ?? []) as Array<{
    steamid: string;
    friend_since?: number;
  }>;
  if (rawFriends.length === 0) return [];

  // Lookup des profils par batchs de 100 (limite Steam).
  const profiles = new Map<
    string,
    { personaname: string; avatarfull: string }
  >();
  for (let i = 0; i < rawFriends.length; i += 100) {
    const batch = rawFriends.slice(i, i + 100);
    const ids = batch.map((f) => f.steamid).join(",");
    const profilesRes = await fetch(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(
        apiKey
      )}&steamids=${ids}`,
      { cache: "no-store" }
    );
    if (!profilesRes.ok) continue;
    const pData = await profilesRes.json();
    for (const player of (pData?.response?.players ?? []) as Array<{
      steamid: string;
      personaname: string;
      avatarfull: string;
    }>) {
      profiles.set(player.steamid, {
        personaname: player.personaname,
        avatarfull: player.avatarfull,
      });
    }
  }

  return rawFriends
    .map((f): Friend => {
      const p = profiles.get(f.steamid);
      return {
        steamid: f.steamid,
        name: p?.personaname ?? "Joueur Steam",
        avatar: p?.avatarfull ?? "",
        friendSince: f.friend_since ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

// Récupère le profil public Steam d'un utilisateur (nom, avatar, URL).
// Renvoie null si l'API ne répond pas ou si le profil est introuvable.
export async function getSteamProfile(
  steamId: string
): Promise<SteamProfile | null> {
  assertValidSteamId(steamId);
  const apiKey = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(
    apiKey
  )}&steamids=${steamId}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) return null;

  return {
    personaname: player.personaname ?? "",
    avatarfull: player.avatarfull ?? "",
    profileurl: player.profileurl ?? "",
  };
}

// SteamID64 = 17 chiffres (commence par 7656…). On valide pour éviter
// d'injecter des caractères arbitraires dans l'URL d'appel API.
function assertValidSteamId(steamId: string) {
  if (!/^\d{17}$/.test(steamId)) {
    throw new Error("SteamID invalide");
  }
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  assertValidSteamId(steamId);
  const apiKey = getApiKey();
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
    apiKey
  )}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Steam API ${res.status}`);
  }

  const data = await res.json();
  if (!data?.response?.games) {
    throw new Error("Bibliothèque vide ou profil privé");
  }
  return data.response.games as SteamGame[];
}

export function pickRandomGame(games: SteamGame[]): SteamGame {
  if (games.length === 0) throw new Error("Bibliothèque vide");
  // crypto.getRandomValues pour un tirage uniforme et imprévisible
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const index = buf[0] % games.length;
  return games[index];
}

export async function getGameDetails(
  appid: number,
  playtimeForever: number
): Promise<GameDetails> {
  if (!Number.isInteger(appid) || appid <= 0) {
    throw new Error("appid invalide");
  }
  const url = `${STEAM_STORE_BASE}/appdetails?appids=${appid}&l=french`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Steam Store ${res.status}`);

  const data = await res.json();
  const entry = data?.[appid.toString()];
  if (!entry?.success || !entry.data) {
    throw new Error(`Détails introuvables pour appid ${appid}`);
  }
  const game = entry.data;

  return {
    appid,
    name: game.name,
    headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    description: game.short_description || "Aucune description disponible.",
    genres: (game.genres || []).map((g: { description: string }) => g.description),
    tags: (game.categories || [])
      .map((c: { description: string }) => c.description)
      .slice(0, 5),
    metacriticScore: game.metacritic?.score ?? null,
    releaseDate: game.release_date?.date || "Date inconnue",
    developers: game.developers || [],
    playtimeForever,
    screenshots: (game.screenshots || [])
      .slice(0, 6)
      .map((s: { path_full: string }) => s.path_full),
    movies: (game.movies || [])
      .slice(0, 1)
      .map((m: {
        mp4?: { max?: string };
        webm?: { max?: string };
        thumbnail: string;
      }) => ({
        mp4: m.mp4?.max ?? null,
        webm: m.webm?.max ?? null,
        thumbnail: m.thumbnail,
      })),
    price: parsePriceOverview(game.price_overview, !!game.is_free),
  };
}

// Récupère les prix de plusieurs jeux d'un coup en passant des
// appids séparés par des virgules à appdetails avec filters=price_overview.
// Steam tolère plusieurs appids sur cet endpoint UNIQUEMENT avec ce filtre.
export async function getStorePrices(
  appids: number[],
  cc = "fr"
): Promise<Map<number, PriceOverview | null>> {
  const result = new Map<number, PriceOverview | null>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < appids.length; i += BATCH_SIZE) {
    const batch = appids.slice(i, i + BATCH_SIZE);
    const url = `${STEAM_STORE_BASE}/appdetails?appids=${batch.join(
      ","
    )}&filters=price_overview&cc=${encodeURIComponent(cc)}&l=french`;

    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
      if (!res.ok) continue;
      const data = await res.json();
      for (const appid of batch) {
        const entry = data?.[appid.toString()];
        if (!entry?.success) {
          result.set(appid, null);
          continue;
        }
        const price = parsePriceOverview(entry.data?.price_overview, false);
        result.set(appid, price);
      }
    } catch (e) {
      console.error("[steam] price batch failed:", e);
    }
  }

  return result;
}
