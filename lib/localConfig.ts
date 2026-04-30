// lib/localConfig.ts
//
// Stockage local de la configuration sensible (clé API Steam,
// secret de session). Les valeurs sont lues d'abord depuis les
// variables d'environnement, puis depuis `.local-config.json`
// à la racine du projet. Si SESSION_SECRET n'est défini nulle part,
// un secret aléatoire est généré automatiquement et persisté.
//
// `.local-config.json` est gitignoré et écrit en mode 0600 (lecture
// uniquement par le propriétaire) pour éviter qu'il fuite.

import fs from "fs";
import path from "path";
import crypto from "crypto";

interface LocalConfig {
  steamApiKey?: string;
  sessionSecret?: string;
}

const CONFIG_PATH = path.join(process.cwd(), ".local-config.json");
let cache: LocalConfig | null = null;

function read(): LocalConfig {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    cache = JSON.parse(raw) as LocalConfig;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: LocalConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
  cache = next;
}

export function getSteamApiKey(): string | null {
  if (process.env.STEAM_API_KEY) return process.env.STEAM_API_KEY;
  return read().steamApiKey ?? null;
}

export function setSteamApiKey(key: string) {
  const config = { ...read(), steamApiKey: key };
  write(config);
}

export function getSessionSecret(): string {
  const fromEnv =
    process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (fromEnv.length >= 32) return fromEnv;

  const config = read();
  if (config.sessionSecret && config.sessionSecret.length >= 32) {
    return config.sessionSecret;
  }
  // Génère et persiste un secret aléatoire de 64 caractères hex
  const generated = crypto.randomBytes(32).toString("hex");
  write({ ...config, sessionSecret: generated });
  return generated;
}

export function isSetupComplete(): boolean {
  return !!getSteamApiKey();
}
