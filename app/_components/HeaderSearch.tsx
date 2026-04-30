"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface SearchableGame {
  appid: number;
  name: string;
  playtime_forever: number;
}

export function HeaderSearch({
  games,
  onSelect,
  placeholder = "🔍 Chercher un jeu dans ta bibliothèque...",
}: {
  games: SearchableGame[];
  onSelect: (appid: number) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return games
      .filter((g) => g.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [games, query]);

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight quand les résultats changent
  useEffect(() => {
    setHighlight(0);
  }, [results.length]);

  // Raccourci clavier "/" pour focus la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target as HTMLElement)?.matches?.("input, textarea")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const choose = (appid: number) => {
    setQuery("");
    setOpen(false);
    onSelect(appid);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight];
      if (target) choose(target.appid);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-600 focus:bg-zinc-900 text-white placeholder-zinc-500 rounded-lg pl-4 pr-10 py-2 text-sm outline-none transition-colors"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 rounded font-mono pointer-events-none">
        /
      </kbd>

      {open && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[60vh] overflow-y-auto scrollbar-thin">
          {results.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6 px-4">
              Aucun jeu ne correspond à &quot;{query}&quot;
            </p>
          ) : (
            <ul>
              {results.map((g, i) => (
                <li key={g.appid}>
                  <button
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(g.appid)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      i === highlight
                        ? "bg-zinc-800/80"
                        : "hover:bg-zinc-800/60"
                    }`}
                  >
                    <img
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/capsule_sm_120.jpg`}
                      alt={g.name}
                      className="w-12 h-6 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {g.name}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {g.playtime_forever === 0
                          ? "Jamais joué"
                          : `${Math.floor(g.playtime_forever / 60)}h joués`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
