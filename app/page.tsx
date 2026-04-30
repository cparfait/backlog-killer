"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HeaderSearch } from "@/app/_components/HeaderSearch";
import { GameCard } from "@/app/_components/GameCard";
import type { DrawnGame } from "@/app/_components/GameCard";

interface Session {
  isLoggedIn: boolean;
  name?: string;
  avatar?: string;
  steamid?: string;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
}

interface PricedGame extends SteamGame {
  finalCents: number | null;
  formatted: string | null;
  isFree: boolean;
}

interface CostData {
  totalFormatted: string;
  counts: { total: number; priced: number; free: number; unknown: number };
  games: PricedGame[];
}

interface LibraryData {
  total: number;
  totalPlaytimeHours: number;
  unplayedCount: number;
  games: SteamGame[];
}

type StatKey = "all" | "unplayed" | "playtime" | "value";

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [cost, setCost] = useState<CostData | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [lib, setLib] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStat, setActiveStat] = useState<StatKey | null>(null);
  const [gameDrawerAppid, setGameDrawerAppid] = useState<number | null>(null);
  const [gameDrawerData, setGameDrawerData] = useState<DrawnGame | null>(null);
  const [gameDrawerLoading, setGameDrawerLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        if (!data.configured) {
          router.replace("/setup");
          return;
        }
        return fetch("/api/auth/session")
          .then((r) => r.json())
          .then((sessionData) => {
            setSession(sessionData);
            setLoading(false);
            if (sessionData.isLoggedIn) {
              setCostLoading(true);
              fetch("/api/library/cost")
                .then((r) => (r.ok ? r.json() : null))
                .then((c) => {
                  if (c && !c.error) setCost(c);
                })
                .finally(() => setCostLoading(false));

              fetch("/api/library")
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                  if (!data?.games) return;
                  const totalMinutes = data.games.reduce(
                    (acc: number, g: SteamGame) => acc + g.playtime_forever,
                    0
                  );
                  const unplayed = data.games.filter(
                    (g: SteamGame) => g.playtime_forever === 0
                  ).length;
                  setLib({
                    total: data.total,
                    totalPlaytimeHours: Math.round(totalMinutes / 60),
                    unplayedCount: unplayed,
                    games: data.games,
                  });
                });
            }
          });
      });
  }, [router]);

  useEffect(() => {
    if (!activeStat) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveStat(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeStat]);

  const openGame = (appid: number) => {
    setGameDrawerAppid(appid);
    setGameDrawerLoading(true);
    setGameDrawerData(null);
    fetch(`/api/library/game/${appid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setGameDrawerData(data);
      })
      .finally(() => setGameDrawerLoading(false));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-white/30 text-sm tracking-wider uppercase">Chargement</p>
        </div>
      </main>
    );
  }

  if (!session?.isLoggedIn) {
    return <LandingPage />;
  }

  const unplayedPercent = lib ? Math.round((lib.unplayedCount / lib.total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="sticky top-0 z-30 bg-[#0a0a0f]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center gap-5">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
              BK
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white/90 hidden sm:inline">
              Backlog Killer
            </span>
          </a>

          {lib && lib.games.length > 0 && (
            <div className="ml-2 hidden md:block flex-1 max-w-sm">
              <HeaderSearch games={lib.games} onSelect={openGame} />
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            {session.avatar && (
              <div className="flex items-center gap-2.5">
                <Image
                  src={session.avatar}
                  alt={session.name ?? ""}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-white/10"
                />
                <span className="text-sm text-white/60 hidden sm:inline">{session.name}</span>
              </div>
            )}
            <a
              href="/api/auth/logout"
              className="text-xs text-white/30 hover:text-white/70 transition-colors uppercase tracking-wider"
            >
              Logout
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-12 pb-20 space-y-10">
        <section className="text-center space-y-3 pt-4">
          <p className="text-blue-400/80 text-xs font-medium uppercase tracking-[0.25em]">
            Salut, {session.name}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Découvre
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> une pépite</span>
          </h1>
          <p className="text-white/30 text-base max-w-md mx-auto">
            Ton backlog cache des trésors. Explore, tire, joue.
          </p>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<StatIcon>📚</StatIcon>}
            label="Jeux possédés"
            value={lib ? lib.total.toLocaleString("fr-FR") : "—"}
            loading={!lib}
            onClick={lib ? () => setActiveStat("all") : undefined}
          />
          <StatCard
            icon={<StatIcon>🌱</StatIcon>}
            label="Jamais touchés"
            value={lib ? `${lib.unplayedCount}` : "—"}
            sublabel={lib ? `${unplayedPercent}% du backlog` : undefined}
            loading={!lib}
            accent={lib && unplayedPercent > 50 ? "amber" : undefined}
            onClick={lib ? () => setActiveStat("unplayed") : undefined}
          />
          <StatCard
            icon={<StatIcon>⏱️</StatIcon>}
            label="Heures jouées"
            value={lib ? `${lib.totalPlaytimeHours.toLocaleString("fr-FR")}h` : "—"}
            loading={!lib}
            onClick={lib ? () => setActiveStat("playtime") : undefined}
          />
          <StatCard
            icon={<StatIcon>💰</StatIcon>}
            label="Valeur estimée"
            value={cost ? cost.totalFormatted : costLoading ? "..." : "—"}
            sublabel={
              cost
                ? `${cost.counts.priced} payants${cost.counts.free ? ` · ${cost.counts.free} gratuits` : ""}`
                : undefined
            }
            loading={costLoading}
            accent="blue"
            onClick={cost ? () => setActiveStat("value") : undefined}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-5xl mx-auto">
          <button
            onClick={() => router.push("/library")}
            className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 hover:from-blue-500 hover:via-blue-600 hover:to-violet-600 active:scale-[0.995] text-white font-bold text-xl sm:text-2xl py-10 rounded-2xl transition-all duration-200 shadow-2xl shadow-blue-900/30 group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
            <span className="relative block text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🎲</span>
            <span className="relative block">Tirer un jeu au hasard</span>
            <span className="relative block text-sm font-normal text-white/60 mt-1">Laisse le hasard décider ce soir</span>
          </button>

          <div className="lg:col-span-5 grid grid-rows-2 gap-3">
            <button
              onClick={() => router.push("/library")}
              className="relative overflow-hidden bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] text-white font-medium rounded-2xl py-5 px-6 transition-all duration-200 flex items-center gap-4 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📚</span>
              <span className="text-left">
                <span className="block text-sm font-semibold">Bibliothèque</span>
                <span className="block text-xs text-white/35">Parcourir tous tes jeux</span>
              </span>
              <span className="ml-auto text-white/20 group-hover:text-white/50 transition-colors text-lg">→</span>
            </button>
            <button
              onClick={() => router.push("/library/compare")}
              className="relative overflow-hidden bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] text-white font-medium rounded-2xl py-5 px-6 transition-all duration-200 flex items-center gap-4 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">👥</span>
              <span className="text-left">
                <span className="block text-sm font-semibold">Comparer</span>
                <span className="block text-xs text-white/35">Avec un ami Steam</span>
              </span>
              <span className="ml-auto text-white/20 group-hover:text-white/50 transition-colors text-lg">→</span>
            </button>
          </div>
        </section>

        {lib && lib.games.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/80">Jeux jamais touchés</h2>
              {lib.unplayedCount > 8 && (
                <button
                  onClick={() => setActiveStat("unplayed")}
                  className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors uppercase tracking-wider"
                >
                  Voir tout →
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lib.games
                .filter((g) => g.playtime_forever === 0)
                .sort(() => 0.5 - Math.random())
                .slice(0, 6)
                .map((g) => (
                  <button
                    key={g.appid}
                    onClick={() => openGame(g.appid)}
                    className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-left"
                  >
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`}
                      alt={g.name}
                      className="w-full aspect-[460/215] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-medium truncate text-white/90">{g.name}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Jamais joué</p>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}
      </div>

      <StatDrawer
        stat={activeStat}
        onClose={() => setActiveStat(null)}
        lib={lib}
        cost={cost}
        onSelectGame={openGame}
      />

      <GameDetailDrawer
        appid={gameDrawerAppid}
        data={gameDrawerData}
        loading={gameDrawerLoading}
        onClose={() => {
          setGameDrawerAppid(null);
          setGameDrawerData(null);
        }}
      />
    </main>
  );
}

function StatIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-lg">
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  loading,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  loading?: boolean;
  highlight?: boolean;
  accent?: "blue" | "amber";
  onClick?: () => void;
}) {
  const accentBorder = accent === "blue"
    ? "border-blue-500/20 hover:border-blue-500/40"
    : accent === "amber"
    ? "border-amber-500/20 hover:border-amber-500/40"
    : "border-white/[0.06] hover:border-white/[0.12]";

  const accentGlow = accent === "blue"
    ? "bg-gradient-to-br from-blue-500/[0.06] to-transparent"
    : accent === "amber"
    ? "bg-gradient-to-br from-amber-500/[0.06] to-transparent"
    : "bg-white/[0.02]";

  const inner = (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        {icon}
        {onClick && (
          <span className="text-white/15 group-hover:text-white/40 transition-colors text-sm">
            →
          </span>
        )}
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${loading ? "text-white/15 animate-pulse" : "text-white"}`}>
          {value}
        </p>
        <p className="text-white/30 text-[11px] uppercase tracking-widest mt-1 font-medium">
          {label}
        </p>
        {sublabel && <p className="text-white/20 text-[11px] mt-1">{sublabel}</p>}
      </div>
    </div>
  );

  const cls = `relative rounded-2xl border transition-all duration-200 overflow-hidden ${accentBorder} ${accentGlow} ${
    onClick ? "cursor-pointer hover:bg-white/[0.04] active:scale-[0.99] group w-full" : ""
  }`;

  if (onClick) {
    return <button onClick={onClick} className={cls}>{inner}</button>;
  }
  return <div className={cls}>{inner}</div>;
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/[0.07] rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-fuchsia-600/[0.05] rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">
            BK
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white/80">Backlog Killer</span>
        </div>
        <a
          href="/api/auth/login"
          className="text-sm text-white/50 hover:text-white/90 transition-colors font-medium"
        >
          Se connecter
        </a>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Propulsé par Steam
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Tire un jeu.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Joue ce soir.
            </span>
          </h1>

          <p className="text-white/35 text-lg max-w-lg mx-auto leading-relaxed">
            Redécouvre les pépites qui dorment dans ta bibliothèque Steam.
            Filtres intelligents, fiches enrichies, lancement en un clic.
          </p>

          <a
            href="/api/auth/login"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl shadow-blue-900/40 hover:shadow-blue-800/50 hover:scale-[1.02] active:scale-[0.99]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Se connecter avec Steam
          </a>

          <p className="text-white/15 text-xs">
            Ton compte Steam reste sur Steam. On ne stocke que ton SteamID.
          </p>
        </div>
      </div>
    </main>
  );
}

const STAT_META: Record<StatKey, { title: string; icon: string; description: string }> = {
  all: { title: "Tous tes jeux", icon: "📚", description: "Triés par ordre alphabétique" },
  unplayed: { title: "Jamais touchés", icon: "🌱", description: "Jeux possédés avec 0 minute jouée" },
  playtime: { title: "Tes plus joués", icon: "⏱️", description: "Triés par heures de jeu décroissantes" },
  value: { title: "Tes plus chers", icon: "💰", description: "Triés par prix actuel décroissant" },
};

function StatDrawer({
  stat,
  onClose,
  lib,
  cost,
  onSelectGame,
}: {
  stat: StatKey | null;
  onClose: () => void;
  lib: LibraryData | null;
  cost: CostData | null;
  onSelectGame: (appid: number) => void;
}) {
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (stat) setSearch("");
  }, [stat]);

  const items = useMemo(() => {
    if (!stat) return [];
    if (stat === "value") {
      if (!cost?.games) return [];
      return cost.games
        .filter((g) => g.finalCents != null && g.finalCents > 0)
        .sort((a, b) => (b.finalCents ?? 0) - (a.finalCents ?? 0));
    }
    if (!lib?.games) return [];
    if (stat === "all") {
      return [...lib.games].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      );
    }
    if (stat === "unplayed") {
      return lib.games
        .filter((g) => g.playtime_forever === 0)
        .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    }
    if (stat === "playtime") {
      return lib.games
        .filter((g) => g.playtime_forever > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever);
    }
    return [];
  }, [stat, lib, cost]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((g) => g.name.toLowerCase().includes(q));
  }, [items, search]);

  const meta = stat ? STAT_META[stat] : null;
  const open = stat !== null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#0c0c14]/98 backdrop-blur-2xl border-l border-white/[0.06] z-50 flex flex-col transition-transform duration-300 shadow-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label={meta?.title}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04] flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2 text-white/90">
              <span>{meta?.icon}</span>
              {meta?.title}
            </h2>
            <p className="text-[11px] text-white/25 mt-0.5">
              {meta?.description}
              {items.length > 0 && (
                <>
                  {" · "}
                  <span className="text-white/50">{items.length}</span> jeux
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] w-8 h-8 rounded-lg transition-all flex items-center justify-center flex-shrink-0 ml-3 text-sm"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Filtrer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1 scrollbar-thin">
          {filtered.map((g) => (
            <button
              key={g.appid}
              onClick={() => onSelectGame(g.appid)}
              className="w-full flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] rounded-xl px-3 py-2.5 transition-all duration-150 group text-left"
            >
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/capsule_sm_120.jpg`}
                alt={g.name}
                className="w-14 h-7 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white/70 group-hover:text-white/95">
                  {g.name}
                </p>
                <p className="text-white/20 text-xs">
                  <RowMetric stat={stat} game={g} />
                </p>
              </div>
              <span className="text-white/10 group-hover:text-white/40 text-xs flex-shrink-0 transition-colors">
                →
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-white/20 text-sm text-center py-12">
              {search ? `Aucun résultat pour "${search}"` : "Aucun jeu"}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function RowMetric({
  stat,
  game,
}: {
  stat: StatKey | null;
  game: SteamGame | PricedGame;
}) {
  if (stat === "value" && "formatted" in game && game.formatted) {
    return <span className="text-emerald-400/80 font-medium">{game.formatted}</span>;
  }
  if (stat === "playtime") {
    const h = Math.floor(game.playtime_forever / 60);
    const m = game.playtime_forever % 60;
    if (h === 0) return <>{m} min joués</>;
    return (
      <span className="text-blue-400/80 font-medium">
        {h.toLocaleString("fr-FR")}h {m.toString().padStart(2, "0")} joués
      </span>
    );
  }
  if (game.playtime_forever === 0) return <>Jamais joué</>;
  const h = Math.floor(game.playtime_forever / 60);
  const m = game.playtime_forever % 60;
  if (h === 0) return <>{m} min</>;
  return <>{h}h {m.toString().padStart(2, "0")}</>;
}

function GameDetailDrawer({
  appid,
  data,
  loading,
  onClose,
}: {
  appid: number | null;
  data: DrawnGame | null;
  loading: boolean;
  onClose: () => void;
}) {
  const open = appid !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[640px] bg-[#0c0c14]/98 backdrop-blur-2xl border-l border-white/[0.06] z-50 flex flex-col transition-transform duration-300 shadow-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Fiche jeu"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] flex-shrink-0">
          <h2 className="text-sm font-semibold tracking-tight text-white/60 uppercase">Fiche jeu</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] w-8 h-8 rounded-lg transition-all flex items-center justify-center flex-shrink-0 text-sm"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/25 text-sm">Chargement de la fiche...</p>
            </div>
          ) : data ? (
            <GameCard drawn={data} />
          ) : (
            <div className="flex items-center justify-center py-24">
              <p className="text-white/25 text-sm">Impossible de charger ce jeu.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
