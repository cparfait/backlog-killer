// lib/enrichment/howlongtobeat.ts
//
// Client HLTB maison — la lib npm `howlongtobeat` est cassée depuis
// que HLTB a migré son API vers un endpoint dont le path contient
// un hash qui change à chaque déploiement de leur site.
//
// Stratégie :
//   1. fetch la home page HLTB
//   2. y trouver l'URL du JS bundle Next.js
//   3. y extraire le path /api/<word>/<hash> de l'endpoint de recherche
//   4. POST ce endpoint avec le payload de recherche
// L'endpoint est mis en cache 1h ; en cas d'erreur il est invalidé.

export interface HLTBData {
  mainStory: number | null;     // heures
  mainExtra: number | null;
  completionist: number | null;
}

const HLTB_HOST = "https://howlongtobeat.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

let cachedEndpoint: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function discoverEndpoint(): Promise<string | null> {
  if (cachedEndpoint && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedEndpoint;
  }

  try {
    const homeRes = await fetch(HLTB_HOST + "/", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!homeRes.ok) {
      console.warn("[hltb] homepage status", homeRes.status);
      return null;
    }
    const html = await homeRes.text();

    // On cible les bundles _app et 6e2-... qui contiennent l'API
    const scriptPaths = [
      ...html.matchAll(
        /\/_next\/static\/chunks\/(?:pages\/)?([\w./_-]+\.js)/g
      ),
    ]
      .map((m) => m[1])
      .filter(
        (p, i, arr) =>
          arr.indexOf(p) === i &&
          (/_app/.test(p) || /\d{3,}-[a-f0-9]+\.js$/.test(p))
      );

    for (const path of scriptPaths) {
      try {
        const jsRes = await fetch(
          `${HLTB_HOST}/_next/static/chunks/${path.startsWith("pages/") ? "" : "pages/"}${path}`,
          { headers: { "User-Agent": UA }, cache: "no-store" }
        );
        if (!jsRes.ok) continue;
        const js = await jsRes.text();

        // Pattern moderne : "/api/seek/".concat("hash")
        const concat = js.match(/"\/api\/(\w+)\/"\.concat\("(\w+)"\)/);
        if (concat) {
          cachedEndpoint = `/api/${concat[1]}/${concat[2]}`;
          cachedAt = Date.now();
          console.log("[hltb] endpoint discovered:", cachedEndpoint);
          return cachedEndpoint;
        }
        // Pattern alternatif : path littéral /api/word/hash
        const literal = js.match(/\/api\/(?:seek|search|find|lookup)\/[\w]{6,}/);
        if (literal) {
          cachedEndpoint = literal[0];
          cachedAt = Date.now();
          console.log("[hltb] endpoint discovered:", cachedEndpoint);
          return cachedEndpoint;
        }
      } catch {
        // continue avec le bundle suivant
      }
    }

    console.warn("[hltb] aucun endpoint trouvé dans les bundles");
  } catch (e) {
    console.error("[hltb] discovery failed:", e);
  }

  return null;
}

export async function getHowLongToBeat(name: string): Promise<HLTBData> {
  const empty: HLTBData = {
    mainStory: null,
    mainExtra: null,
    completionist: null,
  };

  const endpoint = await discoverEndpoint();
  if (!endpoint) return empty;

  const payload = {
    searchType: "games",
    searchTerms: name.split(/\s+/).filter(Boolean),
    searchPage: 1,
    size: 5,
    searchOptions: {
      games: {
        userId: 0,
        platform: "",
        sortCategory: "popular",
        rangeCategory: "main",
        rangeTime: { min: null, max: null },
        gameplay: { perspective: "", flow: "", genre: "" },
        rangeYear: { min: "", max: "" },
        modifier: "",
      },
      users: { sortCategory: "postcount" },
      filter: "",
      sort: 0,
      randomizer: 0,
    },
  };

  try {
    const res = await fetch(HLTB_HOST + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        Origin: HLTB_HOST,
        Referer: HLTB_HOST + "/",
        Accept: "*/*",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[hltb] search ${res.status} for "${name}"`);
      // Force la redécouverte au prochain appel : peut-être que le hash a changé
      cachedEndpoint = null;
      return empty;
    }

    const data = await res.json();
    const game = data?.data?.[0];
    if (!game) return empty;

    // Les champs HLTB sont en secondes
    const toHours = (s: unknown): number | null => {
      if (typeof s !== "number" || s <= 0) return null;
      return Math.round(s / 3600);
    };

    return {
      mainStory: toHours(game.comp_main),
      mainExtra: toHours(game.comp_plus),
      completionist: toHours(game.comp_100),
    };
  } catch (e) {
    console.error(`[hltb] search failed for "${name}":`, e);
    return empty;
  }
}
