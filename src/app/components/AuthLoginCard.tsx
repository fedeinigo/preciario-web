"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

import LanguageSelector from "@/app/components/LanguageSelector";
import { useTranslations } from "@/app/LanguageProvider";

export default function AuthLoginCard() {
  const t = useTranslations("auth.login");

  return (
    <div className="hero-bg min-h-[calc(100vh-var(--nav-h)-var(--footer-h))] w-full flex items-center justify-center px-4 py-10">
      <div className="auth-card-modern w-full rounded-3xl border border-white/10 bg-gradient-to-br from-[#2f3640]/90 via-[#353b48]/80 to-[#2f3640]/90 backdrop-blur-xl text-white shadow-2xl shadow-black/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-violet-500/20 to-purple-600/20 blur-2xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="px-8 sm:px-12 pt-10 sm:pt-12 text-center">
            <div className="inline-block mb-6 transform transition-transform duration-300 hover:scale-105">
              <Image
                src="/logo.png"
                alt="Wise CX"
                width={200}
                height={50}
                className="auth-logo h-auto w-auto max-w-[200px] sm:max-w-[70vw] drop-shadow-lg"
                priority
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              {t("title")}
            </h1>
            <p className="text-sm sm:text-base text-white/70 font-light tracking-wide">{t("subtitle")}</p>
          </div>

          <div className="px-8 sm:px-12 pt-8 pb-8">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="group w-full rounded-xl border border-white/20 bg-white text-[15px] sm:text-base font-semibold text-gray-800 hover:bg-white transition-all duration-300 inline-flex items-center justify-center gap-3 px-5 py-3.5 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-100/30 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Image
                src="/google-logo.png"
                alt="Google"
                width={20}
                height={20}
                className="google-logo relative z-10 transition-transform duration-300 group-hover:rotate-12"
              />
              <span className="relative z-10">{t("googleCta")}</span>
            </button>

            <p className="mt-4 text-center text-xs sm:text-sm text-white/60 font-light">{t("disclaimer")}</p>
          </div>

          <div className="px-8 sm:px-12 pb-8">
            <div className="border-t border-white/10 pt-6">
              <LanguageSelector className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
