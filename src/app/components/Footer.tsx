"use client";

import Image from "next/image";
import { useTranslations } from "@/app/LanguageProvider";

export default function Footer() {
  const t = useTranslations("common.footer");
  const email = t("contact");

  return (
    <footer className="footer" style={{ height: "var(--footer-h)" }}>
      <div className="footer-inner">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt={t("logoAlt")}
            width={110}
            height={28}
            className="h-6 w-auto object-contain"
            priority
          />
          <span>{t("copy")}</span>
        </div>

        <div className="text-right">
          {t("developedBy", { name: "Federico Iñigo" })} ·{" "}
          <a href={`mailto:${email}`} className="underline decoration-white/40 hover:decoration-white">
            {email}
          </a>
        </div>
      </div>
    </footer>
  );
}
