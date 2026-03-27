// app/api/auth/[...nextauth]/route.ts
//
// Ce fichier est LE point d'entrée de toute l'authentification.
// Le nom "[...nextauth]" est une convention Next.js : il signifie
// "attrape toutes les URLs qui commencent par /api/auth/".
// NextAuth gérera automatiquement /api/auth/signin, /api/auth/callback/steam,
// /api/auth/signout, etc.

import NextAuth from "next-auth";
import { SteamProvider } from "@/lib/steam/steamProvider";

// On exporte le handler NextAuth avec notre configuration
const handler = NextAuth({
  providers: [
    // On branche notre provider Steam personnalisé
    SteamProvider() as any,
  ],

  callbacks: {
    // Le callback "jwt" est appelé à chaque fois qu'un token JWT est créé
    // ou mis à jour. C'est ici qu'on "injecte" le SteamID dans le token.
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // On copie le SteamID et les infos de profil dans le token JWT
        // "as any" parce que NextAuth ne connaît pas nos champs Steam
        const steamProfile = profile as any;
        token.steamid = steamProfile.id;
        token.name = steamProfile.personaname;
        token.image = steamProfile.avatarfull;
        token.profileurl = steamProfile.profileurl;
        token.communityvisibilitystate = steamProfile.communityvisibilitystate;
      }
      return token;
    },

    // Le callback "session" expose les données du token JWT
    // au frontend via le hook useSession()
    async session({ session, token }) {
      if (session.user) {
        // On expose le SteamID côté client (c'est public, pas sensible)
        (session.user as any).steamid = token.steamid;
        (session.user as any).profileurl = token.profileurl;
        (session.user as any).communityvisibilitystate =
          token.communityvisibilitystate;
      }
      return session;
    },
  },

  // Pages personnalisées (on créera ces pages au frontend - Étape 4)
  pages: {
    signIn: "/",         // Page de connexion = notre accueil
    error: "/auth/error", // Page d'erreur dédiée
  },
});

// Next.js App Router nécessite d'exporter GET et POST séparément
export { handler as GET, handler as POST };