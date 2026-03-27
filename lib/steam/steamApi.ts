// lib/steam/steamApi.ts
//
// Ce fichier est le "client" de l'API Web Steam.
// Il expose des fonctions simples que le reste de l'app appellera
// sans avoir à connaître les détails des URLs et paramètres Steam.

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_BASE = "https://store.steampowered.com/api";

// Structure d'un jeu tel que renvoyé par Steam
export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;    // Temps de jeu total en minutes
  img_icon_url: string;        // Hash de l'icône (petite taille)
  has_community_visible_stats: boolean;
}

// Structure enrichie d'un jeu (ce qu'on affiche dans la Fiche)
export interface GameDetails {
  appid: number;
  name: string;
  headerImage: string;         // Jaquette HD
  description: string;         // Résumé du jeu
  genres: string[];            // Ex: ["Action", "RPG"]
  tags: string[];              // Tags communautaires
  metacriticScore: number | null;
  releaseDate: string;
  developers: string[];
  playtimeForever: number;     // Temps de jeu du joueur (minutes)
}

// Récupère toute la bibliothèque Steam d'un joueur
export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const apiKey = process.env.STEAM_API_KEY;
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;

  const res = await fetch(url, {
    // On désactive le cache Next.js pour toujours avoir
    // la bibliothèque à jour
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erreur API Steam: ${res.status}`);
  }

  const data = await res.json();

  // Si le profil est privé, Steam renvoie un objet vide
  if (!data.response?.games) {
    throw new Error("Bibliothèque inaccessible — profil probablement privé");
  }

  return data.response.games as SteamGame[];
}

// Tire un jeu au hasard dans la bibliothèque
export function pickRandomGame(games: SteamGame[]): SteamGame {
  const index = Math.floor(Math.random() * games.length);
  return games[index];
}

// Récupère les détails d'un jeu depuis le Steam Store API
export async function getGameDetails(
  appid: number,
  playtimeForever: number
): Promise<GameDetails> {
  const url = `${STEAM_STORE_BASE}/appdetails?appids=${appid}&l=french`;

  const res = await fetch(url, {
    // Cache 1 heure — les détails d'un jeu ne changent pas souvent
    next: { revalidate: 3600 },
  });

  const data = await res.json();
  const game = data[appid.toString()]?.data;

  if (!game) {
    throw new Error(`Détails introuvables pour l'appid ${appid}`);
  }

  return {
    appid,
    name: game.name,
    // URL standard de la jaquette HD Steam
    headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    description: game.short_description || "Aucune description disponible.",
    genres: (game.genres || []).map((g: any) => g.description),
    // Les tags viennent d'un champ différent (categories)
    tags: (game.categories || []).map((c: any) => c.description).slice(0, 5),
    metacriticScore: game.metacritic?.score ?? null,
    releaseDate: game.release_date?.date || "Date inconnue",
    developers: game.developers || [],
    playtimeForever,
  };
}