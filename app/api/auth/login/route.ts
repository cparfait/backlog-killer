// app/api/auth/login/route.ts
//
// Cette route est appelée quand l'utilisateur clique "Se connecter avec Steam".
// Elle demande à la bibliothèque OpenID de générer l'URL de redirection
// vers Steam, puis redirige le navigateur vers cette URL.

import { NextResponse } from "next/server";
import { relyingParty } from "@/lib/steam/steamProvider";

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    // authenticate() génère l'URL Steam vers laquelle rediriger l'utilisateur
    relyingParty.authenticate(
      "https://steamcommunity.com/openid", // Provider Steam
      false, // immediate=false : on veut la page de connexion normale
      (error, authUrl) => {
        if (error || !authUrl) {
          resolve(
            NextResponse.json(
              { error: "Impossible de contacter Steam" },
              { status: 500 }
            )
          );
          return;
        }
        // Redirige le navigateur vers la page de connexion Steam
        resolve(NextResponse.redirect(authUrl));
      }
    );
  });
}