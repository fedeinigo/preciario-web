import type { Locale } from "./config";

type DeepRecord = Record<string, string | DeepRecord>;

export const messages: Record<Locale, DeepRecord> = {
  es: {
    common: {
      language: {
        label: "Idioma",
        spanish: "Español",
        english: "Inglés",
        portuguese: "Portugués",
      },
    },
    auth: {
      login: {
        title: "Bienvenido al Preciario Web",
        subtitle: "Inicia sesión para generar propuestas.",
        googleCta: "Continuar con Google",
        disclaimer: "Al continuar aceptas las políticas internas de Wise CX.",
      },
    },
  },
  en: {
    common: {
      language: {
        label: "Language",
        spanish: "Spanish",
        english: "English",
        portuguese: "Portuguese",
      },
    },
    auth: {
      login: {
        title: "Welcome to Preciario Web",
        subtitle: "Sign in to generate proposals.",
        googleCta: "Continue with Google",
        disclaimer: "By continuing you accept Wise CX internal policies.",
      },
    },
  },
  pt: {
    common: {
      language: {
        label: "Idioma",
        spanish: "Espanhol",
        english: "Inglês",
        portuguese: "Português",
      },
    },
    auth: {
      login: {
        title: "Bem-vindo ao Preciario Web",
        subtitle: "Faça login para gerar propostas.",
        googleCta: "Continuar com o Google",
        disclaimer: "Ao continuar, você aceita as políticas internas da Wise CX.",
      },
    },
  },
};

function isRecord(value: string | DeepRecord): value is DeepRecord {
  return typeof value !== "string";
}

export function getMessage(locale: Locale, key: string, fallbackLocale: Locale): string {
  const path = key.split(".").filter(Boolean);

  const pick = (targetLocale: Locale): string | undefined => {
    let current: string | DeepRecord | undefined = messages[targetLocale];

    for (const segment of path) {
      if (!current) return undefined;

      if (isRecord(current)) {
        current = current[segment];
      } else {
        return segment === path[path.length - 1] ? current : undefined;
      }
    }

    return typeof current === "string" ? current : undefined;
  };

  return (
    pick(locale) ??
    (fallbackLocale !== locale ? pick(fallbackLocale) : undefined) ??
    key
  );
}
