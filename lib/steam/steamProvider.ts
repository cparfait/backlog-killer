// lib/steam/steamProvider.ts
//
// Ce fichier gère la vérification OpenID avec Steam.
// Steam utilise OpenID 2.0 : l'utilisateur est redirigé vers Steam,
// se connecte, puis Steam le renvoie vers nous avec une "claim" (une
// affirmation signée) contenant son SteamID64. On vérifie cette
// affirmation directement auprès de Steam pour s'assurer qu'elle
// est authentique et non falsifiée.

import { RelyingParty } from "openid";

// L'URL de retour que Steam utilisera après connexion
// Elle doit correspondre exactement à ce qu'on a déclaré à Steam
const RETURN_URL = "http://localhost:3000/api/auth/callback";
const REALM = "http://localhost:3000";

// On crée une instance "RelyingParty" : c'est notre application
// vue du côté du protocole OpenID. Elle sait comment parler à Steam.
export const relyingParty = new RelyingParty(
  RETURN_URL, // URL de callback
  REALM,      // Notre domaine
  true,       // stateless : pas besoin de stocker l'état entre requêtes
  false,      // strict mode désactivé (nécessaire pour Steam)
  []          // pas d'extensions OpenID supplémentaires
);

// Extrait le SteamID64 depuis l'URL OpenID retournée par Steam
// L'URL ressemble à : https://steamcommunity.com/openid/id/76561198012345678
export function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}