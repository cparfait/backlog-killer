"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────
interface PriceOverview {
  finalCents: number;
  initialCents: number;
  discountPercent: number;
  currency: string;
  formatted: string;
  isFree: boolean;
}

interface GameMovie {
  mp4: string | null;
  webm: string | null;
  thumbnail: string;
}

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
  screenshots: string[];
  movies: GameMovie[];
  price: PriceOverview | null;
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

interface DrawnGame {
  game: GameDetails;
  hltb: HLTBData;
  opencritic: OpenCriticData;
}

interface RandomResult extends DrawnGame {
  totalGames: number;
  poolSize: number;
}

interface DuelResult {
  contenders: [DrawnGame, DrawnGame];
  totalGames: number;
  poolSize: number;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
}

interface Session {
  isLoggedIn: boolean;
  name?: string;
  avatar?: string;
}

type Mode = "solo" | "duel";

interface Filters {
  unplayed: boolean;
  maxHours: 0 | 2 | 10;
  minScore: 0 | 70 | 80;
}

const DEFAULT_FILTERS: Filters = { unplayed: false, maxHours: 0, minScore: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────
function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "Jamais joué";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}`;
}

function scoreColor(score: number | null): string {
  if (!score) return "text-zinc-500";
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-rose-400";
}

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.unplayed) params.set("unplayed", "1");
  if (filters.maxHours > 0) params.set("maxHours", String(filters.maxHours));
  if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
  const q = params.toString();
  return q ? `?${q}` : "";
}

// Steam sert souvent les vidéos en http://, bloqué en mixed content.
function toHttps(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//, "https://");
}

// ─── Roue de la chance ────────────────────────────────────────────────
function SpinningWheel({ games }: { games: SteamGame[] }) {
  const samples = useMemo(() => {
    if (games.length === 0) return [];
    const out: SteamGame[] = [];
    for (let i = 0; i < 16; i++) {
      out.push(games[Math.floor(Math.random() * games.length)]);
    }
    return out;
  }, [games]);

  if (samples.length === 0) {
    return (
      <div className="bg-zinc-900/60 backdrop-blur rounded-3xl h-[420px] flex items-center justify-center border border-zinc-800">
        <p className="text-zinc-500 animate-pulse">Tirage en cours...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 backdrop-blur rounded-3xl border border-zinc-800 overflow-hidden h-[420px] flex flex-col items-center justify-center gap-6 relative">
      <p className="text-zinc-400 text-sm font-medium tracking-wider uppercase animate-pulse">
        🎰 Tirage en cours
      </p>
      <div className="relative w-full max-w-2xl h-32 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-blue-500 to-transparent -translate-x-1/2 z-10" />
        <div className="flex animate-wheel-spin gap-3 absolute top-1/2 -translate-y-1/2">
          {[...samples, ...samples].map((g, i) => (
            <div
              key={i}
              className="w-52 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-black shadow-xl"
            >
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`}
                alt={g.name}
                className="w-full h-full object-cover opacity-70"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none" />
      </div>
      <style jsx>{`
        @keyframes wheel-spin {
          0% { transform: translateX(0) translateY(-50%); }
          100% { transform: translateX(-50%) translateY(-50%); }
        }
        .animate-wheel-spin {
          animation: wheel-spin 1.6s cubic-bezier(0.2, 0.8, 0.3, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// ─── Carte d'un jeu tiré ──────────────────────────────────────────────
function GameCard({
  drawn,
  onAccept,
  highlight,
  compact,
}: {
  drawn: DrawnGame;
  onAccept?: () => void;
  highlight?: boolean;
  compact?: boolean;
}) {
  const { game, hltb, opencritic } = drawn;
  const [showVideo, setShowVideo] = useState(false);
  const trailer = game.movies[0];
  const trailerMp4 = toHttps(trailer?.mp4);
  const trailerWebm = toHttps(trailer?.webm);

  return (
    <article
      className={`bg-zinc-900/60 backdrop-blur rounded-3xl overflow-hidden border transition-all ${
        highlight
          ? "border-blue-500 ring-2 ring-blue-500/30 shadow-2xl shadow-blue-900/30"
          : "border-zinc-800 shadow-xl shadow-black/40"
      }`}
    >
      {/* ── Hero : trailer ou jaquette ── */}
      <div className="relative w-full aspect-[460/215] bg-black">
        {showVideo && (trailerMp4 || trailerWebm) ? (
          <video
            poster={toHttps(trailer?.thumbnail)}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover bg-black"
          >
            {trailerMp4 && <source src={trailerMp4} type="video/mp4" />}
            {trailerWebm && <source src={trailerWebm} type="video/webm" />}
          </video>
        ) : (
          <>
            <Image
              src={game.headerImage}
              alt={game.name}
              fill
              className="object-cover"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {(trailerMp4 || trailerWebm) && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group"
                aria-label="Lire le trailer"
              >
                <span className="bg-white/95 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-2xl group-hover:scale-110 transition-transform">
                  ▶
                </span>
              </button>
            )}
            {game.price?.discountPercent ? (
              <div className="absolute top-4 left-4 bg-emerald-500 text-black font-bold text-sm px-3 py-1.5 rounded-lg shadow-lg">
                -{game.price.discountPercent}%
              </div>
            ) : null}
            {opencritic.score && opencritic.score >= 85 && (
              <div className="absolute top-4 right-4 bg-amber-500 text-black font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                ⭐ {opencritic.score}
              </div>
            )}
          </>
        )}
      </div>

      <div className={`${compact ? "p-5 space-y-4" : "p-7 space-y-5"}`}>
        {/* ── Titre + meta ── */}
        <header>
          <h3 className={`${compact ? "text-2xl" : "text-3xl"} font-bold text-white tracking-tight`}>
            {game.name}
          </h3>
          <p className="text-zinc-500 text-sm mt-1.5">
            {game.developers.join(", ")} <span className="text-zinc-700 mx-1">·</span> {game.releaseDate}
          </p>
        </header>

        {/* ── Description ── */}
        <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
          {game.description}
        </p>

        {/* ── Tags ── */}
        {(game.genres.length > 0 || game.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {[...game.genres, ...game.tags].slice(0, 7).map((tag) => (
              <span
                key={tag}
                className="bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 text-xs px-2.5 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Screenshots ── */}
        {!compact && game.screenshots.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {game.screenshots.slice(0, 5).map((url) => (
              <img
                key={url}
                src={toHttps(url)}
                alt=""
                className="h-24 rounded-lg flex-shrink-0 object-cover border border-zinc-800"
              />
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat
            value={opencritic.score ?? "—"}
            label="OpenCritic"
            colorClass={scoreColor(opencritic.score)}
          />
          <Stat
            value={hltb.mainStory ? `${hltb.mainStory}h` : "—"}
            label="Histoire"
          />
          <Stat
            value={formatPlaytime(game.playtimeForever)}
            label="Ton temps"
            colorClass="text-blue-400"
          />
          <PriceStat price={game.price} />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <a
            href={`steam://run/${game.appid}`}
            className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-center py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            ▶ Lancer dans Steam
          </a>
          <a
            href={`https://store.steampowered.com/app/${game.appid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-medium px-5 py-3 rounded-xl transition-colors text-center"
          >
            Steam Store
          </a>
        </div>

        {onAccept && (
          <button
            onClick={onAccept}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all"
          >
            ⚔️ Je choisis celui-ci
          </button>
        )}
      </div>
    </article>
  );
}

function Stat({
  value,
  label,
  colorClass,
}: {
  value: React.ReactNode;
  label: string;
  colorClass?: string;
}) {
  return (
    <div className="bg-black/30 rounded-xl p-3 text-center min-w-0 border border-zinc-800/50">
      <p className={`text-lg font-bold truncate ${colorClass ?? "text-white"}`}>
        {value}
      </p>
      <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider truncate">
        {label}
      </p>
    </div>
  );
}

function PriceStat({ price }: { price: PriceOverview | null }) {
  return (
    <div className="bg-black/30 rounded-xl p-3 text-center min-w-0 border border-zinc-800/50">
      {price?.isFree ? (
        <p className="text-lg font-bold text-emerald-400 truncate">Gratuit</p>
      ) : price ? (
        <>
          <p className="text-lg font-bold text-white truncate">
            {price.formatted}
          </p>
          {price.discountPercent > 0 && (
            <p className="text-[10px] text-zinc-500 line-through truncate">
              {(price.initialCents / 100).toFixed(2)}€
            </p>
          )}
        </>
      ) : (
        <p className="text-lg font-bold text-zinc-500">—</p>
      )}
      <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider truncate">
        Prix
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("solo");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [solo, setSolo] = useState<RandomResult | null>(null);
  const [duel, setDuel] = useState<DuelResult | null>(null);
  const [chosen, setChosen] = useState<DrawnGame | null>(null);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [search, setSearch] = useState("");
  const [loadingDraw, setLoadingDraw] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const drawSeq = useRef(0);

  // Fermeture du drawer avec Escape
  useEffect(() => {
    if (!libraryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLibraryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [libraryOpen]);

  const fetchDraw = async () => {
    const seq = ++drawSeq.current;
    setLoadingDraw(true);
    setError(null);
    setChosen(null);
    try {
      const path = mode === "duel" ? "/api/library/duel" : "/api/library/random";
      const res = await fetch(`${path}${buildQuery(filters)}`);
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.code === "setup_required") {
        router.replace("/setup");
        return;
      }
      if (seq !== drawSeq.current) return;
      if (data.error) throw new Error(data.error);
      if (mode === "duel") {
        setDuel(data);
        setSolo(null);
      } else {
        setSolo(data);
        setDuel(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      if (seq === drawSeq.current) setLoadingDraw(false);
    }
  };

  const fetchGame = async (appid: number) => {
    const seq = ++drawSeq.current;
    setMode("solo");
    setLoadingDraw(true);
    setError(null);
    setChosen(null);
    setDuel(null);
    setLibraryOpen(false); // ferme le drawer après sélection
    try {
      const res = await fetch(`/api/library/game/${appid}`);
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data.code === "setup_required") {
        router.replace("/setup");
        return;
      }
      if (seq !== drawSeq.current) return;
      if (data.error) throw new Error(data.error);
      setSolo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      if (seq === drawSeq.current) setLoadingDraw(false);
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      if (data.code === "setup_required") {
        router.replace("/setup");
        return;
      }
      setGames(data.games || []);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    // Si on arrive avec ?game=APPID, on charge directement ce jeu
    // au lieu de tirer au hasard.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get("game");
      if (gameParam) {
        const appid = Number(gameParam);
        if (Number.isInteger(appid) && appid > 0) {
          fetchGame(appid);
          // Nettoie l'URL pour éviter qu'un refresh recharge en boucle
          window.history.replaceState({}, "", "/library");
          return;
        }
      }
    }
    fetchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filters]);

  useEffect(() => {
    fetchLibrary();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGames = games.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGames = solo?.totalGames ?? duel?.totalGames ?? games.length ?? 0;
  const poolSize = solo?.poolSize ?? duel?.poolSize ?? null;
  const hasFilters =
    filters.unplayed || filters.maxHours > 0 || filters.minScore > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-4 flex items-center gap-4">
          <a
            href="/"
            className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            ← Accueil
          </a>
          <div className="h-6 w-px bg-zinc-800" />
          <h1 className="text-lg font-bold tracking-tight">🎮 Backlog Killer</h1>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setLibraryOpen(true)}
              className="text-sm text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              📚 Bibliothèque
              {games.length > 0 && (
                <span className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0.5 rounded-md font-medium">
                  {games.length}
                </span>
              )}
            </button>
            <a
              href="/library/compare"
              className="text-sm text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-lg transition-all"
            >
              👥 Comparer
            </a>
            {session?.isLoggedIn && session.avatar && (
              <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <Image
                  src={session.avatar}
                  alt={session.name ?? ""}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="text-sm text-zinc-300 hidden sm:inline">
                  {session.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main : tirage en pleine largeur ── */}
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">

        <div className="space-y-6 min-w-0">

          {/* Mode + filtres */}
          <div className="bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex bg-black/40 rounded-xl p-1 border border-zinc-800">
                <ModePill
                  active={mode === "solo"}
                  onClick={() => setMode("solo")}
                  label="🎲 Solo"
                />
                <ModePill
                  active={mode === "duel"}
                  onClick={() => setMode("duel")}
                  label="⚔️ Duel"
                />
              </div>
              <button
                onClick={fetchDraw}
                disabled={loadingDraw}
                className="text-sm font-medium text-blue-300 hover:text-blue-200 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/50 hover:border-blue-700 px-4 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🎲 Re-tirer
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-500 uppercase tracking-wider mr-1">
                Filtres
              </span>
              <FilterChip
                label="🌱 Jamais joué"
                active={filters.unplayed}
                onClick={() =>
                  setFilters((f) => ({ ...f, unplayed: !f.unplayed }))
                }
              />
              <FilterChip
                label="⚡ Ce soir (<2h)"
                active={filters.maxHours === 2}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    maxHours: f.maxHours === 2 ? 0 : 2,
                  }))
                }
              />
              <FilterChip
                label="📖 Court (<10h)"
                active={filters.maxHours === 10}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    maxHours: f.maxHours === 10 ? 0 : 10,
                  }))
                }
              />
              <FilterChip
                label="⭐ Bien noté (≥80)"
                active={filters.minScore === 80}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    minScore: f.minScore === 80 ? 0 : 80,
                  }))
                }
              />
              {hasFilters && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 ml-auto"
                >
                  Tout réinitialiser
                </button>
              )}
            </div>

            {poolSize !== null && (
              <p className="text-xs text-zinc-500">
                Pool actuel :{" "}
                <span className="text-zinc-300 font-medium">{poolSize}</span> /{" "}
                {totalGames} jeux
              </p>
            )}
          </div>

          {/* Contenu : roue / erreur / résultat */}
          {loadingDraw ? (
            <SpinningWheel games={games} />
          ) : error ? (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-8 text-center">
              <p className="text-rose-300 mb-2 text-lg">⚠️ {error}</p>
              <p className="text-zinc-500 text-sm">
                Essaie d&apos;assouplir les filtres ou vérifie que ton profil
                Steam est en mode Public.
              </p>
            </div>
          ) : mode === "solo" && solo ? (
            <GameCard drawn={solo} />
          ) : mode === "duel" && duel ? (
            chosen ? (
              <div className="space-y-4">
                <p className="text-center text-zinc-400 text-sm">
                  ✅ Tu as choisi :
                </p>
                <GameCard drawn={chosen} highlight />
                <button
                  onClick={() => {
                    setChosen(null);
                    fetchDraw();
                  }}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors"
                >
                  ⚔️ Nouveau duel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                {duel.contenders.map((c, i) => (
                  <GameCard
                    key={c.game.appid + "-" + i}
                    drawn={c}
                    onAccept={() => setChosen(c)}
                    compact
                  />
                ))}
              </div>
            )
          ) : null}
        </div>

      </div>

      {/* ── Drawer bibliothèque ── */}
      <LibraryDrawer
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        games={filteredGames}
        totalGames={totalGames}
        search={search}
        onSearchChange={setSearch}
        loading={loadingLibrary}
        activeAppId={
          mode === "solo" && solo?.game.appid ? solo.game.appid : null
        }
        onSelect={fetchGame}
      />
    </main>
  );
}

function LibraryDrawer({
  open,
  onClose,
  games,
  totalGames,
  search,
  onSearchChange,
  loading,
  activeAppId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  games: SteamGame[];
  totalGames: number;
  search: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  activeAppId: number | null;
  onSelect: (appid: number) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 z-50 flex flex-col transition-transform duration-300 shadow-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Ma bibliothèque Steam"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              📚 Bibliothèque
            </h2>
            {totalGames > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {totalGames.toLocaleString("fr-FR")} jeux Steam
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 w-9 h-9 rounded-lg transition-all flex items-center justify-center"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 flex-shrink-0">
          <input
            type="text"
            placeholder="🔍 Rechercher un jeu..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className="w-full bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-zinc-900 transition-colors"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5 scrollbar-thin">
          {loading ? (
            <div className="text-zinc-500 text-sm text-center py-12 animate-pulse">
              Chargement...
            </div>
          ) : (
            games.map((game) => {
              const isActive = activeAppId === game.appid;
              return (
                <button
                  key={game.appid}
                  onClick={() => onSelect(game.appid)}
                  className={`w-full flex items-center gap-3 border rounded-lg px-3 py-2 transition-all group text-left ${
                    isActive
                      ? "bg-blue-950/40 border-blue-700"
                      : "bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_sm_120.jpg`}
                    alt={game.name}
                    className="w-12 h-6 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive
                          ? "text-white"
                          : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {game.name}
                    </p>
                    <p className="text-zinc-600 text-xs">
                      {formatPlaytime(game.playtime_forever)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
          {!loading && games.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-12">
              Aucun résultat pour &quot;{search}&quot;
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
        active
          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40"
          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
      }`}
    >
      {label}
    </button>
  );
}

function ModePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
          : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
