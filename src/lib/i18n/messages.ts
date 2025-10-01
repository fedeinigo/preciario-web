import type { Locale } from "./config";

interface DeepRecord {
  [key: string]: string | DeepRecord;
}
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
    proposals: {
      onboarding: {
        title: "Selecciona tu equipo",
        intro:
          "Bienvenido. Para personalizar tu experiencia, indícanos a qué equipo perteneces.",
        selectPlaceholder: "(elige un equipo)",
        actions: {
          later: "Más tarde",
          save: "Guardar",
        },
        toasts: {
          saved: "Equipo guardado",
          error: "No se pudo guardar el equipo",
        },
      },
      itemsTable: {
        headers: {
          sku: "SKU",
          category: "Categoría",
          item: "Ítem",
          quantity: "Cant.",
          unitPrice: "Unitario",
          discount: "Descuento (%)",
          actions: "Acciones",
        },
        titles: {
          select: "Seleccionar ítem",
          quantity: "Cantidad",
          unitPrice: "Precio unitario (base)",
          discount: "Aplicar descuento al subtotal del ítem",
          discountInput: "Porcentaje de descuento (0 a 100)",
          selectAction: "Seleccionar para la propuesta",
          netUnit: "Unitario neto",
          unitPriceWithNet: "Neto: {value}",
          previous: "Anterior",
          next: "Siguiente",
        },
        actions: {
          edit: "Editar",
          delete: "Borrar",
        },
        empty: "No hay ítems.",
        pagination: {
          display: "Mostrando {start}–{end} de {total}",
          perPage: "{count} / página",
          previous: "Anterior",
          next: "Siguiente",
          pageStatus: "{current} / {total}",
        },
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
    proposals: {
      onboarding: {
        title: "Choose your team",
        intro:
          "Welcome! To personalize your experience, let us know which team you belong to.",
        selectPlaceholder: "(choose a team)",
        actions: {
          later: "Later",
          save: "Save",
        },
        toasts: {
          saved: "Team saved",
          error: "Could not save the team",
        },
      },
      itemsTable: {
        headers: {
          sku: "SKU",
          category: "Category",
          item: "Item",
          quantity: "Qty.",
          unitPrice: "Unit price",
          discount: "Discount (%)",
          actions: "Actions",
        },
        titles: {
          select: "Select item",
          quantity: "Quantity",
          unitPrice: "Base unit price",
          discount: "Apply a discount to the item subtotal",
          discountInput: "Discount percentage (0 to 100)",
          selectAction: "Select for the proposal",
          netUnit: "Net unit price",
          unitPriceWithNet: "Net: {value}",
          previous: "Previous",
          next: "Next",
        },
        actions: {
          edit: "Edit",
          delete: "Delete",
        },
        empty: "No items.",
        pagination: {
          display: "Showing {start}–{end} of {total}",
          perPage: "{count} / page",
          previous: "Previous",
          next: "Next",
          pageStatus: "{current} / {total}",
        },
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
    proposals: {
      onboarding: {
        title: "Selecione sua equipe",
        intro:
          "Bem-vindo. Para personalizar sua experiência, diga-nos a qual equipe você pertence.",
        selectPlaceholder: "(escolha uma equipe)",
        actions: {
          later: "Mais tarde",
          save: "Salvar",
        },
        toasts: {
          saved: "Equipe salva",
          error: "Não foi possível salvar a equipe",
        },
      },
      itemsTable: {
        headers: {
          sku: "SKU",
          category: "Categoria",
          item: "Item",
          quantity: "Qtd.",
          unitPrice: "Unitário",
          discount: "Desconto (%)",
          actions: "Ações",
        },
        titles: {
          select: "Selecionar item",
          quantity: "Quantidade",
          unitPrice: "Preço unitário (base)",
          discount: "Aplicar desconto ao subtotal do item",
          discountInput: "Porcentagem de desconto (0 a 100)",
          selectAction: "Selecionar para a proposta",
          netUnit: "Unitário líquido",
          unitPriceWithNet: "Líquido: {value}",
          previous: "Anterior",
          next: "Próximo",
        },
        actions: {
          edit: "Editar",
          delete: "Excluir",
        },
        empty: "Não há itens.",
        pagination: {
          display: "Mostrando {start}–{end} de {total}",
          perPage: "{count} / página",
          previous: "Anterior",
          next: "Próximo",
          pageStatus: "{current} / {total}",
        },
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
