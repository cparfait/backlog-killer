import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "es", "de"],
  defaultLocale: "fr",
});
