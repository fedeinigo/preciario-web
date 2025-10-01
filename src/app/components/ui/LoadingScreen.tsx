// src/app/components/ui/LoadingScreen.tsx
"use client";

import { useTranslations } from "@/app/LanguageProvider";

export default function LoadingScreen() {
  const t = useTranslations("common.loading");
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-white text-gray-700"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent" />
        <p className="text-sm font-medium">{t("session")}</p>
      </div>
    </div>
  );
}
