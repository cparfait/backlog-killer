// app/api/auth/callback/route.ts
//
// Steam redirige l'utilisateur ici après qu'il s'est connecté.
// L'URL contient une "assertion" OpenID : une affirmation signée
// par Steam qui dit "cet utilisateur est bien SteamID XXXXXXX".
// On vérifie cette affirmation, puis on récupère le profil Steam,
// et enfin on crée une session cookie pour l'utilisateur.

import { NextRequest, NextResponse } from "next/server";
import { relyingParty, extractSteamId } from "@/lib/steam/steamProvider";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = request.url;

  return new Promise<NextResponse>(async (resolve) => {
    // verifyAssertion vérifie auprès de Steam que l'assertion est valide
    relyingParty.verifyAssertion(url, async (error, result) => {
      if (error || !result?.authenticated) {
        resolve(NextResponse.redirect(new URL("/?error=auth", request.url)));
        return;
      }

      // On extrait le SteamID64 depuis l'URL claim vérifiée
      const steamId = extractSteamId(result.claimedIdentifier ?? "");
      if (!steamId) {
        resolve(NextResponse.redirect(new URL("/?error=steamid", request.url)));
        return;
      }

      // On récupère le profil Steam via l'API Web Steam
      const apiKey = process.env.STEAM_API_KEY;
      const profileRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
      );
      const profileData = await profileRes.json();
      const player = profileData.response.players[0];

      // On crée la session : on stocke les infos dans un cookie chiffré
      const session = await getIronSession<SessionData>(
        await cookies(),
        sessionOptions
      );
      session.steamid = steamId;
      session.name = player.personaname;
      session.avatar = player.avatarfull;
      session.profileurl = player.profileurl;
      session.isLoggedIn = true;
      await session.save();

      // Redirige vers l'onboarding si première connexion,
      // sinon directement vers la bibliothèque
      resolve(NextResponse.redirect(new URL("/onboarding", request.url)));
    });
  });
}