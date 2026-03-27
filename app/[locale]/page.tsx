"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Session {
  isLoggedIn: boolean;
  name?: string;
  avatar?: string;
  steamid?: string;
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-gray-500 text-lg animate-pulse">{t("common.loading")}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8">

        <div className="w-full flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-3">
            🎮 {t("common.appName")}
          </h1>
          <p className="text-gray-400 text-lg">
            {session?.isLoggedIn
              ? t("home.taglineLoggedIn", { name: session.name })
              : t("home.taglineGuest")}
          </p>
        </div>

        {session?.isLoggedIn ? (
          <>
            <div className="flex items-center gap-3 bg-[#1a1f2e] rounded-xl px-4 py-3 w-full">
              {session.avatar && (
                <Image
                  src={session.avatar}
                  alt={session.name ?? ""}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-white font-medium">{session.name}</p>
                <p className="text-gray-500 text-xs">{t("home.connectedViaSteam")}</p>
              </div>
              <a
                href="/api/auth/logout"
                className="ml-auto text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                {t("home.logout")}
              </a>
            </div>

            <button
              onClick={() => router.push("/library")}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-2xl py-6 rounded-2xl transition-all duration-150"
            >
              {t("home.randomGame")}
            </button>

            <Link
              href="/library"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors underline underline-offset-4"
            >
              {t("home.viewLibrary")}
            </Link>
          </>
        ) : (
          <a
            href="/api/auth/login"
            className="w-full bg-[#1b2838] hover:bg-[#2a3f5f] border border-[#4a90d9] text-[#4a90d9] font-semibold text-lg py-4 rounded-xl text-center transition-colors"
          >
            {t("home.loginWithSteam")}
          </a>
        )}

      </div>
    </main>
  );
}
