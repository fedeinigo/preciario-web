import { locales } from "@/lib/i18n/config";

export function stripLocaleFromPath(pathname: string | null): string {
  if (!pathname) return "";

  const localePrefix = locales.find(
    (code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`)
  );

  if (!localePrefix) {
    return pathname;
  }

  const stripped = pathname.slice(localePrefix.length + 1);

  return stripped.length === 0 ? "/" : stripped;
}

export function isMapachePath(pathname: string | null): boolean {
  if (!pathname) return false;

  const normalized = stripLocaleFromPath(pathname);

  return normalized.startsWith("/portal/mapache");
}
