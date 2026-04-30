import {
  GameDetails,
  SteamGame,
  getGameDetails,
  pickRandomGame,
} from "./steamApi";
import { getHowLongToBeat, HLTBData } from "../enrichment/howlongtobeat";
import {
  getOpenCriticScore,
  OpenCriticData,
} from "../enrichment/opencritic";

export interface DrawFilters {
  unplayed?: boolean;
  maxHours?: number | null;
  minScore?: number | null;
}

export interface DrawnGame {
  game: GameDetails;
  hltb: HLTBData;
  opencritic: OpenCriticData;
}

const MAX_STRICT_ATTEMPTS = 20;
const MAX_FALLBACK_ATTEMPTS = 30;

export function applyPreFilters(
  games: SteamGame[],
  filters: DrawFilters
): SteamGame[] {
  let pool = games;
  if (filters.unplayed) {
    pool = pool.filter((g) => g.playtime_forever === 0);
  }
  return pool;
}

export async function drawOne(
  pool: SteamGame[],
  filters: DrawFilters,
  excludeAppIds: Set<number> = new Set()
): Promise<DrawnGame | null> {
  const tried = new Set<number>(excludeAppIds);
  let lastValid: DrawnGame | null = null;
  let bestFallback: DrawnGame | null = null;
  let bestFallbackScore = -Infinity;

  const totalAttempts = MAX_STRICT_ATTEMPTS + MAX_FALLBACK_ATTEMPTS;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const remaining = pool.filter((g) => !tried.has(g.appid));
    if (remaining.length === 0) break;

    const candidate = pickRandomGame(remaining);
    tried.add(candidate.appid);

    let details: GameDetails;
    try {
      details = await getGameDetails(
        candidate.appid,
        candidate.playtime_forever
      );
    } catch {
      continue;
    }

    const [hltbResult, opencriticResult] = await Promise.allSettled([
      getHowLongToBeat(details.name),
      getOpenCriticScore(details.name),
    ]);

    const hltb =
      hltbResult.status === "fulfilled"
        ? hltbResult.value
        : { mainStory: null, mainExtra: null, completionist: null };

    const opencritic =
      opencriticResult.status === "fulfilled"
        ? opencriticResult.value
        : { score: null, tier: null, reviewCount: null };

    const drawn: DrawnGame = { game: details, hltb, opencritic };
    lastValid = drawn;

    let hltbOk = true;
    let scoreOk = true;
    let partialScore = 0;

    if (filters.maxHours != null) {
      if (hltb.mainStory == null) {
        hltbOk = false;
      } else if (hltb.mainStory > filters.maxHours) {
        hltbOk = false;
        partialScore -= 1;
      } else {
        partialScore += 2;
      }
    }

    if (filters.minScore != null) {
      if (opencritic.score == null) {
        scoreOk = false;
      } else if (opencritic.score < filters.minScore) {
        scoreOk = false;
        partialScore -= 1;
      } else {
        partialScore += 2;
      }
    }

    if (!hltbOk || !scoreOk) {
      if (partialScore > bestFallbackScore) {
        bestFallbackScore = partialScore;
        bestFallback = drawn;
      }

      if (attempt < MAX_STRICT_ATTEMPTS) {
        continue;
      }

      continue;
    }

    return drawn;
  }

  if (filters.maxHours == null && filters.minScore == null) {
    return lastValid;
  }

  if (bestFallback) {
    return bestFallback;
  }

  return lastValid;
}

export function parseFiltersFromQuery(
  searchParams: URLSearchParams
): DrawFilters {
  const filters: DrawFilters = {};
  if (searchParams.get("unplayed") === "1") filters.unplayed = true;

  const maxHours = searchParams.get("maxHours");
  if (maxHours) {
    const n = Number(maxHours);
    if (Number.isFinite(n) && n > 0) filters.maxHours = n;
  }

  const minScore = searchParams.get("minScore");
  if (minScore) {
    const n = Number(minScore);
    if (Number.isFinite(n) && n >= 0 && n <= 100) filters.minScore = n;
  }

  return filters;
}
