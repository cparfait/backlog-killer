"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Session {
  isLoggedIn: boolean;
  name?: string;
  avatar?: string;
  steamid?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const setupRes = await fetch("/api/setup").then((r) => r.json());
      if (!setupRes.configured) {
        router.replace("/setup");
        return;
      }
      const sessionData = await fetch("/api/auth/session").then((r) =>
        r.json()
      );
      if (!sessionData.isLoggedIn) {
        router.push("/");
        return;
      }
      setSession(sessionData);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_50%)] pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative">

        <div className="text-center space-y-4">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Bienvenue
          </p>
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
            Salut,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {session?.name}
            </span>{" "}
            !
          </h1>
          <p className="text-zinc-400 text-lg">
            Prêt à attaquer ton backlog ?
          </p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
          {session?.avatar && (
            <Image
              src={session.avatar}
              alt={session.name ?? ""}
              width={72}
              height={72}
              className="rounded-full ring-2 ring-zinc-800"
            />
          )}
          <div>
            <p className="text-white font-semibold text-xl">{session?.name}</p>
            <p className="text-zinc-500 text-sm">Connecté via Steam</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Ce qui t&apos;attend
          </h2>
          <ul className="text-zinc-300 text-sm space-y-3">
            <Bullet>Un tirage aléatoire dans toute ta bibliothèque Steam.</Bullet>
            <Bullet>
              Des filtres malins : jamais joué, court, bien noté…
            </Bullet>
            <Bullet>
              Mode duel : deux jeux, tu choisis ton préféré.
            </Bullet>
            <Bullet>
              Fiche enrichie avec OpenCritic, HowLongToBeat, prix, trailer.
            </Bullet>
            <Bullet>Lancement direct dans Steam en un clic.</Bullet>
          </ul>
          <p className="text-zinc-600 text-xs pt-2">
            ⚠️ Ton profil Steam doit être en mode Public pour que ta
            bibliothèque soit accessible.
          </p>
        </div>

        <button
          onClick={() => router.push("/library")}
          className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] text-white font-bold text-xl py-5 rounded-2xl transition-all shadow-2xl shadow-blue-900/40"
        >
          🎲 C&apos;est parti
        </button>

      </div>
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-blue-400 mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  );
}
