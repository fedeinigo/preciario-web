import type { DeepRecord } from "./types";

const messages: DeepRecord = {

    common: {

      language: {

        label: "Idioma",

        spanish: "Español",

        english: "Inglés",

        portuguese: "Portugués",

      },

      combobox: {

        placeholder: "Seleccionar…",

        noResults: "Sin resultados",

        open: "Abrir",

      },

      dialog: {

        title: "Confirmar",

        confirm: "Confirmar",

        cancel: "Cancelar",

        processing: "Procesando…",

        required: "Este campo es obligatorio.",

      },

      loading: {

        session: "Cargando tu sesión…",

      },

      roles: {

        superadmin: "Superadmin",

        admin: "Admin",

        lider: "Líder",

        usuario: "Usuario",

        unknown: "Rol sin definir",

      },

      profileModal: {

        title: "Mi perfil y objetivo",

        periodSummary: "Periodo: {year} - Q{quarter} ({from} — {to})",

        buttons: {

          close: "Cerrar",

          save: "Guardar objetivo",

        },

        viewerBadge: "Edición por {role}",

        labels: {

          role: "Rol",

          team: "Equipo",

          position: "Posición",

          leader: "Líder",

          period: "Periodo y Objetivo",

          year: "Año",

          quarter: "Trimestre",

          goal: "Objetivo (USD)",

        },

        fallbacks: {

          name: "(sin nombre)",

          team: "—",

          email: "—",

          position: "—",

          leader: "—",

        },

      },

      footer: {

        logoAlt: "Wise CX",

        copy: "© 2025 Wise CX — Soluciones Inteligentes",

        developedBy: "Desarrollado por {name}",

        contact: "federico.i@wisecx.com",

      },

      teamSelectModal: {

        title: "Elegí tu equipo",

        description: "Esta selección se usará para segmentar Histórico y Estadísticas.",

        cancel: "Cancelar",

        confirm: "Confirmar",

        saving: "Guardando…",

      },

    },

    auth: {

      login: {

        title: "Bienvenido al Portal WCX",

        subtitle: "Inicia sesión para generar propuestas.",

        googleCta: "Continuar con Google",

        disclaimer: "Al continuar aceptas las políticas internas de Wise CX.",

      },

    },

    navbar: {

      logoAlt: "Wise CX",

      ariaLabel: "Principal",

      tabsAriaLabel: "Pestañas de navegación",

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

        mapachePortal: "Portal Mapache",

        mapachePortalReturn: "Generador Web",

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

        name: "Usuario",

        team: "—",

        email: "—",

      },

      mapachePortalSections: {

        pipedrive: "Pipedrive",

        goals: "Objetivos",

        generator: "Generador",

        tasks: "Tareas",

        metrics: "Métricas",

      },

      analyticsPortalTabs: {

        dashboard: "Dashboard",

        equipos: "Equipos",

        regiones: "Regiones",

        reuniones: "Reuniones",

        configuracion: "Config",

      },

      portalSwitcher: {

        button: "Portal",

        title: "Selecciona un portal",

        description: "Elige a que portal ingresar.",

        action: "Ingresar",

        loading: "Ingresando al portal",

        options: {

          direct: {

            label: "Portal Directo",

            description: "Generador web",

          },

          mapache: {

            label: "Portal Mapache",

            description: "Tablero del equipo Mapache",

          },

          partner: {

            label: "Portal Partner",

            description: "Recursos para partners administradores",

          },

          marketing: {

            label: "Portal Marketing",

            description: "Materiales y campanas de marketing",

          },

        },

      },

    },

    configurations: {

      title: "Configuraciones",

      description: "Administra equipos y usuarios del Portal Directo.",

      tabs: {

        home: "Inicio",

        teams: "Gestión de equipos",

        users: "Gestión de usuarios",

      },

      sections: {

        visit: "Ir a la sección",

        back: "Volver a Configuraciones",

      },

      teamPanel: {

        header: {

          title: "Gestión de equipos",

          description: "Creá, renombrá o eliminá equipos y administrá sus accesos a los portales.",

        },

        form: {

          title: "Crear equipo",

          subtitle: "Elegí un nombre descriptivo para organizar a tus usuarios.",

          placeholder: "Nombre del equipo",

          submit: "Agregar equipo",

        },

        summary: {

          label: "Equipos totales:",

        },

        table: {

          title: "Equipos activos",

          loading: "Actualizando equipos…",

          empty: "Todavía no hay equipos.",

          people: "personas",

          noPortals: "Sin accesos configurados.",

          headings: {

            team: "Equipo",

            leaders: "Líderes",

            members: "Miembros",

            portals: "Portales",

            actions: "Acciones",

          },

        },

        actions: {

          portals: "Portales",

          rename: "Renombrar",

          delete: "Eliminar",

        },

        rename: {

          title: "Renombrar equipo",

          description: "Actualizá el nombre para identificarlo fácilmente.",

          cancel: "Cancelar",

          save: "Guardar cambios",

        },

        portals: {

          title: "Accesos de {team}",

          description: "Aplicá o quitá accesos a portales para todos los integrantes del equipo.",

          members: "miembros",

          enable: "Habilitar",

          disable: "Revocar",

          empty: "El equipo todavía no tiene integrantes.",

          noChanges: "Los accesos ya estaban configurados.",

          updated: "Accesos de {team} a {portal} actualizados.",

          error: "No pudimos actualizar los accesos.",

          saving: "Aplicando cambios…",

        },

        dialogs: {

          delete: {

            title: "Eliminar equipo",

            description: "¿Seguro que querés eliminar el equipo {team}? Los usuarios quedarán sin equipo.",

            confirm: "Eliminar",

          },

        },

        toast: {

          createSuccess: "Equipo creado",

          createError: "No se pudo crear el equipo",

          renameSuccess: "Equipo renombrado",

          renameError: "No se pudo renombrar el equipo",

          deleteSuccess: "Equipo eliminado",

          deleteError: "No se pudo eliminar el equipo",

        },

      },

      userPanel: {

        header: {

          title: "Gestión de usuarios",

          description: "Actualizá roles, equipos y accesos de cada usuario del portal.",

        },

        filters: {

          searchPlaceholder: "Buscar por nombre o email…",

          allRoles: "Todos los roles",

          allTeams: "Todos los equipos",

          onlyNoTeam: "Solo sin equipo",

        },

        table: {

          headers: {

            name: "Usuario",

            role: "Rol",

            team: "Equipo",

            portals: "Portales",

            actions: "Estado",

          },

          noResults: "Sin resultados para los filtros.",

          placeholderName: "(sin nombre)",

          placeholderTeam: "(sin equipo)",

          saving: "Guardando…",

          synced: "Sin cambios",

          loading: "Cargando usuarios…",

        },

        toast: {

          saveSuccess: "Cambios guardados",

          saveError: "No se pudieron guardar los cambios",

        },

      },

    },

    mapachePortal: {

      title: "Portal Mapache",

      loading: "Cargando tareas…",

      loadFallback:

        "No se pudieron cargar las tareas. Mostramos la versión más reciente disponible.",

      noDescription: "Sin descripción disponible.",

      statuses: {

        all: "Todas",

        pending: "Pendiente",

        in_progress: "En progreso",

        completed: "Completada",

      },

      filters: {

        advancedFilters: "Filtros avanzados",

        advancedFiltersTitle: "Filtros avanzados",

        advancedFiltersSubtitle:

          "Combina distintos criterios para encontrar los casos adecuados.",

        advancedFiltersSummary: "Resumen de filtros",

        advancedFiltersSummaryEmpty: "Aún no hay filtros avanzados activos.",

        mine: "Mis tareas",

        unassigned: "Sin Mapache asignado",

        open: "Filtros avanzados",

        title: "Filtros avanzados",

        reset: "Limpiar filtros",

        resetAdvancedFilters: "Limpiar filtros avanzados",

        close: "Cerrar",

        needFromTeam: "Necesidad del equipo",

        directness: "Tipo de contacto",

        integrationType: "Tipo de integración",

        origin: "Origen de la señal",

        assignee: "Mapache asignado",

        noAssignees: "Todavía no hay asignaciones registradas.",

        searchPlaceholder: "Buscar…",

        clearSearch: "Limpiar búsqueda",

        clearSelection: "Limpiar selección",

        noResults: "Sin coincidencias",

        selectionHelper: "Aún no hay elementos seleccionados.",

        presentationDate: "Fecha de presentación",

        from: "Desde",

        to: "Hasta",

        summary: "Resumen",

        summaryEmpty: "Aún no hay filtros activos.",

        advancedFiltersHint:

          "Los filtros se aplican automáticamente al cerrar este panel.",

        needFromTeamTooltip: "Seleccioná necesidades relevantes.",

        needFromTeamHelper: "Elegí una o más necesidades para filtrar.",

        needFromTeamSearch: "Buscar necesidades…",

        needFromTeamEmpty: "Sin necesidades disponibles.",

        directnessTooltip: "Filtrá por tipo de contacto.",

        directnessHelper: "Elegí uno o más tipos de contacto.",

        directnessSearch: "Buscar tipos de contacto…",

        directnessEmpty: "Sin tipos de contacto disponibles.",

        integrationTypeTooltip: "Elegí tipos de integración disponibles.",

        integrationTypeHelper: "Seleccioná una o más integraciones.",

        integrationTypeSearch: "Buscar tipos de integración…",

        integrationTypeEmpty: "Sin integraciones registradas.",

        originTooltip: "Delimitá orígenes relevantes.",

        originHelper: "Seleccioná uno o más orígenes.",

        originSearch: "Buscar orígenes…",

        originEmpty: "Sin orígenes disponibles.",

        assigneeTooltip: "Encontrá Mapaches rápidamente.",

        assigneeHelper: "Seleccioná personas para filtrar.",

        assigneeSearch: "Buscar Mapaches…",

        assigneeEmpty: "Sin Mapaches coincidentes.",

        savePreset: "Guardar filtro",

        savingPreset: "Guardando…",

        loadPreset: "Cargar filtro",

        presetsLabel: "Filtros guardados",

        selectPresetPlaceholder: "Elegí un filtro guardado",

        noPresets: "Sin filtros guardados",

        savePresetPrompt: "Ingresá un nombre para guardar este filtro.",

      },

      insights: {

        title: "Pulso del tablero",

        subtitle: "Métricas rápidas para entender la demanda Mapache.",

        activeScope: "Mostrando: {scope}",

        scopes: {

          filtered: "Sólo filtradas",

          all: "Todas las tareas",

        },

        cards: {

          total: "Tareas activas",

          dueSoon: "Próximas a vencer (7 días)",

          overdue: "Vencidas",

        },

      sections: {

        status: "Por estado",

        substatus: "Por subestado",

        need: "Necesidad del equipo",

        workload: "Carga por Mapache",

        upcoming: "Agenda próxima",

        timeline: "Evolución histórica",

      },

      charts: {

        status: {

          description: "Distribución total de tareas por estado.",

        },

        axis: {

          tasks: "Tareas",

        },

      },

      segments: {

        label: "Segmentación",

        mode: {

          none: "Sin segmentar",

          team: "Por equipo",

          assignee: "Por Mapache",

        },

        focus: {

          all: "Todos",

        },

        others: "Otros",

        team: {

          mapache: "Equipo Mapache",

          external: "Otros equipos",

          unassigned: "Sin asignar",

        },

      },

      timeRange: {

        lastSixWeeks: "Últimas 6 semanas",

        lastTwelveWeeks: "Últimas 12 semanas",

        lastTwentyFourWeeks: "Últimas 24 semanas",

        all: "Todo el historial",

      },

      timeline: {

        description: "Compará el volumen total semana a semana.",

        empty: "Todavía no registramos semanas suficientes.",

        meta: "Próximas: {dueSoon} · Vencidas: {overdue}",

      },

      empty: "Todavía no hay datos suficientes.",

      upcomingEmpty: "Sin fechas próximas registradas.",

      needs: {

        none: "Sin especificar",

      },

        trend: {

          positive: "+{value} vs. semana anterior",

          negative: "{value} menos vs. semana anterior",

          equal: "Sin cambios vs. semana anterior",

          unavailable: "Sin datos históricos",

          filtered: "Basado en filtros activos",

        },

        trendShort: {

          positive: "+{value}",

          negative: "-{value}",

          equal: "0",

          unavailable: "—",

          filtered: "Filtro activo",

        },

      },

      statusBadges: {

        unassigned: "Sin asignar",

        assigned: "Asignado",

        in_progress: "En progreso",

        completed: "Finalizado",

      },

      enums: {

        needFromTeam: {

          QUOTE_SCOPE: "Cotización + Alcance",

          QUOTE: "Cotización",

          SCOPE: "Alcance",

          PRESENTATION: "Presentación",

          OTHER: "Otro",

        },

        directness: {

          DIRECT: "Directo",

          PARTNER: "Partner",

        },

        integrationType: {

          REST: "REST",

          GRAPHQL: "GraphQL",

          SDK: "SDK",

          OTHER: "Otro",

        },

        integrationOwner: {

          OWN: "Propia",

          THIRD_PARTY: "Tercero",

        },

        origin: {

          GOOGLE_FORM: "Formulario",

          GENERATOR: "Generador",

          API: "API",

          MANUAL: "Manual",

          OTHER: "Otro",

        },

        deliverableType: {

          SCOPE: "Alcance",

          QUOTE: "Cotización",

          SCOPE_AND_QUOTE: "Alcance + Cotización",

          OTHER: "Otro",

        },

      },

      substatuses: {

        backlog: "Backlog",

        waiting_client: "Esperando cliente",

        blocked: "Bloqueada",

      },

      deliverables: {

        title: "Entregables",

        empty: "Sin entregables registrados.",

        open: "Abrir",

        types: {

          scope: "Alcance",

          quote: "Cotización",

          scope_and_quote: "Alcance + Cotización",

          other: "Otro",

        },

      },

      actions: {

        add: "Agregar tarea",

        statusLabel: "Estado",

        substatusLabel: "Subestado",

        delete: "Eliminar",

        remove: "Quitar",

        deleting: "Eliminando…",

        deleteConfirm: "¿Seguro que deseas eliminar la tarea {id}?",

        cancel: "Cancelar",

      },

      settings: {

        title: "Ajustes del Portal Mapache",

        tabs: {

          assignment: "Asignación",

          boards: "Tableros",

          statuses: "Estados",

        },

      },

      statusSettings: {

        title: "Estados de las tareas",

        description:

          "Administrá los estados disponibles para Mapache Portal. Los cambios se reflejan en filtros, formularios y tableros.",

        form: {

          keyLabel: "Clave",

          keyHint: "Se guarda en mayúsculas y debe ser única.",

          labelLabel: "Etiqueta visible",

          orderLabel: "Orden (menor primero)",

        },

        create: {

          heading: "Crear estado",

          description: "Definí una clave, etiqueta y orden para el nuevo estado.",

          submit: "Crear estado",

          saving: "Creando…",

        },

        edit: {

          heading: "Editar estado",

          description: "Seleccioná un estado existente para actualizar sus datos.",

          selectLabel: "Estado",

          selectPlaceholder: "Elegí un estado",

          submit: "Guardar cambios",

          saving: "Guardando…",

          delete: "Eliminar estado",

        },

        delete: {

          confirmTitle: "Eliminar estado",

          confirmDescription:

            "Esta acción quitará \"{label}\" y puede afectar filtros y tableros.",

          cancel: "Cancelar",

          confirm: "Eliminar",

          deleting: "Eliminando…",

        },

        list: {

          heading: "Estados actuales",

          empty: "Todavía no hay estados configurados.",

          order: "Orden",

          key: "Clave",

          label: "Etiqueta",

          actions: "Acciones",

          edit: "Editar",

          delete: "Eliminar",

        },

        validation: {

          keyRequired: "Ingresá una clave.",

          labelRequired: "Ingresá una etiqueta.",

          orderRequired: "Ingresá un orden.",

          orderInvalid: "Ingresá un número válido.",

        },

        toast: {

          validationError: "Revisá los campos marcados.",

          createSuccess: "Estado creado",

          createError: "No se pudo crear el estado.",

          updateSuccess: "Estado actualizado",

          updateError: "No se pudo actualizar el estado.",

          deleteSuccess: "Estado eliminado",

          deleteError: "No se pudo eliminar el estado.",

        },

      },

      assignment: {

        configure: "Ajustes",

        title: "Asignación automática",

        description:

          "Definí qué porcentaje de tareas sin responsable recibirá cada Mapache. Los valores se normalizan automáticamente.",

        percentageLabel: "Porcentaje deseado",

        reset: "Restablecer proporciones",

        totalLabel: "Total configurado",

        normalizedHint: "Las proporciones se ajustan automáticamente para sumar 100%.",

        empty: "No hay Mapaches disponibles.",

        cancel: "Cancelar",

        save: "Guardar proporciones",

        autoAssign: "Asignar automáticamente",

        autoAssigning: "Asignando…",

      },

      boards: {

        title: "Tableros personalizados",

        description:

          "Diseñá distintas vistas para el modo tablero y ajustá las columnas según la operación.",

        loading: "Cargando tableros…",

        loadError: "No se pudieron cargar los tableros.",

        empty: {

          title: "Todavía no hay tableros configurados",

          description:

            "Creá el primero desde estos ajustes para personalizar la vista en modo tablero.",

          action: "Crear tablero",

        },

        list: {

          heading: "Tableros",

          reorderHint: "Usá subir/bajar para reordenar",

          defaultName: "Tablero {index}",

        },

        form: {

          nameLabel: "Nombre del tablero",

          namePlaceholder: "Ej. Seguimiento semanal",

          delete: "Eliminar tablero",

          confirmDeleteTitle: "Eliminar tablero",

          confirmDeleteDescription:

            "Esta acción quitará el tablero \"{name}\" para todo el equipo.",

          cancel: "Cancelar",

          confirmDelete: "Eliminar",

          save: "Guardar tablero",

        },

        columns: {

          heading: "Columnas",

          empty:

            "Agregá al menos una columna para que el tablero funcione.",

          add: "Agregar columna",

          delete: "Eliminar",

          moveUp: "Subir",

          moveDown: "Bajar",

          titleLabel: "Nombre",

          statusesLabel: "Estados incluidos",

          defaultTitle: "Columna {index}",

          dropMenuTitle: "Seleccioná el estado destino",

          dropMenuDescription: "Elegí a qué estado mover la tarea.",

          dropMenuCancel: "Cancelar",

        },

        validation: {

          nameRequired: "Ingresá un nombre para el tablero.",

          columnTitleRequired: "Cada columna necesita un nombre.",

          columnStatusesRequired:

            "Cada columna debe incluir al menos un estado.",

          columnsRequired: "Agregá al menos una columna.",

        },

        selector: {

          label: "Tablero",

          placeholder: "Elegí un tablero",

          empty:

            "Configura un tablero desde los ajustes para usar esta vista.",

        },

        toast: {

          createSuccess: "Tablero creado",

          createError: "No se pudo crear el tablero.",

          updateSuccess: "Tablero actualizado",

          updateError: "No se pudo actualizar el tablero.",

          deleteSuccess: "Tablero eliminado",

          deleteError: "No se pudo eliminar el tablero.",

          reorderError: "No se pudo guardar el orden de los tableros.",

        },

      },

      empty: {

        title: "No hay tareas para mostrar",

        description: "Usa el botón “Agregar tarea” para crear la primera.",

        filteredTitle: "Ninguna tarea coincide con los filtros",

        filteredDescription:

          "Ajustá los filtros o restablécelos para ver más resultados.",

      },

      form: {

        title: "Nueva tarea",

        titleLabel: "Título",

        titlePlaceholder: "Ej. Preparar presentación",

        titleRequired: "Ingresá un título antes de guardar.",

        descriptionLabel: "Descripción",

        descriptionPlaceholder: "Detalles adicionales o notas…",

        statusLabel: "Estado",

        substatusLabel: "Subestado",

        cancel: "Cancelar",

        confirm: "Guardar tarea",

        saving: "Guardando…",

        assigneeLoadError: "No se pudo cargar el equipo Mapache.",

        unspecifiedOption: "Sin definir",

      },

      validation: {

        emailInvalid: "Ingresá un email válido.",

        clientNameRequired: "Ingresá el nombre del cliente.",

        productKeyRequired: "Ingresá el producto.",

        websitesInvalid: "Incluí URLs válidas (https://…).",

        presentationDateInvalid: "Fecha inválida.",

        urlInvalid: "URL inválida.",

        numberInvalid: "Ingresá un número válido.",

        deliverableTitleRequired: "Ingresá un título.",

        deliverableUrlRequired: "Ingresá una URL.",

      },

      toast: {

        loadError: "No se pudieron cargar las tareas.",

        createSuccess: "Tarea creada",

        createError: "No se pudo crear la tarea.",

        validationError: "Revisá los campos marcados.",

        updateSuccess: "Tarea actualizada",

        updateError: "No se pudo actualizar la tarea.",

        deleteSuccess: "Tarea eliminada",

        deleteError: "No se pudo eliminar la tarea.",

        autoAssignSuccess: "Tareas asignadas automáticamente",

        autoAssignError: "No se pudieron asignar las tareas automáticamente.",

        autoAssignNoUsers: "Configura al menos un Mapache antes de asignar.",

        autoAssignNone: "No hay tareas sin asignar.",

        filterPresetsLoadError: "No se pudieron cargar los filtros guardados.",

        filterPresetSaved: "Filtro guardado",

        filterPresetSaveError: "No se pudo guardar el filtro.",

        filterPresetNameRequired: "Ingresá un nombre para guardar el filtro.",

        filterPresetLoaded: "Filtro aplicado",

        filterPresetApplyError: "No se pudo cargar el filtro seleccionado.",

      },

    },

    admin: {

      usersLegacy: {

        title: "Usuarios (admin)",

        table: {

          loading: "Cargando…",

          headers: {

            email: "Email",

            name: "Nombre",

            role: "Rol",

            team: "Equipo",

            portals: "Portales",

            actions: "Acciones",

          },

          fallback: "—",

          teamPlaceholder: "(sin equipo)",

          refresh: "Refrescar",

        },

        forms: {

          title: "Gestión de equipos",

          create: {

            placeholder: "Nuevo equipo",

            submit: "Crear",

          },

          rename: {

            selectPlaceholder: "(elige equipo)",

            placeholder: "Nuevo nombre",

            submit: "Renombrar",

          },

          delete: {

            selectPlaceholder: "(elige equipo)",

            placeholder: "Mover usuarios a… (opcional)",

            submit: "Eliminar / Mover",

          },

        },

        feedback: {

          save: {

            success: "Cambios guardados",

            error: {

              generic: "No se pudieron guardar los cambios",

              unauthorized: "No autorizado",

              invalid: "Datos inválidos",

              notFound: "Registro no encontrado",

            },

          },

          teams: {

            create: {

              success: "Equipo creado",

              error: {

                generic: "No se pudo crear el equipo",

                unauthorized: "No autorizado",

                invalid: "Ingresá un nombre válido",

              },

            },

            rename: {

              success: "Equipo renombrado",

              error: {

                generic: "No se pudo renombrar el equipo",

                unauthorized: "No autorizado",

                invalid: "Seleccioná un equipo y nombre válido",

                notFound: "No se encontró el equipo",

              },

            },

            delete: {

              success: "Equipo eliminado",

              error: {

                generic: "No se pudo eliminar el equipo",

                unauthorized: "No autorizado",

                invalid: "Seleccioná un equipo válido",

                notFound: "No se encontró el equipo",

              },

            },

          },

        },

      },

      teams: {

        header: "Equipos",

        summary: {

          label: "Mostrando:",

          all: "todos los equipos",

          visible: "solo equipos con integrantes",

        },

        toggleEmpty: "Mostrar equipos vacíos (admin)",

        management: {

          title: "Gestión de equipos",

          placeholder: "Nuevo equipo",

          create: "Crear equipo",

          creating: "Creando…",

        },

        empty: {

          noTeams: "No hay equipos todavía.",

          createPrompt: "Creá el primero con el formulario de arriba.",

          noVisible: "No hay equipos visibles aún.",

          hint: "Los equipos sin integrantes (sin líder ni miembros) se ocultan automáticamente.",

        },

        card: {

          membersCount: "{count, plural, one {# integrante} other {# integrantes}}",

          leaders: "LÍDERES",

          members: "MIEMBROS",

          rename: "Renombrar",

          delete: "Eliminar",

          unnamed: "(sin nombre)",

          portals: {

            title: "Acceso a portales",

            helper:

              "{count, plural, =0 {Este equipo no tiene integrantes para actualizar.} one {Aplicarás cambios a # integrante.} other {Aplicarás cambios a # integrantes.}}",

            all: "Asignado a todo el equipo.",

            partial: "{count} de {total} integrantes lo tienen.",

            none: "Ningún integrante lo tiene asignado.",

          },

        },

        toast: {

          createSuccess: "Equipo creado",

          createError: "No se pudo crear el equipo",

          renameSuccess: "Equipo renombrado",

          renameError: "No se pudo renombrar el equipo",

          deleteSuccess: "Equipo eliminado",

          deleteError: "No se pudo eliminar el equipo",

          portalsUpdated: "Accesos de {team} a {portal} actualizados.",

          portalsError: "No se pudieron actualizar los accesos del equipo.",

          portalsNoMembers: "Este equipo no tiene integrantes para actualizar.",

          portalsNoChanges: "Los accesos ya estaban configurados.",

        },

        dialogs: {

          rename: {

            title: "Renombrar equipo",

            descriptionPrefix: "Cambiar nombre de",

            descriptionSuffix: ".",

            inputLabel: "Nuevo nombre",

            inputPlaceholder: "Ej: Lobos",

            validation: "Mínimo 2 caracteres",

            confirm: "Renombrar",

          },

          delete: {

            title: "Eliminar equipo",

            description:

              "¿Seguro que deseas eliminar el equipo {team}? Los usuarios quedarán sin equipo.",

            confirm: "Eliminar",

          },

        },

      },

      users: {

        title: "Usuarios",

        kpis: {

          total: "Usuarios",

          superadmins: "Superadmins",

          leaders: "Líderes",

          withoutTeam: "Sin equipo",

          active30: "Activos 30 días",

          pctWithTeam: "% con equipo",

        },

        actions: {

          exportCsv: "CSV",

          refresh: "Refrescar",

        },

        filters: {

          searchLabel: "Buscar",

          searchPlaceholder: "Email o nombre…",

          roleLabel: "Rol",

          teamLabel: "Equipo",

          allOption: "Todos",

          onlyNoTeam: "Solo sin equipo",

          includeEmptyTeams: "Incluir equipos vacíos",

          clear: "Limpiar",

          clearAria: "Quitar filtro",

          chips: {

            query: "Buscar: \"{query}\"",

            role: "Rol: {role}",

            team: "Equipo: {team}",

            onlyNoTeam: "Solo sin equipo",

          },

        },

        table: {

          loading: "Cargando…",

          headers: {

            email: "Email",

            name: "Nombre",

            role: "Rol",

            team: "Equipo",

            actions: "Acciones",

          },

          sortTooltip: "Ordenar",

          openProfile: "Abrir perfil",

          changeRole: "Cambiar rol",

          assignTeam: "Asignar equipo",

          placeholderTeam: "(sin equipo)",

          dropdown: {

            copyEmail: "Copiar email",

            viewHistory: "Ver historial",

            removeTeam: "Quitar de equipo",

            viewProfile: "Perfil",

          },

          lastLogin: "Último inicio: {value}",

          noResults: "Sin resultados para los filtros.",

        },

        toast: {

          unauthorized: "No autorizado",

          saved: "Cambios guardados",

          copySuccess: "Email copiado",

          copyError: "No se pudo copiar",

          missingEmail: "El usuario no tiene email",

          csvExported: "CSV exportado",

        },

        export: {

          filename: "usuarios.csv",

          headers: {

            email: "Email",

            name: "Nombre",

            role: "Rol",

            team: "Equipo",

            lastLogin: "Último login",

            created: "Creado",

          },

        },

        relative: {

          minutes: "hace {count}m",

          hours: "hace {count}h",

          days: "hace {count}d",

        },

        portals: {

          directAlways: "Portal Directo habilitado de forma nativa.",

          mapache: "Portal Mapache",

          partner: "Portal Partner",

          marketing: "Portal Marketing",

        },

      },

    },

    goals: {

      page: {

        title: "Objetivos",

        teamTitle: "Mi equipo",

        teamTitleWithName: "Equipo {team} — Detalle",

        emptySuperadmin: "Selecciona un equipo arriba para ver sus objetivos.",

        emptyMember: "Aún no pertenecés a un equipo.",

      },

      quarterPicker: {

        year: "Año",

        quarter: "Trimestre",

      },

      individual: {

        title: "Objetivo individual",

        quarterlyGoalLabel: "Objetivo trimestral",

        monthlyGoalLabel: "Objetivo mensual",

        progressLabel: "Progreso",

        remainingLabel: "Restante",

        monthLabel: "Mes {month}",

        quarterlyBarLabel: "Objetivo trimestral",

        monthlyBarLabel: "Objetivo mensual (ventas del mes actual)",

        monthlyProgressLabel: "Ventas del mes",

        monthlyRemainingLabel: "Restante del mes",

        monthlyCompleted: "{pct}% del objetivo mensual",

        completed: "{pct}% completado",

        progressTitle: "Progreso del trimestre {year} — Q{quarter}",

        period: "Periodo: {from} — {to}",

        editCta: "Editar mi objetivo",

        manualCta: "Registrar Won manual",

        metrics: {

          goal: "Objetivo",

          progress: "Avance (WON)",

          remaining: "Faltante",

          pct: "% Cumplimiento",

        },

        dialog: {

          title: "Editar objetivo personal",

          description: "Ingresa el objetivo del trimestre en USD.",

          inputLabel: "Monto (USD)",

          inputPlaceholder: "Ej: 5000",

          confirm: "Guardar",

        },

      },

      team: {

        title: "Objetivo del equipo",

        selectPlaceholder: "Selecciona equipo…",

        exportCsv: "CSV",

        empty: {

          superadmin: "Selecciona un equipo para ver sus objetivos.",

          member: "Aún no pertenecés a un equipo.",

        },

        progressTitle: "Progreso del trimestre {year} — Q{quarter}",

        progressLabel: "Progreso",

        remainingLabel: "Restante",

        completed: "{pct}% completado",

        deltaLabel: "Delta objetivo vs suma miembros:",

        deltaLabelShort: "Delta de alineación",

        teamGoalLabel: "Objetivo del equipo",

        membersSumLabel: "Suma de objetivos individuales",

        editCta: "Editar objetivo del equipo",

        metrics: {

          goal: "Objetivo del equipo",

          progress: "Avance (WON)",

          remaining: "Faltante",

          pct: "% Cumplimiento",

        },

        dialog: {

          title: "Editar objetivo del equipo",

          description:

            "Define el objetivo del trimestre en USD. No tiene por qué coincidir con la suma individual.",

          inputLabel: "Monto (USD)",

          inputPlaceholder: "Ej: 25000",

          confirm: "Guardar",

        },

      },

      table: {

        headers: {

          user: "Usuario",

          goal: "Objetivo",

          progress: "Avance",

          pct: "% Cumpl.",

        },

        labels: {

          monthly: "Mensual",

          visual: "Progreso visual",

        },

        actions: {

          title: "Acciones",

          profile: "Perfil",

          edit: "Editar",

          cancel: "Cancelar",

          save: "Guardar",

        },

        loading: "Cargando…",

        empty: "Sin miembros o sin datos.",

      },

      csv: {

        headers: {

          user: "Usuario",

          goal: "Objetivo Q",

          progress: "Avance (WON)",

          pct: "%",

        },

        fileName: "objetivos_{team}.csv",

        fallbackTeam: "equipo",

      },

      billing: {

        title: "Bono",

        subtitle: "{count, plural, one {# negocio ganado} other {# negocios ganados}}",

        loading: "Cargando bono…",

        empty: "Aún no registraste negocios ganados en este trimestre.",

        unknownCompany: "Sin empresa",

        autoLabel: "Auto",

        manualLabel: "Manual",

        wonTypeNew: "Nuevo cliente",

        wonTypeUpsell: "Upsell",

        manualCta: "Registrar Won manual",

        deleteManual: "Eliminar",

        deleteManualTitle: "Confirmar Eliminación",

        deleteManualConfirm: "¿Estás seguro de que deseas eliminar el Won manual de {company}?",

        deleteCancel: "Cancelar",

        deleteConfirm: "Eliminar",

        deleteWarning: "Esta acción no se puede deshacer. El progreso de tu objetivo se ajustará automáticamente.",

        wonTypeLabel: "Tipo de Won",

        monthlyFee: "Fee mensual",

        handoffLabel: "Hand Off",

        handoffDone: "Hand off listo",

        handoffPending: "Hand off pendiente",

        handoffConfirmed: "Se suma al bono",

        handoffMissing: "No suma aún",

        bonusAmount: "Monto para bono",

        viewProposal: "Ver propuesta",

        totalMonthly: "Total fees mensuales",

        totalHandoff: "Total contra handoff",

        totalPending: "Total pendiente",

      },

      ranking: {

        title: "Ranking del equipo",

        subtitle: "Equipo {team}",

        subtitleNoTeam: "Sin equipo asignado",

        modeDeals: "Por deals",

        modeAmount: "Por monto",

        emptyTeam: "Selecciona un equipo para ver el ranking.",

        loading: "Calculando ranking…",

        empty: "Sin datos para este trimestre.",

        dealsLabel: "Deals ganados",

        amountLabel: "Monto ganado",

        dealsCount: "{count, plural, one {# negocio} other {# negocios}}",

        amountShort: "Monto: {amount}",

        positionLabel: "#{position}",

      },

      toast: {

        myGoalSaved: "Objetivo actualizado",

        myGoalError: "No se pudo guardar tu objetivo",

        userGoalSaved: "Objetivo del usuario actualizado",

        userGoalError: "No se pudo actualizar el objetivo del usuario",

        teamGoalSaved: "Objetivo del equipo actualizado",

        teamGoalError: "No se pudo actualizar el objetivo del equipo",

        restrictedEdit: "Solo líderes o superadmins pueden editar objetivos de otros.",

        manualWonSaved: "Won manual registrado",

        manualWonError: "No se pudo registrar el Won manual",

        manualWonDeleted: "Won manual eliminado",

        manualWonDeleteError: "No se pudo eliminar el Won manual",

        handoffSaved: "Hand off registrado",

        handoffRemoved: "Hand off quitado",

        billingError: "No se pudo actualizar la facturación",

      },

      validation: {

        nonNegative: "Debe ser ≥ 0",

        required: "Campo requerido",

      },

      manualDialog: {

        title: "Registrar Won manual",

        target: "Registrando para {target}",

        companyLabel: "Empresa",

        companyPlaceholder: "Ej: Empresa XYZ",

        monthlyFeeLabel: "Fee mensual",

        monthlyFeePlaceholder: "Ej: 2000",

        proposalUrlLabel: "Enlace a propuesta",

        proposalUrlPlaceholder: "https://…",

        wonTypeLabel: "Clasificacion del Won",

        wonTypeNew: "Nuevo cliente",

        wonTypeUpsell: "Upsell",

        cancel: "Cancelar",

        confirm: "Guardar",

        saving: "Guardando…",

        submitError: "No pudimos guardar el Won manual",

      },

    },

    proposals: {

      errors: {

        catalog: {

          loadFailed: "No se pudo cargar el catálogo.",

          createFailed: "No se pudo crear el ítem.",

          updateFailed: "No se pudo actualizar el ítem.",

          deleteFailed: "No se pudo eliminar el ítem.",

          categories: {

            loadFailed: "No se pudieron cargar las categorías.",

            createFailed: "No se pudo crear la categoría.",

            renameFailed: "No se pudo renombrar la categoría.",

            deleteFailed: "No se pudo eliminar/mover la categoría.",

          },

        },

        filiales: {

          loadFailed: "No se pudieron cargar las filiales.",

          createGroupFailed: "No se pudo crear la filial.",

          renameGroupFailed: "No se pudo renombrar la filial.",

          deleteGroupFailed: "No se pudo eliminar la filial.",

          createCountryFailed: "No se pudo agregar el país.",

          renameCountryFailed: "No se pudo renombrar el país.",

          deleteCountryFailed: "No se pudo eliminar el país.",

          unauthorized: "No tenés permisos para realizar esta acción.",

        },

        glossary: {

          loadFailed: "No se pudo cargar el glosario.",

          createFailed: "No se pudo crear el enlace.",

          updateFailed: "No se pudo actualizar el enlace.",

          deleteFailed: "No se pudo eliminar el enlace.",

          unauthorized: "No tenés permisos para realizar esta acción.",

        },

        pricing: {

          whatsAppFailed: "No se pudo calcular WhatsApp.",

          minutesFailed: "No se pudo calcular Minutos.",

        },

        proposal: {

          saveFailed: "No se pudo guardar la propuesta.",

        },

      },

      onboarding: {
        title: "Completemos tus datos",
        intro:
          "Para personalizar tu experiencia necesitamos saber a qué equipo perteneces, cuál es tu posición y quién es tu líder directo.",
        teamLabel: "Equipo del que formas parte (versión animal)",
        selectPlaceholder: "(elige un equipo)",
        teamOtherOption: "Otros...",
        customTeamLabel: "Indica el nombre del equipo",
        customTeamPlaceholder: "Ej. CX Especiales",
        positionLabel: "Nombre de la posición",
        positionPlaceholder: "Ej. Líder de Operaciones",
        leaderEmailLabel: "Email del líder directo",
        leaderEmailHint: "Debe ser un correo @wisecx.com",
        actions: {
          save: "Guardar",
          saving: "Guardando…",
        },
        toasts: {
          saved: "Datos guardados",
          error: "No se pudo guardar la información",
        },
        errors: {
          leaderEmail: "Ingresá un email válido @wisecx.com",
        },
      },

      countries: {

        Argentina: "Argentina",

        Alemania: "Alemania",

        Aruba: "Aruba",

        Belgica: "Bélgica",

        Bolivia: "Bolivia",

        Brasil: "Brasil",

        "Canadá": "Canadá",

        Chile: "Chile",

        Colombia: "Colombia",

        "Costa Rica": "Costa Rica",

        Ecuador: "Ecuador",

        Egipto: "Egipto",

        "El Salvador": "El Salvador",

        España: "España",

        "Estados Unidos": "Estados Unidos",

        Francia: "Francia",

        Guatemala: "Guatemala",

        "Haití": "Haití",

        Honduras: "Honduras",

        India: "India",

        Indonesia: "Indonesia",

        Israel: "Israel",

        Italia: "Italia",

        Jamaica: "Jamaica",

        Malasia: "Malasia",

        "México": "México",

        Nicaragua: "Nicaragua",

        Nigeria: "Nigeria",

        Noruega: "Noruega",

        "Países Bajos": "Países Bajos",

        "Pakistán": "Pakistán",

        "Panamá": "Panamá",

        Paraguay: "Paraguay",

        "Perú": "Perú",

        Polonia: "Polonia",

        "Puerto Rico": "Puerto Rico",

        "Reino Unido": "Reino Unido",

        "República Dominicana": "República Dominicana",

        Rumania: "Rumanía",

        Rusia: "Rusia",

        "Arabia Saudita": "Arabia Saudita",

        Suecia: "Suecia",

        Suiza: "Suiza",

        "Turquía": "Turquía",

        Uruguay: "Uruguay",

        Venezuela: "Venezuela",

        "Emiratos Árabes Unidos": "Emiratos Árabes Unidos",

        "Resto de Asia": "Resto de Asia",

        "Resto de Europa": "Resto de Europa",

        "Resto de Africa": "Resto de África",

        "Resto de America": "Resto de América",

        Other: "Otro",

      },

      itemsTable: {

        headers: {

          sku: "SKU",

          category: "Categoría",

          item: "Ítem",

          quantity: "Cant.",

          unitPrice: "Unitario",

          discount: "Descuento (%)",

          subtotal: "Subtotal",

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

          subtotal: "Subtotal",

          subtotalValue: "Subtotal = cantidad * unitario neto",

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

        wonTypeModal: {

          title: "Clasificar Won",

          description: "Selecciona si el Won corresponde a un cliente nuevo o un upsell.",

          newCustomer: "Nuevo cliente",

          upsell: "Upsell",

          cancel: "Cancelar",

          confirm: "Confirmar",

          saving: "Guardando...",

        },

      },

      generator: {

        heading: "Generador de Propuestas",

        emptyValue: "—",

        pipedrive: {

          modeLabel: "Sincronización con Pipedrive",

          options: {

            sync: "Sincronizar tarjeta en Pipedrive",

            skip: "No sincronizar tarjeta en Pipedrive",

            create: "Crear nueva tarjeta en Pipedrive",

          },

          notAvailable: "Funcionalidad no disponible.",

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

          minutesApplied: "Minutos aplicados",

          wiserApplied: "Wiser PRO agregado",

          itemDeleted: "Ítem eliminado",

          itemDeleteError: "No se pudo eliminar el ítem: {message}",

          proposalCreated: "Propuesta registrada",

        },

        whatsappCalculator: {

          title: "Calculadora de WhatsApp",

          description:

            "Ingresa cuantas conversaciones necesitas por tipo para estimar el credito.",

          fields: {

            subsidiary: "Filial de facturacion",

            destination: "Pais destino",

            destinationPlaceholder: "Selecciona un pais",

            marketing: "Conversaciones Marketing",

            utility: "Conversaciones Utility",

            auth: "Conversaciones Auth",

          },

          actions: {

            calculate: "Calcular",

            calculating: "Calculando...",

            reset: "Reiniciar",

          },

          result: {

            label: "Credito necesario",

          },

          errors: {

            missingSubsidiary: "Selecciona una filial antes de calcular.",

            missingCountry: "Selecciona un pais destino.",

          },

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

          oneShot: "Pago unico",

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
          toggle: {
            collapse: "Contraer",
            expand: "Expandir",
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
          toggle: {
            collapse: "Contraer",
            expand: "Expandir",
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

      history: {

        title: "Histórico",

        actions: {

          downloadCsvTitle: "Descargar CSV de la vista filtrada",

          downloadCsv: "CSV",

          refreshTitle: "Refrescar",

          refresh: "Refrescar",

        },

        quickRanges: {

          currentMonth: "Mes actual",

          previousMonth: "Mes anterior",

          currentWeek: "Semana actual",

          previousWeek: "Semana anterior",

        },

        filters: {

          team: {

            label: "Equipo",

            all: "Todos",

          },

          id: {

            label: "ID",

            placeholder: "Buscar por ID",

          },

          company: {

            label: "Empresa",

            placeholder: "Buscar empresa",

          },

          country: {

            label: "País",

            all: "Todos",

          },

          email: {

            label: "Email",

            placeholder: "Buscar email",

          },

          clear: "Limpiar",

          from: "Desde",

          to: "Hasta",

        },

        table: {

          headers: {

            id: "ID",

            company: "Empresa",

            country: "País",

            email: "Email",

            monthly: "Mensual",

            created: "Creado",

            status: "Estado",

            actions: "Acciones",

          },

          sortTooltip: "Ordenar",

          copyId: "Copiar ID",

          emailFallback: "—",

          monthlyTitle: "Mensual",

          createdTitle: "Fecha de creación",

          statusBadges: {

            won: "Ganada",

            lost: "Perdida",

            open: "Abierta",

          },

          wonTypeBadges: {

            newCustomer: "Nuevo cliente",

            upsell: "Upsell",

          },

          statusLabels: {

            won: "Ganada",

            lost: "Perdida",

            open: "Abierta",

          },

          actions: {

            reopenTooltip: "Revertir a OPEN",

            reopen: "OPEN",

            markWonTooltip: "Marcar como WON",

            markWon: "WON",

            open: "Abrir propuesta",

            view: "Ver",

            copyLink: "Copiar link",

            copy: "Copiar",

            noLink: "—",

            deleteTooltip: "Eliminar (no suma a estadísticas)",

            delete: "Eliminar",

          },

          empty: "Sin resultados para el filtro seleccionado.",

        },

        pagination: {

          display: "Mostrando {start}–{end} de {total}",

          perPage: "{count} / página",

          previous: "Anterior",

          next: "Siguiente",

          pageStatus: "{current} / {total}",

        },

        deleteModal: {

          title: "Eliminar propuesta",

          cancel: "Cancelar",

          confirm: "Eliminar",

          message: "Esta acción quitará la propuesta de las estadísticas. ¿Deseas continuar?",

        },

        toast: {

          markWonError: "No se pudo marcar como WON",

          markWonSuccess: "Marcado como WON",

          markOpenError: "No se pudo revertir a OPEN",

          markOpenSuccess: "Propuesta vuelta a OPEN",

          deleteError: "No se pudo eliminar",

          deleteSuccess: "Propuesta eliminada",

        },

        wonTypeModal: {

          title: "Clasificar Won",

          description: "Selecciona si el Won corresponde a un cliente nuevo o un upsell.",

          newCustomer: "Nuevo cliente",

          upsell: "Upsell",

          cancel: "Cancelar",

          confirm: "Confirmar",

          saving: "Guardando...",

        },

        csv: {

          fileName: "historico.csv",

          headers: {

            id: "ID",

            company: "Empresa",

            country: "País",

            email: "Email",

            monthly: "Mensual",

            created: "Creado",

            status: "Estado",

            url: "URL",

          },

        },

      },

      stats: {

        title: "Estadísticas",

        quickRanges: {

          quarterTooltip: "Aplicar rango del trimestre",

          currentMonth: "Mes actual",

          previousMonth: "Mes anterior",

          currentWeek: "Semana actual",

          previousWeek: "Semana anterior",

        },

        filters: {

          from: "Desde",

          to: "Hasta",

          team: {

            label: "Equipo",

            all: "Todos",

          },

          country: {

            label: "País",

            all: "Todos",

          },

          user: {

            label: "Usuario",

            all: "Todos",

          },

          orderBy: {

            label: "Ordenar por",

            createdAt: "Fecha de creación",

            totalAmount: "Monto mensual",

          },

          direction: {

            label: "Dirección",

            desc: "Descendente",

            asc: "Ascendente",

          },

          active: {

            title: "Filtros activos",

            none: "Sin filtros aplicados",

            clear: "Quitar filtro",

          },

          summary: "Mostrando {filtered} de {total} propuestas ({percent}%)",

        },

        actions: {

          reset: "Limpiar",

          exportFiltered: "Exportar",

          showAll: "Ver todo",

          showAllTitle: "Ver todos los resultados",

          topN: "Top N",

          topNTitle: "Top N (agregados)",

          csvButton: "CSV",

          csvTooltip: "Descargar CSV completo",

        },

        toast: {

          loadError: "No se pudieron cargar las propuestas",

          networkError: "Error de red al cargar propuestas",

          reset: "Filtros restablecidos",

          csv: {

            sku: "CSV de ítems descargado",

            country: "CSV por país descargado",

            user: "CSV por usuario descargado",

            filtered: "CSV de propuestas filtradas descargado",

          },

        },

        csv: {

          sku: {

            fileName: "stats_por_sku.csv",

            headers: {

              sku: "SKU",

              item: "Ítem",

              quantity: "Cantidad total",

            },

          },

          country: {

            fileName: "stats_por_pais.csv",

            headers: {

              country: "País",

              quantity: "Cantidad",

            },

          },

          user: {

            fileName: "stats_por_usuario.csv",

            headers: {

              user: "Usuario (email)",

              proposals: "Propuestas",

            },

          },

          filtered: {

            fileName: "propuestas_filtradas.csv",

            headers: {

              id: "ID",

              company: "Empresa",

              country: "País",

              user: "Usuario",

              monthly: "Mensual",

              hours: "Horas",

              oneShot: "OneShot",

              created: "Creado",

              url: "URL",

            },

          },

        },

        kpis: {

          generated: "Propuestas generadas",

          uniqueUsers: "Usuarios únicos",

          uniqueCompanies: "Empresas distintas",

          totalMonthly: "Monto mensual total",

          averagePerProposal: "Promedio por propuesta",

          wonCount: "Propuestas WON",

          wonAmount: "Monto WON",

          winRate: "Win rate",

          wonAverageTicket: "Ticket promedio WON",

        },

        sections: {

          deepDive: "Análisis profundo",

          bySku: {

            title: "Ítems más cotizados (por SKU)",

          },

          byCountry: {

            title: "Propuestas por país",

          },

          byUser: {

            title: "Top usuarios por cantidad de propuestas",

          },

        },

        charts: {

          empty: "Sin datos suficientes para esta visualización.",

          others: "Otros",

          trend: {

            positive: "+{value}% vs. período previo",

            negative: "-{value}% vs. período previo",

            equal: "Sin cambios vs. período previo",

            unavailable: "Sin datos suficientes",

          },

          monthlyPerformance: {

            title: "Evolución mensual",

            description: "Seguimiento del volumen de propuestas y el monto mensual generado.",

            countLabel: "Propuestas",

            amountLabel: "Monto mensual",

            latestLabel: "Último mes con datos: {label}",

          },

          statusDistribution: {

            title: "Estado de las propuestas",

            description: "Visualizá cómo se distribuye el pipeline filtrado.",

            totalLabel: "Total filtrado: {total}",

            unknown: "Sin estado",

          },

          countryLeaderboard: {

            title: "Países más activos",

            description: "Los países con mayor cantidad de propuestas generadas.",

          },

          skuMomentum: {

            title: "Ítems en tendencia",

            description: "SKU con más cotizaciones en el período seleccionado.",

          },

        },

        table: {

          empty: "Sin datos para los filtros seleccionados.",

          sku: {

            headers: {

              sku: "SKU",

              item: "Ítem",

              quantity: "Cantidad total",

            },

          },

          country: {

            headers: {

              country: "País",

              quantity: "Cantidad",

            },

            footer: {

              showAll: "Mostrando todos ({count})",

              total: "Total países: {count}",

            },

          },

          user: {

            headers: {

              user: "Usuario (email)",

              proposals: "Propuestas",

            },

            fallback: "(sin email)",

          },

        },

      },

    },

  };

export default messages;
