// lib/steam/steamProvider.ts
//
// Implémentation manuelle d'OpenID 2.0 contre Steam.
// La lib `openid` historique repose sur des APIs Node dépréciées
// (url.parse) et échoue silencieusement sur Node 20+. Steam OpenID
// est suffisamment simple pour être implémenté à la main de manière
// plus fiable et auditable.

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";

// Base URL publique de l'application. Doit correspondre exactement à
// l'URL utilisée par le navigateur (sinon Steam refusera l'assertion).
// En l'absence d'env, on suppose le développement local sur :3000.
function getAppBaseUrl(): string {
  const url = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getReturnUrl(): string {
  return `${getAppBaseUrl()}/api/auth/callback`;
}

export function getRealm(): string {
  return getAppBaseUrl();
}

// Construit l'URL Steam vers laquelle rediriger l'utilisateur pour login
export function buildSteamLoginUrl(): string {
  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": getReturnUrl(),
    "openid.realm": getRealm(),
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

// Vérifie l'assertion OpenID renvoyée par Steam.
// Renvoie le SteamID64 si l'assertion est authentique, sinon null.
export async function verifySteamAssertion(
  searchParams: URLSearchParams
): Promise<string | null> {
  // Vérification basique des paramètres attendus
  if (searchParams.get("openid.mode") !== "id_res") return null;
  if (searchParams.get("openid.ns") !== OPENID_NS) return null;
  if (searchParams.get("openid.op_endpoint") !== STEAM_OPENID_URL) return null;

  // Le return_to renvoyé par Steam doit correspondre à notre callback,
  // sinon il s'agit d'une assertion destinée à un autre site.
  const returnTo = searchParams.get("openid.return_to");
  if (!returnTo || !returnTo.startsWith(getReturnUrl())) return null;

  // claimed_id contient le SteamID64. On l'extrait avant de demander
  // la vérification à Steam, mais on ne lui fait confiance qu'APRÈS
  // que Steam ait confirmé la signature.
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const steamIdMatch = claimedId.match(
    /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/
  );
  if (!steamIdMatch) return null;
  const steamId = steamIdMatch[1];

  // On renvoie tous les paramètres openid.* à Steam en remplaçant
  // openid.mode=id_res par openid.mode=check_authentication.
  // Steam recalcule la signature de son côté et nous dit si elle est valide.
  const verifyParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) verifyParams.set(key, value);
  }
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const body = await res.text();

  // La réponse est en Key-Value form ; on cherche `is_valid:true`
  const isValid = body
    .split("\n")
    .some((line) => line.trim() === "is_valid:true");

  return isValid ? steamId : null;
}
