"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

interface CostInfo {
  totalCents: number;
  totalFormatted: string;
  currency: string;
}

interface Profile {
  steamid: string;
  name: string;
  avatar: string;
  total: number;
  totalPlaytimeMinutes: number;
  cost: CostInfo | null;
}

interface CommonGame {
  appid: number;
  name: string;
  myPlaytime: number;
  friendPlaytime: number;
}

interface CompareResult {
  me: Profile;
  friend: Profile;
  common: CommonGame[];
}

interface Friend {
  steamid: string;
  name: string;
  avatar: string;
  friendSince: number;
}

function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "—";
  const h = Math.floor(minutes / 60);
  if (h === 0) return `${minutes}m`;
  return `${h.toLocaleString("fr-FR")}h`;
}

function formatPlaytimeFull(minutes: number): string {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h.toLocaleString("fr-FR")}h${m.toString().padStart(2, "0")}` : `${h.toLocaleString("fr-FR")}h`;
}

function CompareBar({ meVal, friendVal, meLabel, friendLabel, meColor, friendColor }: {
  meVal: number;
  friendVal: number;
  meLabel: string;
  friendLabel: string;
  meColor: string;
  friendColor: string;
}) {
  const max = Math.max(meVal, friendVal, 1);
  const mePercent = (meVal / max) * 100;
  const friendPercent = (friendVal / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/30 w-12 text-right shrink-0">Toi</span>
        <div className="flex-1 h-8 bg-white/[0.03] rounded-lg overflow-hidden relative">
          <div
            className={`h-full rounded-lg transition-all duration-700 ${meColor}`}
            style={{ width: `${mePercent}%` }}
          />
          <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white/90">
            {meLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/30 w-12 text-right shrink-0">Ami</span>
        <div className="flex-1 h-8 bg-white/[0.03] rounded-lg overflow-hidden relative">
          <div
            className={`h-full rounded-lg transition-all duration-700 ${friendColor}`}
            style={{ width: `${friendPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-white/90">
            {friendLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [steamid, setSteamid] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [friendSearch, setFriendSearch] = useState("");
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/friends")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setFriendsError(data.error || "Liste d'amis indisponible");
          return;
        }
        setFriends(data.friends ?? []);
      })
      .catch(() => setFriendsError("Liste d'amis indisponible"))
      .finally(() => setFriendsLoading(false));
  }, []);

  const filteredFriends = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.name.toLowerCase().includes(q));
  }, [friends, friendSearch]);

  const runCompare = async (id: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveFriendId(id);
    try {
      const res = await fetch(
        `/api/library/compare?steamid=${encodeURIComponent(id)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    runCompare(steamid.trim());
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      <nav className="sticky top-0 z-30 bg-[#0a0a0f]/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center gap-5">
          <a href="/library" className="text-white/30 hover:text-white/70 transition-colors text-sm font-medium">
            ← Bibliothèque
          </a>
          <div className="h-5 w-px bg-white/[0.06]" />
          <h1 className="text-[15px] font-semibold tracking-tight text-white/80">Comparer avec un ami</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 space-y-8">

        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">
            Trouvez vos jeux en commun
          </h2>
          <p className="text-white/30">
            Choisis un ami dans ta liste Steam, ou colle un SteamID64.
          </p>
        </div>

        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Tes amis Steam</h3>
              {!friendsLoading && !friendsError && (
                <p className="text-white/20 text-xs mt-0.5">{friends.length} amis au total</p>
              )}
            </div>
            {friends.length > 0 && (
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Filtrer par nom..."
                className="bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/40 transition-colors w-full sm:w-64"
              />
            )}
          </div>

          {friendsLoading ? (
            <div className="text-white/25 text-sm text-center py-8 animate-pulse">
              Chargement de tes amis...
            </div>
          ) : friendsError ? (
            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-rose-300/80 text-sm">
              {friendsError}
              <p className="text-white/15 text-xs mt-2">
                Vérifie que ta liste d&apos;amis est en mode public dans les paramètres de confidentialité Steam.
              </p>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-white/20 text-center py-6">Aucun ami trouvé.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredFriends.map((f) => {
                const isActive = activeFriendId === f.steamid;
                return (
                  <button
                    key={f.steamid}
                    onClick={() => runCompare(f.steamid)}
                    className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 transition-all text-left group ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] hover:border-white/[0.12]"
                    }`}
                  >
                    {f.avatar ? (
                      <Image
                        src={f.avatar}
                        alt={f.name}
                        width={36}
                        height={36}
                        className="rounded-full ring-1 ring-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium truncate min-w-0 ${
                      isActive ? "text-white/90" : "text-white/50 group-hover:text-white/80"
                    }`}>
                      {f.name}
                    </span>
                  </button>
                );
              })}
              {filteredFriends.length === 0 && (
                <p className="text-white/20 text-sm col-span-full text-center py-6">
                  Aucun ami ne correspond à &quot;{friendSearch}&quot;
                </p>
              )}
            </div>
          )}
        </section>

        <details className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <summary className="cursor-pointer text-sm font-medium text-white/40 hover:text-white/70">
            Ou comparer avec un SteamID64 manuellement
          </summary>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="76561198000000000"
                value={steamid}
                onChange={(e) => setSteamid(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/15 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:border-blue-500/40 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || steamid.trim().length === 0}
                className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold px-6 rounded-xl transition-all"
              >
                {loading ? "..." : "Comparer"}
              </button>
            </div>
            <p className="text-xs text-white/15">
              Récupère le SteamID64 sur{" "}
              <a href="https://steamid.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400">
                steamid.io
              </a>.
            </p>
          </form>
        </details>

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5 text-rose-300/80">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/25 text-sm">Comparaison en cours...</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileCard profile={result.me} side="left" />
              <ProfileCard profile={result.friend} side="right" />
            </div>

            <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest">Comparatif</h3>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/30 uppercase tracking-wider">Temps de jeu total</span>
                  </div>
                  <CompareBar
                    meVal={result.me.totalPlaytimeMinutes}
                    friendVal={result.friend.totalPlaytimeMinutes}
                    meLabel={formatPlaytimeFull(result.me.totalPlaytimeMinutes)}
                    friendLabel={formatPlaytimeFull(result.friend.totalPlaytimeMinutes)}
                    meColor="bg-gradient-to-r from-blue-600/80 to-blue-500/60"
                    friendColor="bg-gradient-to-r from-violet-600/80 to-violet-500/60"
                  />
                </div>

                {result.me.cost && result.friend.cost && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/30 uppercase tracking-wider">Valeur de la bibliothèque</span>
                    </div>
                    <CompareBar
                      meVal={result.me.cost.totalCents}
                      friendVal={result.friend.cost.totalCents}
                      meLabel={result.me.cost.totalFormatted}
                      friendLabel={result.friend.cost.totalFormatted}
                      meColor="bg-gradient-to-r from-emerald-600/80 to-emerald-500/60"
                      friendColor="bg-gradient-to-r from-amber-600/80 to-amber-500/60"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/30 uppercase tracking-wider">Nombre de jeux</span>
                  </div>
                  <CompareBar
                    meVal={result.me.total}
                    friendVal={result.friend.total}
                    meLabel={`${result.me.total.toLocaleString("fr-FR")} jeux`}
                    friendLabel={`${result.friend.total.toLocaleString("fr-FR")} jeux`}
                    meColor="bg-gradient-to-r from-blue-600/60 to-blue-500/40"
                    friendColor="bg-gradient-to-r from-violet-600/60 to-violet-500/40"
                  />
                </div>
              </div>
            </section>

            <div className="bg-gradient-to-br from-blue-500/[0.06] to-violet-500/[0.06] border border-white/[0.06] rounded-2xl p-8 text-center">
              <p className="text-white/30 text-xs uppercase tracking-widest">
                Jeux possédés en commun
              </p>
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mt-2">
                {result.common.length}
              </p>
              {result.common.length > 0 && (
                <p className="text-white/15 text-xs mt-2">Triés par temps de jeu cumulé</p>
              )}
            </div>

            <div className="space-y-1.5">
              {result.common.map((g) => (
                <div
                  key={g.appid}
                  className="flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.1] rounded-xl px-4 py-3 transition-colors"
                >
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/capsule_sm_120.jpg`}
                    alt={g.name}
                    className="w-20 h-10 object-cover rounded-md flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-sm font-medium truncate">{g.name}</p>
                  </div>
                  <div className="flex gap-6 text-xs">
                    <div className="text-right">
                      <p className="text-white/20 text-[10px] uppercase tracking-wider">Toi</p>
                      <p className="text-blue-400/80 font-bold text-sm">{formatPlaytime(g.myPlaytime)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/20 text-[10px] uppercase tracking-wider truncate max-w-[80px]">
                        {result.friend.name}
                      </p>
                      <p className="text-violet-400/80 font-bold text-sm">{formatPlaytime(g.friendPlaytime)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {result.common.length === 0 && (
                <p className="text-white/20 text-center py-12">Aucun jeu en commun. Dommage !</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ProfileCard({ profile, side }: { profile: Profile; side: "left" | "right" }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
      {profile.avatar ? (
        <Image
          src={profile.avatar}
          alt={profile.name}
          width={56}
          height={56}
          className="rounded-full ring-2 ring-white/10"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-white/5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-white/25 uppercase tracking-widest">
          {side === "left" ? "Toi" : "Ami"}
        </p>
        <p className="text-white/90 font-semibold text-lg truncate">{profile.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/25 text-xs">{profile.total.toLocaleString("fr-FR")} jeux</span>
          <span className="text-white/10">·</span>
          <span className="text-white/25 text-xs">{formatPlaytimeFull(profile.totalPlaytimeMinutes)}</span>
          {profile.cost && (
            <>
              <span className="text-white/10">·</span>
              <span className="text-emerald-400/60 text-xs font-medium">{profile.cost.totalFormatted}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
