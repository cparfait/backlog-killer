"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface Session {
  isLoggedIn: boolean;
  name?: string;
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isLoggedIn) {
          router.push("/");
        } else {
          setSession(data);
        }
      });
  }, [router]);

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#0f1117] text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">

        <div className="text-center space-y-3">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm block mb-4">
            {t("backLink")}
          </Link>
          <h1 className="text-4xl font-bold text-white">{t("title")}</h1>
          <p className="text-2xl text-gray-200">{t("welcome", { name: session.name })}</p>
          <p className="text-gray-400">{t("subtitle")}</p>
        </div>

        <Link
          href="/library"
          className="block w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xl py-5 rounded-2xl text-center transition-all duration-150"
        >
          {t("cta")}
        </Link>

      </div>
    </main>
  );
}
