"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  fr: "🇫🇷 FR",
  en: "🇬🇧 EN",
  es: "🇪🇸 ES",
  de: "🇩🇪 DE",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`text-xs px-2 py-1 rounded-md transition-colors ${
            locale === loc
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1f2e]"
          }`}
        >
          {localeLabels[loc]}
        </button>
      ))}
    </div>
  );
}
