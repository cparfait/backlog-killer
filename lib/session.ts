// lib/session.ts
//
// Définit la structure et la configuration de notre session cookie.
// iron-session chiffre les données dans un cookie HTTP-only :
// le contenu est illisible depuis JavaScript côté client,
// ce qui empêche le vol de session via XSS.

import { SessionOptions } from "iron-session";

// Structure des données qu'on stocke en session
export interface SessionData {
  steamid: string;
  name: string;
  avatar: string;
  profileurl: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  // Clé de chiffrement — doit faire au moins 32 caractères
  password: process.env.NEXTAUTH_SECRET as string,
  // Nom du cookie dans le navigateur
  cookieName: "backlog-killer-session",
  cookieOptions: {
    // secure: true en production (HTTPS), false en local (HTTP)
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,   // Inaccessible depuis JavaScript côté client
    sameSite: "lax",  // Protection CSRF
  },
};