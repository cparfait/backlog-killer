"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface GameDetails {
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
}

interface HLTBData {
  mainStory: number | null;
  mainExtra: number | null;
  completionist: number | null;
}

interface OpenCriticData {
  score: number | null;
  tier: string | null;
  reviewCount: number | null;
}

interface RandomResult {
  game: GameDetails;
  hltb: HLTBData;
  opencritic: OpenCriticData;
  totalGames: number;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
}

function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "Jamais joué";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}`;
}

function scoreColor(score: number | null): string {
  if (!score) return "text-gray-500";
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  return "text-red-400";
}

export default function LibraryPage() {
  const router = useRouter();
  const [result, setResult] = useState<RandomResult | null>(null);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [search, setSearch] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandom = async () => {
    setLoadingRandom(true);
    setError(null);
    try {
      const res = await fetch("/api/library/random");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingRandom(false);
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setGames(data.games || []);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    fetchRandom();
    fetchLibrary();
  }, []);

  const filteredGames = games.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">

      <header className="bg-[#0f1117] border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
          {"<-"} Accueil
        </a>
        <h1 className="text-xl font-bold">🎮 Backlog Killer</h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Fiche découverte</h2>
            <button
              onClick={fetchRandom}
              disabled={loadingRandom}
              className="text-sm text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-3 py-1 rounded-lg transition-colors disabled:opacity-40"
            >
              🎲 Autre jeu
            </button>
          </div>

          {loadingRandom ? (
            <div className="bg-[#1a1f2e] rounded-2xl h-96 flex items-center justify-center">
              <p className="text-gray-500 animate-pulse">Tirage en cours...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950 border border-red-800 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-2">⚠️ {error}</p>
              <p className="text-gray-500 text-sm">
                Vérifie que ton profil Steam est bien en mode Public.
              </p>
            </div>
          ) : result ? (
            <div className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-800">

              <div className="relative w-full aspect-[460/215]">
                <Image
                  src={result.game.headerImage}
                  alt={result.game.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="p-5 space-y-4">

                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {result.game.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {result.game.developers.join(", ")} · {result.game.releaseDate}
                  </p>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {result.game.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {[...result.game.genres, ...result.game.tags]
                    .slice(0, 6)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#0f1117] border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0f1117] rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${scoreColor(result.opencritic.score)}`}>
                      {result.opencritic.score ?? "—"}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">OpenCritic</p>
                    {result.opencritic.tier && (
                      <p className="text-gray-600 text-xs">{result.opencritic.tier}</p>
                    )}
                  </div>

                  <div className="bg-[#0f1117] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {result.hltb.mainStory ? `${result.hltb.mainStory}h` : "—"}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Histoire</p>
                  </div>

                  <div className="bg-[#0f1117] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {formatPlaytime(result.game.playtimeForever)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">Ton temps</p>
                  </div>
                </div>

                <button
                  onClick={fetchRandom}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-lg py-4 rounded-xl transition-all duration-150"
                >
                  🎲 Nouveau tirage
                </button>

                
                  <a href={`https://store.steampowered.com/app/${result.game.appid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  Voir sur Steam Store
                </a>

              </div>
            </div>
          ) : null}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Ta bibliothèque
              {result && (
                <span className="text-gray-500 font-normal text-sm ml-2">
                  ({result.totalGames} jeux)
                </span>
              )}
            </h2>
          </div>

          <input
            type="text"
            placeholder="🔍 Rechercher un jeu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1f2e] border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-blue-600 transition-colors"
          />

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loadingLibrary ? (
              <div className="text-gray-500 text-sm text-center py-8 animate-pulse">
                Chargement de ta bibliothèque...
              </div>
            ) : (
              filteredGames.map((game) => (
                <div
                  key={game.appid}
                  className="flex items-center gap-3 bg-[#1a1f2e] hover:bg-[#232940] border border-gray-800 rounded-xl px-4 py-3 transition-colors group"
                >
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_sm_120.jpg`}
                    alt={game.name}
                    className="w-12 h-6 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                      {game.name}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {formatPlaytime(game.playtime_forever)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {!loadingLibrary && filteredGames.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                Aucun jeu trouvé pour &quot;{search}&quot;
              </p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}