// lib/session.ts
//
// Configuration de la session iron-session : cookie HTTP-only chiffré.

import { SessionOptions } from "iron-session";
import { getSessionSecret } from "./localConfig";

export interface SessionData {
  steamid: string;
  name: string;
  avatar: string;
  profileurl: string;
  isLoggedIn: boolean;
}

// Évalué à l'usage (pas à l'import) pour ne pas crasher le serveur
// si la config locale n'a pas encore été initialisée.
export const sessionOptions: SessionOptions = {
  get password() {
    return getSessionSecret();
  },
  cookieName: "backlog-killer-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
} as SessionOptions;
