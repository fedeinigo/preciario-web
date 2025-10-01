"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

import LanguageSelector from "@/app/components/LanguageSelector";
import { useTranslations } from "@/app/LanguageProvider";

export default function AuthLoginCard() {
  const t = useTranslations("auth.login");

  return (
    // Fondo degradado y tamaño exacto: alto de la ventana menos navbar+footer
    <div className="hero-bg min-h-[calc(100vh-var(--nav-h)-var(--footer-h))] w-full flex items-center justify-center px-4 py-10">
      <div className="auth-card w-full rounded-2xl border border-black/10 bg-[#2f3640] text-white shadow-xl shadow-black/20">
        {/* Header oscuro */}
        <div className="px-8 pt-8 text-center">
          <Image
            src="/logo.png"               // tu logo en /public/logo.png
            alt="Wise CX"
            width={160}
            height={40}
            className="auth-logo mx-auto mb-3 h-auto w-[180px] max-w-[60vw]"
            priority
          />
          <h1 className="text-xl font-extrabold">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/85">{t("subtitle")}</p>
        </div>

        {/* Acción */}
        <div className="px-8 pt-6 pb-7">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-lg border border-white/15 bg-white text-[15px] font-medium text-gray-800 hover:bg-white/95 transition inline-flex items-center justify-center gap-2 px-4 py-3"
          >
            <Image
              src="/google-logo.png"       // pon el archivo en /public/google-logo.png
              alt="Google"
              width={18}
              height={18}
              className="google-logo"
            />
            {t("googleCta")}
          </button>

          <p className="mt-3 text-center text-[12px] text-white/80">{t("disclaimer")}</p>
        </div>

        <div className="px-8 pb-6">
          <LanguageSelector className="text-white" />
        </div>
      </div>
    </div>
  );
}
