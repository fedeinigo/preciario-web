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
    navbar: {
      ariaLabel: "Principal",
      tabs: {
        generator: "Generador",
        history: "Histórico",
        stats: "Estadísticas",
        goals: "Objetivos",
        teams: "Equipos",
        users: "Usuarios",
      },
      profile: {
        open: "Ver perfil",
        signOut: "Cerrar sesión",
      },
      modal: {
        title: "Mi perfil y objetivo",
        periodLabel: "Periodo",
        close: "Cerrar",
        save: "Guardar objetivo",
        labels: {
          role: "Rol",
          team: "Equipo",
          year: "Año",
          quarter: "Trimestre",
          goal: "Objetivo (USD)",
          currentGoal: "Objetivo actual",
          progress: "Ventas WON en periodo",
        },
        progressSuffix: " % del objetivo",
        log: {
          title: "Log",
          loading: "Cargando…",
          info: "Última actualización mostrada en pantalla.",
        },
      },
      toast: {
        goalSaved: "Objetivo actualizado",
        goalError: "No se pudo guardar el objetivo",
      },
      fallbacks: {
        userName: "Usuario",
        team: "—",
        email: "—",
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
    navbar: {
      ariaLabel: "Primary",
      tabs: {
        generator: "Generator",
        history: "History",
        stats: "Statistics",
        goals: "Goals",
        teams: "Teams",
        users: "Users",
      },
      profile: {
        open: "View profile",
        signOut: "Sign out",
      },
      modal: {
        title: "My profile and goal",
        periodLabel: "Period",
        close: "Close",
        save: "Save goal",
        labels: {
          role: "Role",
          team: "Team",
          year: "Year",
          quarter: "Quarter",
          goal: "Goal (USD)",
          currentGoal: "Current goal",
          progress: "Won sales in period",
        },
        progressSuffix: " % of goal",
        log: {
          title: "Log",
          loading: "Loading…",
          info: "Last update shown on screen.",
        },
      },
      toast: {
        goalSaved: "Goal updated",
        goalError: "The goal could not be saved",
      },
      fallbacks: {
        userName: "User",
        team: "—",
        email: "—",
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
    navbar: {
      ariaLabel: "Principal",
      tabs: {
        generator: "Gerador",
        history: "Histórico",
        stats: "Estatísticas",
        goals: "Metas",
        teams: "Equipes",
        users: "Usuários",
      },
      profile: {
        open: "Ver perfil",
        signOut: "Encerrar sessão",
      },
      modal: {
        title: "Meu perfil e meta",
        periodLabel: "Período",
        close: "Fechar",
        save: "Salvar meta",
        labels: {
          role: "Função",
          team: "Equipe",
          year: "Ano",
          quarter: "Trimestre",
          goal: "Meta (USD)",
          currentGoal: "Meta atual",
          progress: "Vendas WON no período",
        },
        progressSuffix: " % da meta",
        log: {
          title: "Log",
          loading: "Carregando…",
          info: "Última atualização mostrada na tela.",
        },
      },
      toast: {
        goalSaved: "Meta atualizada",
        goalError: "Não foi possível salvar a meta",
      },
      fallbacks: {
        userName: "Usuário",
        team: "—",
        email: "—",
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
