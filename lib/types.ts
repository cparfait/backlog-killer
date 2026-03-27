// lib/types.ts
//
// TypeScript est un langage "typé" : on déclare la forme de chaque objet.
// Sans ce fichier, TypeScript ne saurait pas que notre session contient
// un "steamid" (car ce champ n'existe pas dans NextAuth par défaut).
// On "augmente" les types existants de NextAuth avec nos champs Steam.

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      steamid: string;              // Ex: "76561198012345678"
      profileurl: string;           // Ex: "https://steamcommunity.com/id/..."
      communityvisibilitystate: number; // 1=privé, 3=public
    };
  }
}