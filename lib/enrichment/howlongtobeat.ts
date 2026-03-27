// lib/enrichment/howlongtobeat.ts
//
// La bibliothèque howlongtobeat utilise le format CommonJS (module.exports)
// et non ES Modules (export default). Pour l'importer correctement
// dans TypeScript, on utilise "require" au lieu de "import".

const { HowLongToBeatService } = require("howlongtobeat");

export interface HLTBData {
  mainStory: number | null;
  mainExtra: number | null;
  completionist: number | null;
}

const hltbService = new HowLongToBeatService();

export async function getHowLongToBeat(gameName: string): Promise<HLTBData> {
  try {
    const results = await hltbService.search(gameName);

    if (!results || results.length === 0) {
      return { mainStory: null, mainExtra: null, completionist: null };
    }

    const best = results[0];

    return {
      mainStory: best.gameplayMain || null,
      mainExtra: best.gameplayMainExtra || null,
      completionist: best.gameplayCompletionist || null,
    };
  } catch {
    return { mainStory: null, mainExtra: null, completionist: null };
  }
}