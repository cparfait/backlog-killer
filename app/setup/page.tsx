"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEAM_KEY_URL = "https://steamcommunity.com/dev/apikey";

export default function SetupPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.configured) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Vérification...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_50%)] pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative">

        <div className="text-center space-y-3">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em]">
            Configuration initiale
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Connecte-toi à Steam
          </h1>
          <p className="text-zinc-400">
            Une clé API Steam est nécessaire pour lire ta bibliothèque. Elle
            est gratuite et instantanée.
          </p>
        </div>

        <ol className="bg-zinc-900/40 backdrop-blur border border-zinc-800 rounded-2xl p-6 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </span>
            <span className="text-zinc-300">
              Ouvre la page Steam des clés API.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </span>
            <span className="text-zinc-300">
              Indique n&apos;importe quel nom de domaine (ex.{" "}
              <code className="bg-black/40 text-blue-300 px-1.5 py-0.5 rounded text-xs">
                localhost
              </code>
              ) et accepte les CGU.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </span>
            <span className="text-zinc-300">
              Copie la clé (32 caractères) et colle-la ci-dessous.
            </span>
          </li>
        </ol>

        <a
          href={STEAM_KEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-[#1b2838] hover:bg-[#2a3f5f] border border-[#4a90d9]/40 hover:border-[#4a90d9] text-[#4a90d9] hover:text-white font-semibold py-4 rounded-2xl transition-all"
        >
          🌐 Ouvrir la page de clé Steam
        </a>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Colle ta clé Steam (32 caractères hex)"
            className="w-full bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-4 font-mono text-sm outline-none focus:border-blue-600 focus:bg-zinc-900 transition-colors"
          />

          {error && (
            <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-900/50 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || key.trim().length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Vérification..." : "Valider la clé"}
          </button>
        </form>

        <p className="text-zinc-500 text-xs text-center">
          La clé est stockée localement dans{" "}
          <code className="text-zinc-400">.local-config.json</code> et n&apos;est
          jamais envoyée ailleurs que vers Steam.
        </p>

      </div>
    </main>
  );
}
