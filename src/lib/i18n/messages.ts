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
      generator: {
        heading: "Generador de Propuestas",
        emptyValue: "—",
        pipedrive: {
          label: "Link Pipedrive",
          placeholder: "Ej: {example}",
          description:
            "Pegá el enlace del trato en Pipedrive. Lo usamos para actualizar el valor, el one-shot, el enlace del documento y las líneas de productos.",
          invalid: "Formato inválido. Debe contener \"/deal/<ID>\".",
          detected: "ID detectado",
          exampleLink: "https://wcx.pipedrive.com/deal/42059",
        },
        company: {
          title: "Datos de la empresa",
          name: {
            label: "Nombre de la empresa",
            placeholder: "Ej: Acme S.A.",
          },
          country: {
            label: "País",
            placeholder: "Seleccione un país",
          },
          subsidiary: {
            label: "Filial",
            helper: "Se determina automáticamente según el país.",
          },
        },
        filters: {
          categoriesAll: "Todas las categorías",
          searchPlaceholder: "Filtrar por texto (nombre, descripción o SKU)",
        },
        order: {
          label: "Ordenar",
          options: {
            popular: "Más cotizados",
            sku: "SKU",
            unitPrice: "Unitario",
            name: "Ítem",
            category: "Categoría",
          },
        },
        actions: {
          addItem: "Agregar ítem",
          generate: "Generar propuesta",
          reset: "Restablecer",
        },
        totals: {
          monthly: "Total mensual",
        },
        confirmReset: {
          title: "Restablecer generador",
          cancel: "Cancelar",
          confirm: "Confirmar",
          message:
            "Esta acción limpia los campos y des-selecciona los ítems. ¿Deseas continuar?",
        },
        toast: {
          itemCreated: "Ítem creado",
          itemUpdated: "Ítem actualizado",
          itemSaveError: "Error guardando ítem: {message}",
          unknown: "Desconocido",
          selectItems: "Selecciona al menos un ítem para generar la propuesta.",
          fillCompany: "Completa Empresa, País y Filial antes de continuar.",
          pipedriveLinkRequired: "Pegá el Link de Pipedrive (formato: {example}).",
          reset: "Generador restablecido",
          pipedriveSyncFailed:
            "Se generó el documento, pero falló la sincronización con Pipedrive.",
          pipedriveSyncSuccess: "Propuesta sincronizada en Pipedrive.",
          pipedriveSyncUnavailable:
            "Se generó el documento, pero no se pudo contactar a Pipedrive.",
          proposalCreationError: "Error creando propuesta: {message}",
          whatsAppApplied: "Tarifas de WhatsApp aplicadas",
          whatsAppError: "No se pudo calcular WhatsApp",
          minutesApplied: "Minutos aplicados",
          minutesError: "No se pudo calcular Minutos",
          wiserApplied: "Wiser PRO agregado",
          itemDeleted: "Ítem eliminado",
          itemDeleteError: "No se pudo eliminar el ítem: {message}",
        },
        errors: {
          generic: "Error",
          missingDocumentUrl: "No se recibió la URL del documento.",
          missingItemDbId:
            "Ítem sin dbId (id UI: {id}). Actualiza el catálogo e intenta de nuevo.",
        },
      },
      summary: {
        title: "Resumen de la propuesta",
        company: { label: "Empresa" },
        country: { label: "País" },
        subsidiary: { label: "Filial" },
        table: {
          headers: {
            item: "Ítem",
            quantity: "Cant.",
            unitPrice: "Unitario",
            discount: "Desc. %",
            netUnit: "Unit. neto",
            subtotal: "Subtotal",
          },
          empty: "No hay ítems seleccionados.",
        },
        totals: {
          monthly: "Total mensual",
          hours: "Horas de desarrollo",
        },
        actions: {
          cancel: "Cancelar",
          generating: "Generando…",
          generate: "Generar documento",
        },
      },
      whatsAppModal: {
        title: "Calcular crédito WhatsApp",
        actions: {
          cancel: "Cancelar",
          calculating: "Calculando…",
          apply: "Aplicar",
        },
        badge: "Tipo: {kind}",
        hint: "Define la cantidad de créditos y el destino para obtener el precio.",
        fields: {
          qtySuffix: "créditos",
          qtyHelp: "Cantidad mensual estimada.",
          countryLabel: "País destino",
          countryPlaceholder: "Seleccione país",
          countryHelp: "Usado para el lookup de precios.",
          billingLabel: "Filial de facturación",
          billingHelp: "Determinada por el país de la propuesta.",
        },
        loading: "Calculando precios…",
        kinds: {
          marketing: "Marketing",
          utility: "Utility",
          auth: "Authentication",
        },
      },
      minutesModal: {
        title: "Calcular minutos de telefonía",
        actions: {
          cancel: "Cancelar",
          calculating: "Calculando…",
          apply: "Aplicar",
        },
        badge: "Tipo: {kind}",
        hint: "Minutos mensuales para cálculo del PPM.",
        fields: {
          qtySuffix: "min",
          qtyHelp: "Cantidad mensual estimada.",
          countryLabel: "País destino",
          countryLabelInbound: "País destino (no aplica para entrantes)",
          countryPlaceholder: "Seleccione país",
          countryHelp: "Se usa para el lookup de tarifas.",
          billingLabel: "Filial de facturación",
          billingHelp: "Determinada por el país de la propuesta.",
        },
        loading: "Calculando precios…",
        kinds: {
          out: "Salientes (min)",
          in: "Entrantes (min)",
        },
      },
      wiserModal: {
        title: "Wiser PRO",
        actions: {
          form: "Ir al formulario",
          confirm: "Confirmar e insertar",
          confirmTitle: "Insertar ítem con cantidad 1, precio 0 y horas 0",
        },
        content: {
          intro:
            "Para cotizar Wiser PRO necesitamos información adicional. Completa el formulario del equipo Mapaches y, mientras tanto, agregaremos el ítem con cantidad 1, precio 0 y horas 0.",
          followup: "Luego podrás actualizar el valor y reemitir la propuesta.",
        },
      },
      createdModal: {
        title: "¡Propuesta generada con éxito!",
        actions: {
          close: "Cerrar",
          copy: "Copiar enlace",
          view: "Ver propuesta",
        },
        body: {
          ready:
            "Tu documento ya está listo. Podés copiar el enlace o abrirlo en una nueva pestaña.",
          popups:
            "⚠️ Para abrir con “Ver propuesta” asegurate de tener habilitadas las ventanas emergentes en tu navegador.",
          linkLabel: "Enlace del documento",
        },
        toast: {
          copied: "Enlace copiado con éxito",
          copyError: "No se pudo copiar el enlace",
        },
      },
      itemForm: {
        title: {
          create: "Nuevo ítem",
          edit: "Editar ítem",
        },
        fields: {
          sku: {
            label: "SKU",
            optional: "(opcional)",
            placeholder: "ABC-123",
            duplicate: "Ya existe un ítem con este SKU.",
          },
          category: {
            label: "Categoría",
            showManagement: "Mostrar gestión de categorías",
            hideManagement: "Ocultar gestión de categorías",
          },
          name: {
            label: "Nombre",
            placeholder: "Nombre del ítem",
          },
          description: {
            label: "Descripción",
            placeholder: "Descripción corta...",
          },
          devHours: { label: "Horas de desarrollo" },
          unitPrice: { label: "Precio unitario (USD)" },
        },
        management: {
          title: "Gestión de categorías",
          selectPlaceholder: "(elige)",
          create: {
            title: "Crear nueva",
            placeholder: "Nombre de la categoría",
            action: "Crear",
          },
          rename: {
            title: "Renombrar existente",
            placeholder: "Nuevo nombre",
            action: "Aplicar",
          },
          delete: {
            title: "Eliminar / mover a",
            keepPlaceholder: "(sin mover)",
            action: "Eliminar / Mover",
            note:
              "* Si elegís destino, se mueven los ítems y se elimina la categoría origen.",
          },
        },
        actions: {
          cancel: "Cancelar",
          save: "Guardar",
          saving: "Guardando…",
        },
        toast: {
          loadCategoriesError: "No se pudieron cargar las categorías",
          createCategoryError: "No se pudo crear la categoría",
          createCategorySuccess: "Categoría creada",
          renameCategoryError: "No se pudo renombrar la categoría",
          renameCategorySuccess: "Categoría renombrada",
          deleteCategoryError: "No se pudo eliminar/mover la categoría",
          deleteCategorySuccess: "Categoría eliminada / ítems movidos",
          nameRequired: "El nombre es requerido",
          skuDuplicate: "El SKU ya existe. Por favor, elige otro.",
          unknown: "Desconocido",
          saveError: "No se pudo guardar el ítem: {message}",
        },
      },
      sidebars: {
        dialog: {
          cancel: "Cancelar",
          accept: "Aceptar",
          confirm: "Confirmar",
        },
        filiales: {
          title: "Filiales",
          buttons: {
            addGroup: "Agregar grupo",
            edit: "Editar",
            delete: "Eliminar",
            addCountry: "Agregar país",
          },
          empty: "Sin filiales aún.",
          prompts: {
            addGroup: {
              title: "Nombre del grupo/filial",
              label: "Grupo/Filial",
              placeholder: "Ej. FILIAL ARGENTINA",
            },
            editGroup: {
              title: "Editar nombre del grupo",
              label: "Nuevo nombre",
            },
            editCountry: {
              title: "Editar país",
              label: "Nombre del país",
            },
            addCountry: {
              title: "Agregar país al grupo",
              label: "País",
              placeholder: "Ej. Argentina",
            },
          },
          confirmations: {
            deleteGroup: {
              title: "Eliminar grupo",
              message: "¿Eliminar el grupo {group} y todos sus países?",
            },
            deleteCountry: {
              title: "Eliminar país",
              message: "¿Eliminar el país {country} del grupo {group}?",
            },
          },
        },
        glossary: {
          title: "Glosario",
          buttons: {
            add: "Agregar enlace",
            edit: "Editar",
            delete: "Eliminar",
          },
          empty: "Aún no hay enlaces.",
          prompts: {
            add: {
              title: "Nuevo enlace",
              label: "Etiqueta",
              labelPlaceholder: "Ej. Doc. Técnica",
              url: "URL",
              urlPlaceholder: "https://…",
            },
            edit: {
              title: "Editar enlace",
              label: "Etiqueta",
              url: "URL",
            },
          },
          confirmations: {
            delete: {
              title: "Eliminar enlace",
              message: "¿Eliminar el enlace {label}?",
            },
          },
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
      generator: {
        heading: "Proposal generator",
        emptyValue: "—",
        pipedrive: {
          label: "Pipedrive link",
          placeholder: "Ex: {example}",
          description:
            "Paste the deal link from Pipedrive. We'll use it to update the value, one-shot, document link and product lines.",
          invalid: "Invalid format. It must include \"/deal/<ID>\".",
          detected: "Detected ID",
          exampleLink: "https://wcx.pipedrive.com/deal/42059",
        },
        company: {
          title: "Company details",
          name: {
            label: "Company name",
            placeholder: "Ex: Acme Inc.",
          },
          country: {
            label: "Country",
            placeholder: "Select a country",
          },
          subsidiary: {
            label: "Subsidiary",
            helper: "Determined automatically based on the country.",
          },
        },
        filters: {
          categoriesAll: "All categories",
          searchPlaceholder: "Filter by text (name, description or SKU)",
        },
        order: {
          label: "Sort",
          options: {
            popular: "Most quoted",
            sku: "SKU",
            unitPrice: "Unit price",
            name: "Item",
            category: "Category",
          },
        },
        actions: {
          addItem: "Add item",
          generate: "Generate proposal",
          reset: "Reset",
        },
        totals: {
          monthly: "Monthly total",
        },
        confirmReset: {
          title: "Reset generator",
          cancel: "Cancel",
          confirm: "Confirm",
          message: "This will clear the fields and unselect the items. Continue?",
        },
        toast: {
          itemCreated: "Item created",
          itemUpdated: "Item updated",
          itemSaveError: "Error saving item: {message}",
          unknown: "Unknown",
          selectItems: "Select at least one item to generate the proposal.",
          fillCompany: "Fill in Company, Country and Subsidiary before continuing.",
          pipedriveLinkRequired: "Paste the Pipedrive link (format: {example}).",
          reset: "Generator reset",
          pipedriveSyncFailed:
            "The document was generated, but syncing with Pipedrive failed.",
          pipedriveSyncSuccess: "Proposal synced to Pipedrive.",
          pipedriveSyncUnavailable:
            "The document was generated, but Pipedrive could not be reached.",
          proposalCreationError: "Error creating proposal: {message}",
          whatsAppApplied: "WhatsApp pricing applied",
          whatsAppError: "Could not calculate WhatsApp",
          minutesApplied: "Minutes applied",
          minutesError: "Could not calculate Minutes",
          wiserApplied: "Wiser PRO added",
          itemDeleted: "Item deleted",
          itemDeleteError: "Could not delete the item: {message}",
        },
        errors: {
          generic: "Error",
          missingDocumentUrl: "The document URL was not received.",
          missingItemDbId:
            "Item missing dbId (UI id: {id}). Refresh the catalog and try again.",
        },
      },
      summary: {
        title: "Proposal summary",
        company: { label: "Company" },
        country: { label: "Country" },
        subsidiary: { label: "Subsidiary" },
        table: {
          headers: {
            item: "Item",
            quantity: "Qty.",
            unitPrice: "Unit price",
            discount: "Discount %",
            netUnit: "Net unit",
            subtotal: "Subtotal",
          },
          empty: "No items selected.",
        },
        totals: {
          monthly: "Monthly total",
          hours: "Development hours",
        },
        actions: {
          cancel: "Cancel",
          generating: "Generating…",
          generate: "Generate document",
        },
      },
      whatsAppModal: {
        title: "Calculate WhatsApp credit",
        actions: {
          cancel: "Cancel",
          calculating: "Calculating…",
          apply: "Apply",
        },
        badge: "Type: {kind}",
        hint: "Set the credit quantity and destination to obtain the price.",
        fields: {
          qtySuffix: "credits",
          qtyHelp: "Estimated monthly quantity.",
          countryLabel: "Destination country",
          countryPlaceholder: "Select a country",
          countryHelp: "Used for price lookup.",
          billingLabel: "Billing subsidiary",
          billingHelp: "Determined by the proposal's country.",
        },
        loading: "Calculating prices…",
        kinds: {
          marketing: "Marketing",
          utility: "Utility",
          auth: "Authentication",
        },
      },
      minutesModal: {
        title: "Calculate telephony minutes",
        actions: {
          cancel: "Cancel",
          calculating: "Calculating…",
          apply: "Apply",
        },
        badge: "Type: {kind}",
        hint: "Monthly minutes used to calculate the PPM.",
        fields: {
          qtySuffix: "min",
          qtyHelp: "Estimated monthly quantity.",
          countryLabel: "Destination country",
          countryLabelInbound: "Destination country (not applicable for inbound)",
          countryPlaceholder: "Select a country",
          countryHelp: "Used for rate lookup.",
          billingLabel: "Billing subsidiary",
          billingHelp: "Determined by the proposal's country.",
        },
        loading: "Calculating prices…",
        kinds: {
          out: "Outbound (min)",
          in: "Inbound (min)",
        },
      },
      wiserModal: {
        title: "Wiser PRO",
        actions: {
          form: "Go to form",
          confirm: "Confirm and insert",
          confirmTitle: "Insert item with quantity 1, price 0 and hours 0",
        },
        content: {
          intro:
            "To quote Wiser PRO we need additional information. Fill out the Mapaches team form and we'll temporarily add the item with quantity 1, price 0 and hours 0.",
          followup: "You can update the value and reissue the proposal later.",
        },
      },
      createdModal: {
        title: "Proposal generated successfully!",
        actions: {
          close: "Close",
          copy: "Copy link",
          view: "View proposal",
        },
        body: {
          ready:
            "Your document is ready. You can copy the link or open it in a new tab.",
          popups:
            "⚠️ To open with “View proposal”, make sure pop-ups are enabled in your browser.",
          linkLabel: "Document link",
        },
        toast: {
          copied: "Link copied successfully",
          copyError: "The link could not be copied",
        },
      },
      itemForm: {
        title: {
          create: "New item",
          edit: "Edit item",
        },
        fields: {
          sku: {
            label: "SKU",
            optional: "(optional)",
            placeholder: "ABC-123",
            duplicate: "An item with this SKU already exists.",
          },
          category: {
            label: "Category",
            showManagement: "Show category management",
            hideManagement: "Hide category management",
          },
          name: {
            label: "Name",
            placeholder: "Item name",
          },
          description: {
            label: "Description",
            placeholder: "Short description...",
          },
          devHours: { label: "Development hours" },
          unitPrice: { label: "Unit price (USD)" },
        },
        management: {
          title: "Category management",
          selectPlaceholder: "(select)",
          create: {
            title: "Create new",
            placeholder: "Category name",
            action: "Create",
          },
          rename: {
            title: "Rename existing",
            placeholder: "New name",
            action: "Apply",
          },
          delete: {
            title: "Delete / move to",
            keepPlaceholder: "(keep items)",
            action: "Delete / Move",
            note:
              "* If you choose a destination, the items are moved and the original category is removed.",
          },
        },
        actions: {
          cancel: "Cancel",
          save: "Save",
          saving: "Saving…",
        },
        toast: {
          loadCategoriesError: "Categories could not be loaded",
          createCategoryError: "Category could not be created",
          createCategorySuccess: "Category created",
          renameCategoryError: "Category could not be renamed",
          renameCategorySuccess: "Category renamed",
          deleteCategoryError: "Category could not be deleted/moved",
          deleteCategorySuccess: "Category deleted / items moved",
          nameRequired: "Name is required",
          skuDuplicate: "The SKU already exists. Please choose another one.",
          unknown: "Unknown",
          saveError: "Item could not be saved: {message}",
        },
      },
      sidebars: {
        dialog: {
          cancel: "Cancel",
          accept: "Accept",
          confirm: "Confirm",
        },
        filiales: {
          title: "Subsidiaries",
          buttons: {
            addGroup: "Add group",
            edit: "Edit",
            delete: "Delete",
            addCountry: "Add country",
          },
          empty: "No subsidiaries yet.",
          prompts: {
            addGroup: {
              title: "Group/Subsidiary name",
              label: "Group/Subsidiary",
              placeholder: "Ex. SUBSIDIARY ARGENTINA",
            },
            editGroup: {
              title: "Edit group name",
              label: "New name",
            },
            editCountry: {
              title: "Edit country",
              label: "Country name",
            },
            addCountry: {
              title: "Add country to group",
              label: "Country",
              placeholder: "Ex. Argentina",
            },
          },
          confirmations: {
            deleteGroup: {
              title: "Delete group",
              message: "Delete group {group} and all its countries?",
            },
            deleteCountry: {
              title: "Delete country",
              message: "Delete country {country} from group {group}?",
            },
          },
        },
        glossary: {
          title: "Glossary",
          buttons: {
            add: "Add link",
            edit: "Edit",
            delete: "Delete",
          },
          empty: "No links yet.",
          prompts: {
            add: {
              title: "New link",
              label: "Label",
              labelPlaceholder: "Ex. Technical doc",
              url: "URL",
              urlPlaceholder: "https://…",
            },
            edit: {
              title: "Edit link",
              label: "Label",
              url: "URL",
            },
          },
          confirmations: {
            delete: {
              title: "Delete link",
              message: "Delete link {label}?",
            },
          },
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
      generator: {
        heading: "Gerador de Propostas",
        emptyValue: "—",
        pipedrive: {
          label: "Link do Pipedrive",
          placeholder: "Ex: {example}",
          description:
            "Cole o link do negócio no Pipedrive. Usamos para atualizar o valor, o one-shot, o link do documento e as linhas de produtos.",
          invalid: "Formato inválido. Deve conter \"/deal/<ID>\".",
          detected: "ID detectado",
          exampleLink: "https://wcx.pipedrive.com/deal/42059",
        },
        company: {
          title: "Dados da empresa",
          name: {
            label: "Nome da empresa",
            placeholder: "Ex: Acme S.A.",
          },
          country: {
            label: "País",
            placeholder: "Selecione um país",
          },
          subsidiary: {
            label: "Filial",
            helper: "É determinada automaticamente conforme o país.",
          },
        },
        filters: {
          categoriesAll: "Todas as categorias",
          searchPlaceholder: "Filtrar por texto (nome, descrição ou SKU)",
        },
        order: {
          label: "Ordenar",
          options: {
            popular: "Mais cotados",
            sku: "SKU",
            unitPrice: "Unitário",
            name: "Item",
            category: "Categoria",
          },
        },
        actions: {
          addItem: "Adicionar item",
          generate: "Gerar proposta",
          reset: "Redefinir",
        },
        totals: {
          monthly: "Total mensal",
        },
        confirmReset: {
          title: "Redefinir gerador",
          cancel: "Cancelar",
          confirm: "Confirmar",
          message:
            "Esta ação limpa os campos e desmarca os itens. Deseja continuar?",
        },
        toast: {
          itemCreated: "Item criado",
          itemUpdated: "Item atualizado",
          itemSaveError: "Erro ao salvar o item: {message}",
          unknown: "Desconhecido",
          selectItems: "Selecione pelo menos um item para gerar a proposta.",
          fillCompany: "Preencha Empresa, País e Filial antes de continuar.",
          pipedriveLinkRequired: "Cole o link do Pipedrive (formato: {example}).",
          reset: "Gerador redefinido",
          pipedriveSyncFailed:
            "O documento foi gerado, mas a sincronização com o Pipedrive falhou.",
          pipedriveSyncSuccess: "Proposta sincronizada no Pipedrive.",
          pipedriveSyncUnavailable:
            "O documento foi gerado, mas não foi possível contatar o Pipedrive.",
          proposalCreationError: "Erro ao criar a proposta: {message}",
          whatsAppApplied: "Valores de WhatsApp aplicados",
          whatsAppError: "Não foi possível calcular WhatsApp",
          minutesApplied: "Minutos aplicados",
          minutesError: "Não foi possível calcular Minutos",
          wiserApplied: "Wiser PRO adicionado",
          itemDeleted: "Item excluído",
          itemDeleteError: "Não foi possível excluir o item: {message}",
        },
        errors: {
          generic: "Erro",
          missingDocumentUrl: "A URL do documento não foi recebida.",
          missingItemDbId:
            "Item sem dbId (id da interface: {id}). Atualize o catálogo e tente novamente.",
        },
      },
      summary: {
        title: "Resumo da proposta",
        company: { label: "Empresa" },
        country: { label: "País" },
        subsidiary: { label: "Filial" },
        table: {
          headers: {
            item: "Item",
            quantity: "Qtd.",
            unitPrice: "Unitário",
            discount: "Desc. %",
            netUnit: "Unit. líquido",
            subtotal: "Subtotal",
          },
          empty: "Nenhum item selecionado.",
        },
        totals: {
          monthly: "Total mensal",
          hours: "Horas de desenvolvimento",
        },
        actions: {
          cancel: "Cancelar",
          generating: "Gerando…",
          generate: "Gerar documento",
        },
      },
      whatsAppModal: {
        title: "Calcular crédito WhatsApp",
        actions: {
          cancel: "Cancelar",
          calculating: "Calculando…",
          apply: "Aplicar",
        },
        badge: "Tipo: {kind}",
        hint: "Defina a quantidade de créditos e o destino para obter o preço.",
        fields: {
          qtySuffix: "créditos",
          qtyHelp: "Quantidade mensal estimada.",
          countryLabel: "País de destino",
          countryPlaceholder: "Selecione um país",
          countryHelp: "Usado para buscar os preços.",
          billingLabel: "Filial de faturamento",
          billingHelp: "Determinada pelo país da proposta.",
        },
        loading: "Calculando preços…",
        kinds: {
          marketing: "Marketing",
          utility: "Utility",
          auth: "Authentication",
        },
      },
      minutesModal: {
        title: "Calcular minutos de telefonia",
        actions: {
          cancel: "Cancelar",
          calculating: "Calculando…",
          apply: "Aplicar",
        },
        badge: "Tipo: {kind}",
        hint: "Minutos mensais usados para calcular o PPM.",
        fields: {
          qtySuffix: "min",
          qtyHelp: "Quantidade mensal estimada.",
          countryLabel: "País de destino",
          countryLabelInbound: "País de destino (não se aplica a entrantes)",
          countryPlaceholder: "Selecione um país",
          countryHelp: "Usado para buscar as tarifas.",
          billingLabel: "Filial de faturamento",
          billingHelp: "Determinada pelo país da proposta.",
        },
        loading: "Calculando preços…",
        kinds: {
          out: "Saída (min)",
          in: "Entrada (min)",
        },
      },
      wiserModal: {
        title: "Wiser PRO",
        actions: {
          form: "Ir para o formulário",
          confirm: "Confirmar e inserir",
          confirmTitle: "Inserir item com quantidade 1, preço 0 e horas 0",
        },
        content: {
          intro:
            "Para cotar o Wiser PRO precisamos de informações adicionais. Preencha o formulário da equipe Mapaches e, enquanto isso, adicionaremos o item com quantidade 1, preço 0 e horas 0.",
          followup: "Depois você poderá atualizar o valor e reenviar a proposta.",
        },
      },
      createdModal: {
        title: "Proposta gerada com sucesso!",
        actions: {
          close: "Fechar",
          copy: "Copiar link",
          view: "Ver proposta",
        },
        body: {
          ready:
            "Seu documento está pronto. Você pode copiar o link ou abrir em uma nova guia.",
          popups:
            "⚠️ Para abrir com “Ver proposta”, certifique-se de que os pop-ups estejam habilitados no seu navegador.",
          linkLabel: "Link do documento",
        },
        toast: {
          copied: "Link copiado com sucesso",
          copyError: "Não foi possível copiar o link",
        },
      },
      itemForm: {
        title: {
          create: "Novo item",
          edit: "Editar item",
        },
        fields: {
          sku: {
            label: "SKU",
            optional: "(opcional)",
            placeholder: "ABC-123",
            duplicate: "Já existe um item com este SKU.",
          },
          category: {
            label: "Categoria",
            showManagement: "Mostrar gerenciamento de categorias",
            hideManagement: "Ocultar gerenciamento de categorias",
          },
          name: {
            label: "Nome",
            placeholder: "Nome do item",
          },
          description: {
            label: "Descrição",
            placeholder: "Descrição curta...",
          },
          devHours: { label: "Horas de desenvolvimento" },
          unitPrice: { label: "Preço unitário (USD)" },
        },
        management: {
          title: "Gerenciamento de categorias",
          selectPlaceholder: "(selecione)",
          create: {
            title: "Criar nova",
            placeholder: "Nome da categoria",
            action: "Criar",
          },
          rename: {
            title: "Renomear existente",
            placeholder: "Novo nome",
            action: "Aplicar",
          },
          delete: {
            title: "Excluir / mover para",
            keepPlaceholder: "(manter itens)",
            action: "Excluir / Mover",
            note:
              "* Se você escolher um destino, os itens são movidos e a categoria de origem é removida.",
          },
        },
        actions: {
          cancel: "Cancelar",
          save: "Salvar",
          saving: "Salvando…",
        },
        toast: {
          loadCategoriesError: "Não foi possível carregar as categorias",
          createCategoryError: "Não foi possível criar a categoria",
          createCategorySuccess: "Categoria criada",
          renameCategoryError: "Não foi possível renomear a categoria",
          renameCategorySuccess: "Categoria renomeada",
          deleteCategoryError: "Não foi possível excluir/mover a categoria",
          deleteCategorySuccess: "Categoria excluída / itens movidos",
          nameRequired: "O nome é obrigatório",
          skuDuplicate: "O SKU já existe. Escolha outro.",
          unknown: "Desconhecido",
          saveError: "Não foi possível salvar o item: {message}",
        },
      },
      sidebars: {
        dialog: {
          cancel: "Cancelar",
          accept: "Aceitar",
          confirm: "Confirmar",
        },
        filiales: {
          title: "Filiais",
          buttons: {
            addGroup: "Adicionar grupo",
            edit: "Editar",
            delete: "Excluir",
            addCountry: "Adicionar país",
          },
          empty: "Ainda não há filiais.",
          prompts: {
            addGroup: {
              title: "Nome do grupo/filial",
              label: "Grupo/Filial",
              placeholder: "Ex. FILIAL ARGENTINA",
            },
            editGroup: {
              title: "Editar nome do grupo",
              label: "Novo nome",
            },
            editCountry: {
              title: "Editar país",
              label: "Nome do país",
            },
            addCountry: {
              title: "Adicionar país ao grupo",
              label: "País",
              placeholder: "Ex. Argentina",
            },
          },
          confirmations: {
            deleteGroup: {
              title: "Excluir grupo",
              message: "Excluir o grupo {group} e todos os seus países?",
            },
            deleteCountry: {
              title: "Excluir país",
              message: "Excluir o país {country} do grupo {group}?",
            },
          },
        },
        glossary: {
          title: "Glossário",
          buttons: {
            add: "Adicionar link",
            edit: "Editar",
            delete: "Excluir",
          },
          empty: "Ainda não há links.",
          prompts: {
            add: {
              title: "Novo link",
              label: "Etiqueta",
              labelPlaceholder: "Ex. Doc. técnica",
              url: "URL",
              urlPlaceholder: "https://…",
            },
            edit: {
              title: "Editar link",
              label: "Etiqueta",
              url: "URL",
            },
          },
          confirmations: {
            delete: {
              title: "Excluir link",
              message: "Excluir o link {label}?",
            },
          },
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
