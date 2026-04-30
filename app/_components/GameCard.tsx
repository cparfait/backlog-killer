"use client";

import { useState } from "react";
import Image from "next/image";

// ─── Types partagés (UI) ──────────────────────────────────────────────
export interface PriceOverview {
  finalCents: number;
  initialCents: number;
  discountPercent: number;
  currency: string;
  formatted: string;
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

export interface HLTBData {
  mainStory: number | null;
  mainExtra: number | null;
  completionist: number | null;
}

export interface OpenCriticData {
  score: number | null;
  tier: string | null;
  reviewCount: number | null;
}

export interface DrawnGame {
  game: GameDetails;
  hltb: HLTBData;
  opencritic: OpenCriticData;
}

// ─── Helpers ──────────────────────────────────────────────────────────
export function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "Jamais joué";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}`;
}

export function scoreColor(score: number | null): string {
  if (!score) return "text-zinc-500";
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-rose-400";
}

// Steam sert souvent les vidéos en http:// — bloqué en mixed content.
export function toHttps(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//, "https://");
}

// ─── Composant ────────────────────────────────────────────────────────
export function GameCard({
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
        <header>
          <h3
            className={`${compact ? "text-2xl" : "text-3xl"} font-bold text-white tracking-tight`}
          >
            {game.name}
          </h3>
          <p className="text-zinc-500 text-sm mt-1.5">
            {game.developers.join(", ")}{" "}
            <span className="text-zinc-700 mx-1">·</span> {game.releaseDate}
          </p>
        </header>

        <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
          {game.description}
        </p>

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
