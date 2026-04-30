// app/api/setup/route.ts
//
// GET  → renvoie l'état du setup (clé Steam configurée ou non)
// POST → enregistre une clé Steam après l'avoir validée auprès de Steam.
//        Refuse si une clé est déjà configurée (pour empêcher un
//        attaquant de l'écraser une fois l'app en service).

import { NextRequest, NextResponse } from "next/server";
import {
  getSteamApiKey,
  setSteamApiKey,
  isSetupComplete,
} from "@/lib/localConfig";

export async function GET() {
  return NextResponse.json({ configured: isSetupComplete() });
}

export async function POST(request: NextRequest) {
  if (getSteamApiKey()) {
    return NextResponse.json(
      { error: "Déjà configuré" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const key =
    typeof (body as { key?: unknown })?.key === "string"
      ? (body as { key: string }).key.trim()
      : "";

  // Les clés Steam font 32 caractères hexadécimaux majuscules.
  if (!/^[A-F0-9]{32}$/i.test(key)) {
    return NextResponse.json(
      { error: "Format de clé invalide (32 caractères hexadécimaux attendus)" },
      { status: 400 }
    );
  }

  // Validation : on appelle un endpoint Steam qui exige la clé.
  // GetSupportedAPIList renvoie 200 si la clé est valide, 401/403 sinon.
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/?key=${encodeURIComponent(
        key
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Clé refusée par Steam" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("[setup] validation network error:", e);
    return NextResponse.json(
      { error: "Impossible de joindre Steam pour valider la clé" },
      { status: 502 }
    );
  }

  setSteamApiKey(key);
  return NextResponse.json({ ok: true });
}
