// lib/enrichment/opencritic.ts
//
// OpenCritic agrège les notes de la presse spécialisée.
// Son API est gratuite et ne nécessite pas de clé pour les recherches.

export interface OpenCriticData {
  score: number | null;      // Note moyenne (sur 100)
  tier: string | null;       // "Mighty", "Strong", "Fair", "Weak"
  reviewCount: number | null;
}

export async function getOpenCriticScore(
  gameName: string
): Promise<OpenCriticData> {
  try {
    // Étape 1 : chercher le jeu par nom
    const searchRes = await fetch(
      `https://api.opencritic.com/api/game/search?criteria=${encodeURIComponent(gameName)}`,
      { next: { revalidate: 86400 } } // Cache 24h
    );

    if (!searchRes.ok) {
      return { score: null, tier: null, reviewCount: null };
    }

    const searchResults = await searchRes.json();
    if (!searchResults || searchResults.length === 0) {
      return { score: null, tier: null, reviewCount: null };
    }

    // On prend le premier résultat
    const gameId = searchResults[0].id;

    // Étape 2 : récupérer les détails de ce jeu
    const detailRes = await fetch(
      `https://api.opencritic.com/api/game/${gameId}`,
      { next: { revalidate: 86400 } }
    );

    if (!detailRes.ok) {
      return { score: null, tier: null, reviewCount: null };
    }

    const detail = await detailRes.json();

    return {
      score: Math.round(detail.averageScore) || null,
      tier: detail.tier || null,
      reviewCount: detail.numReviews || null,
    };
  } catch {
    return { score: null, tier: null, reviewCount: null };
  }
}