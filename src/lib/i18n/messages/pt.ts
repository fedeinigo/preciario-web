import type { DeepRecord } from "./types";

const messages: DeepRecord = {

    common: {

      language: {

        label: "Idioma",

        spanish: "Espanhol",

        english: "Inglês",

        portuguese: "Português",

      },

      combobox: {

        placeholder: "Selecionar…",

        noResults: "Sem resultados",

        open: "Abrir",

      },

      dialog: {

        title: "Confirmar",

        confirm: "Confirmar",

        cancel: "Cancelar",

        processing: "Processando…",

        required: "Este campo é obrigatório.",

      },

      loading: {

        session: "Carregando sua sessão…",

      },

      roles: {

        superadmin: "Superadmin",

        admin: "Admin",

        lider: "Líder",

        usuario: "Usuário",

        unknown: "Função indefinida",

      },

      profileModal: {

        title: "Meu perfil e meta",

        periodSummary: "Período: {year} - Q{quarter} ({from} — {to})",

        buttons: {

          close: "Fechar",

          save: "Salvar meta",

        },

        viewerBadge: "Edição como {role}",

        labels: {

          role: "Função",

          team: "Equipe",

          position: "Posição",

          leader: "Líder",

          period: "Período e Meta",

          year: "Ano",

          quarter: "Trimestre",

          goal: "Meta (USD)",

        },

        fallbacks: {

          name: "(sem nome)",

          team: "—",

          email: "—",

          position: "—",

          leader: "—",

        },

      },

      footer: {

        logoAlt: "Wise CX",

        copy: "© 2025 Wise CX — Soluções Inteligentes",

        developedBy: "Desenvolvido por {name}",

        contact: "federico.i@wisecx.com",

      },

      teamSelectModal: {

        title: "Escolha sua equipe",

        description: "Essa seleção será usada para segmentar Histórico e Estatísticas.",

        cancel: "Cancelar",

        confirm: "Confirmar",

        saving: "Salvando…",

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

      logoAlt: "Wise CX",

      ariaLabel: "Principal",

      tabsAriaLabel: "Abas de navegação",

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

        mapachePortal: "Portal Mapache",

        mapachePortalReturn: "Gerador Web",

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

        name: "Usuário",

        team: "—",

        email: "—",

      },

      mapachePortalSections: {

        generator: "Gerador",

        tasks: "Tarefas",

        metrics: "Métricas",

      },

      portalSwitcher: {

        button: "Portal",

        title: "Escolha um portal",

        description: "Selecione para onde deseja ir.",

        action: "Entrar",

        loading: "Entrando no portal",

        options: {

          direct: {

            label: "Portal Direto",

            description: "Gerador web",

          },

          mapache: {

            label: "Portal Mapache",

            description: "Painel da equipe Mapache",

          },

          partner: {

            label: "Portal Partner",

            description: "Recursos para administradores parceiros",

          },

          marketing: {

            label: "Portal Marketing",

            description: "Campanhas e materiais de marketing",

          },

        },

      },

    },

    configurations: {

      title: "Configurações",

      description: "Gerencie equipes e usuários do Portal Direto.",

      tabs: {

        home: "Início",

        teams: "Gestão de equipes",

        users: "Gestão de usuários",

      },

      sections: {

        visit: "Ver seção",

        back: "Voltar para Configurações",

      },

      teamPanel: {

        header: {

          title: "Gestão de equipes",

          description: "Crie, renomeie ou exclua equipes e ajuste seus acessos aos portais.",

        },

        form: {

          title: "Criar equipe",

          subtitle: "Escolha um nome claro para organizar seus usuários.",

          placeholder: "Nome da equipe",

          submit: "Adicionar equipe",

        },

        summary: {

          label: "Total de equipes:",

        },

        table: {

          title: "Equipes ativas",

          loading: "Atualizando equipes…",

          empty: "Ainda não há equipes.",

          people: "pessoas",

          noPortals: "Sem acessos configurados.",

          headings: {

            team: "Equipe",

            leaders: "Líderes",

            members: "Membros",

            portals: "Portais",

            actions: "Ações",

          },

        },

        actions: {

          portals: "Portais",

          rename: "Renomear",

          delete: "Excluir",

        },

        rename: {

          title: "Renomear equipe",

          description: "Atualize o nome para identificá-la facilmente.",

          cancel: "Cancelar",

          save: "Salvar alterações",

        },

        portals: {

          title: "Acessos de {team}",

          description: "Aplique ou remova acessos a portais para todos os integrantes da equipe.",

          members: "membros",

          enable: "Habilitar",

          disable: "Revogar",

          empty: "A equipe ainda não tem membros.",

          noChanges: "Os acessos já estavam configurados.",

          updated: "Acessos de {team} a {portal} atualizados.",

          error: "Não foi possível atualizar os acessos.",

          saving: "Aplicando mudanças…",

        },

        dialogs: {

          delete: {

            title: "Excluir equipe",

            description: "Tem certeza de que deseja excluir {team}? Os usuários ficarão sem equipe.",

            confirm: "Excluir",

          },

        },

        toast: {

          createSuccess: "Equipe criada",

          createError: "Não foi possível criar a equipe",

          renameSuccess: "Equipe renomeada",

          renameError: "Não foi possível renomear a equipe",

          deleteSuccess: "Equipe excluída",

          deleteError: "Não foi possível excluir a equipe",

        },

      },

      userPanel: {

        header: {

          title: "Gestão de usuários",

          description: "Atualize função, equipe e acessos de cada usuário do portal.",

        },

        filters: {

          searchPlaceholder: "Busque por nome ou e-mail…",

          allRoles: "Todas as funções",

          allTeams: "Todas as equipes",

          onlyNoTeam: "Apenas sem equipe",

        },

        table: {

          headers: {

            name: "Usuário",

            role: "Função",

            team: "Equipe",

            portals: "Portais",

            actions: "Status",

          },

          noResults: "Nenhum resultado para os filtros.",

          placeholderName: "(sem nome)",

          placeholderTeam: "(sem equipe)",

          saving: "Salvando…",

          synced: "Sem mudanças",

          loading: "Carregando usuários…",

        },

        toast: {

          saveSuccess: "Alterações salvas",

          saveError: "Não foi possível salvar as alterações",

        },

      },

    },

    mapachePortal: {

      title: "Portal Mapache",

      loading: "Carregando tarefas…",

      loadFallback:

        "Não foi possível carregar as tarefas. Mostramos a última versão disponível.",

      noDescription: "Sem descrição disponível.",

      statuses: {

        all: "Todas",

        pending: "Pendente",

        in_progress: "Em andamento",

        completed: "Concluída",

      },

      filters: {

        advancedFilters: "Filtros avançados",

        advancedFiltersTitle: "Filtros avançados",

        advancedFiltersSubtitle:

          "Combine diferentes critérios para encontrar os casos certos.",

        advancedFiltersSummary: "Resumo dos filtros",

        advancedFiltersSummaryEmpty: "Ainda não há filtros avançados ativos.",

        mine: "Minhas tarefas",

        unassigned: "Sem Mapache atribuído",

        open: "Filtros avançados",

        title: "Filtros avançados",

        reset: "Limpar filtros",

        resetAdvancedFilters: "Limpar filtros avançados",

        close: "Fechar",

        needFromTeam: "Necessidade da equipe",

        directness: "Tipo de lead",

        integrationType: "Tipo de integração",

        origin: "Origem do sinal",

        assignee: "Mapache responsável",

        noAssignees: "Ainda não há responsáveis disponíveis.",

        searchPlaceholder: "Buscar…",

        clearSearch: "Limpar busca",

        clearSelection: "Limpar seleção",

        noResults: "Sem correspondências",

        selectionHelper: "Nenhum item selecionado ainda.",

        presentationDate: "Data da apresentação",

        from: "De",

        to: "Até",

        summary: "Resumo",

        summaryEmpty: "Nenhum filtro ativo ainda.",

        advancedFiltersHint:

          "Os filtros são aplicados automaticamente ao fechar este painel.",

        needFromTeamTooltip: "Selecione as necessidades relevantes da equipe.",

        needFromTeamHelper: "Escolha uma ou mais necessidades para filtrar.",

        needFromTeamSearch: "Buscar necessidades…",

        needFromTeamEmpty: "Sem necessidades disponíveis.",

        directnessTooltip: "Filtre por tipo de lead.",

        directnessHelper: "Escolha um ou mais tipos de lead.",

        directnessSearch: "Buscar tipos de lead…",

        directnessEmpty: "Sem tipos de lead disponíveis.",

        integrationTypeTooltip: "Escolha os tipos de integração disponíveis.",

        integrationTypeHelper: "Selecione uma ou mais integrações.",

        integrationTypeSearch: "Buscar tipos de integração…",

        integrationTypeEmpty: "Sem integrações registradas.",

        originTooltip: "Delimite as origens mais relevantes.",

        originHelper: "Selecione uma ou mais origens.",

        originSearch: "Buscar origens…",

        originEmpty: "Sem origens disponíveis.",

        assigneeTooltip: "Encontre Mapaches rapidamente.",

        assigneeHelper: "Selecione responsáveis para filtrar.",

        assigneeSearch: "Buscar Mapaches…",

        assigneeEmpty: "Nenhum Mapache corresponde à busca.",

        savePreset: "Salvar filtro",

        savingPreset: "Salvando…",

        loadPreset: "Carregar filtro",

        presetsLabel: "Filtros salvos",

        selectPresetPlaceholder: "Escolha um filtro salvo",

        noPresets: "Nenhum filtro salvo",

        savePresetPrompt: "Informe um nome para salvar este filtro.",

      },

      insights: {

        title: "Pulso do pipeline",

        subtitle: "Insights rápidos para entender a demanda Mapache.",

        activeScope: "Exibindo: {scope}",

        scopes: {

          filtered: "Somente filtradas",

          all: "Todas as tarefas",

        },

        cards: {

          total: "Tarefas ativas",

          dueSoon: "Vencem nos próximos 7 dias",

          overdue: "Em atraso",

        },

        sections: {

          status: "Por status",

          substatus: "Por substatus",

          need: "Necessidade da equipe",

          workload: "Carga por Mapache",

          upcoming: "Agenda próxima",

          timeline: "Tendência histórica",

        },

        charts: {

          status: {

            description: "Total de tarefas agrupadas pelo status atual.",

          },

          axis: {

            tasks: "Tarefas",

          },

        },

        segments: {

          label: "Segmentação",

          mode: {

            none: "Sem segmentação",

            team: "Por equipe",

            assignee: "Por Mapache",

          },

          focus: {

            all: "Todos",

          },

          others: "Outros",

          team: {

            mapache: "Equipe Mapache",

            external: "Outras equipes",

            unassigned: "Sem responsável",

          },

        },

        timeRange: {

          lastSixWeeks: "Últimas 6 semanas",

          lastTwelveWeeks: "Últimas 12 semanas",

          lastTwentyFourWeeks: "Últimas 24 semanas",

          all: "Todo o histórico",

        },

        timeline: {

          description: "Acompanhe o volume total semana a semana.",

          empty: "Ainda não temos histórico suficiente.",

          meta: "Próximas: {dueSoon} · Atrasadas: {overdue}",

        },

        empty: "Ainda não há dados suficientes.",

        upcomingEmpty: "Sem datas próximas registradas.",

        needs: {

          none: "Não especificado",

        },

        trend: {

          positive: "+{value} vs. semana anterior",

          negative: "{value} a menos vs. semana anterior",

          equal: "Sem mudanças vs. semana anterior",

          unavailable: "Sem dados históricos",

          filtered: "Com base nos filtros ativos",

        },

        trendShort: {

          positive: "+{value}",

          negative: "-{value}",

          equal: "0",

          unavailable: "—",

          filtered: "Filtro ativo",

        },

      },

      statusBadges: {

        unassigned: "Sem responsável",

        assigned: "Atribuída",

        in_progress: "Em andamento",

        completed: "Finalizada",

      },

      enums: {

        needFromTeam: {

          QUOTE_SCOPE: "Escopo + Proposta",

          QUOTE: "Proposta",

          SCOPE: "Escopo",

          PRESENTATION: "Apresentação",

          OTHER: "Outro",

        },

        directness: {

          DIRECT: "Direto",

          PARTNER: "Parceiro",

        },

        integrationType: {

          REST: "REST",

          GRAPHQL: "GraphQL",

          SDK: "SDK",

          OTHER: "Outro",

        },

        integrationOwner: {

          OWN: "Próprio",

          THIRD_PARTY: "Terceiro",

        },

        origin: {

          GOOGLE_FORM: "Formulário",

          GENERATOR: "Gerador",

          API: "API",

          MANUAL: "Manual",

          OTHER: "Outro",

        },

        deliverableType: {

          SCOPE: "Escopo",

          QUOTE: "Proposta",

          SCOPE_AND_QUOTE: "Escopo + Proposta",

          OTHER: "Outro",

        },

      },

      substatuses: {

        backlog: "Backlog",

        waiting_client: "Aguardando cliente",

        blocked: "Bloqueada",

      },

      deliverables: {

        title: "Entregáveis",

        empty: "Sem entregáveis registrados.",

        open: "Abrir",

        types: {

          scope: "Escopo",

          quote: "Proposta",

          scope_and_quote: "Escopo + Proposta",

          other: "Outro",

        },

      },

      actions: {

        add: "Adicionar tarefa",

        statusLabel: "Status",

        substatusLabel: "Substatus",

        delete: "Excluir",

        remove: "Remover",

        deleting: "Excluindo…",

        deleteConfirm: "Tem certeza de que deseja excluir a tarefa {id}?",

        cancel: "Cancelar",

      },

      settings: {

        title: "Configurações do Portal Mapache",

        tabs: {

          assignment: "Distribuição",

          boards: "Quadros",

          statuses: "Status",

        },

      },

      statusSettings: {

        title: "Status das tarefas",

        description:

          "Gerencie os status disponíveis no Portal Mapache. As mudanças afetam filtros, formulários e quadros imediatamente.",

        form: {

          keyLabel: "Chave",

          keyHint: "É salva em maiúsculas e deve ser única.",

          labelLabel: "Rótulo visível",

          orderLabel: "Ordem (crescente)",

        },

        create: {

          heading: "Criar status",

          description: "Informe a chave, o rótulo e a ordem do novo status.",

          submit: "Criar status",

          saving: "Criando…",

        },

        edit: {

          heading: "Editar status",

          description: "Selecione um status existente para atualizar seus dados.",

          selectLabel: "Status",

          selectPlaceholder: "Escolha um status",

          submit: "Salvar alterações",

          saving: "Salvando…",

          delete: "Excluir status",

        },

        delete: {

          confirmTitle: "Excluir status",

          confirmDescription:

            "Essa ação remove \"{label}\" e pode impactar filtros e quadros.",

          cancel: "Cancelar",

          confirm: "Excluir",

          deleting: "Excluindo…",

        },

        list: {

          heading: "Status atuais",

          empty: "Ainda não há status configurados.",

          order: "Ordem",

          key: "Chave",

          label: "Rótulo",

          actions: "Ações",

          edit: "Editar",

          delete: "Excluir",

        },

        validation: {

          keyRequired: "Informe uma chave.",

          labelRequired: "Informe um rótulo.",

          orderRequired: "Informe a ordem.",

          orderInvalid: "Informe um número válido.",

        },

        toast: {

          validationError: "Revise os campos destacados.",

          createSuccess: "Status criado",

          createError: "Não foi possível criar o status.",

          updateSuccess: "Status atualizado",

          updateError: "Não foi possível atualizar o status.",

          deleteSuccess: "Status excluído",

          deleteError: "Não foi possível excluir o status.",

        },

      },

      assignment: {

        configure: "Ajustes",

        title: "Distribuição automática",

        description:

          "Defina qual porcentagem de tarefas sem responsável cada Mapache deve receber. Os valores são normalizados automaticamente.",

        percentageLabel: "Porcentagem desejada",

        reset: "Reiniciar proporções",

        totalLabel: "Total configurado",

        normalizedHint: "As proporções se ajustam automaticamente para somar 100%.",

        empty: "Não há Mapaches disponíveis.",

        cancel: "Cancelar",

        save: "Salvar proporções",

        autoAssign: "Atribuir automaticamente",

        autoAssigning: "Atribuindo…",

      },

      boards: {

        title: "Quadros personalizados",

        description:

          "Crie diferentes visões no modo quadro e ajuste as colunas conforme o fluxo.",

        loading: "Carregando quadros…",

        loadError: "Não foi possível carregar os quadros.",

        empty: {

          title: "Ainda não há quadros configurados",

          description:

            "Crie o primeiro aqui para personalizar a visualização em modo quadro.",

          action: "Criar quadro",

        },

        list: {

          heading: "Quadros",

          reorderHint: "Use subir/descer para reordenar",

          defaultName: "Quadro {index}",

        },

        form: {

          nameLabel: "Nome do quadro",

          namePlaceholder: "Ex.: Acompanhamento semanal",

          delete: "Excluir quadro",

          confirmDeleteTitle: "Excluir quadro",

          confirmDeleteDescription:

            "Esta ação remove o quadro \"{name}\" para toda a equipe.",

          cancel: "Cancelar",

          confirmDelete: "Excluir",

          save: "Salvar quadro",

        },

        columns: {

          heading: "Colunas",

          empty:

            "Adicione ao menos uma coluna para que o quadro funcione.",

          add: "Adicionar coluna",

          delete: "Remover",

          moveUp: "Subir",

          moveDown: "Descer",

          titleLabel: "Nome",

          statusesLabel: "Status incluídos",

          defaultTitle: "Coluna {index}",

          dropMenuTitle: "Escolha o status de destino",

          dropMenuDescription: "Selecione para qual status a tarefa deve ir.",

          dropMenuCancel: "Cancelar",

        },

        validation: {

          nameRequired: "Informe um nome para o quadro.",

          columnTitleRequired: "Cada coluna precisa de um nome.",

          columnStatusesRequired:

            "Cada coluna deve incluir ao menos um status.",

          columnsRequired: "Adicione ao menos uma coluna.",

        },

        selector: {

          label: "Quadro",

          placeholder: "Escolha um quadro",

          empty:

            "Configure um quadro nas configurações para usar esta visualização.",

        },

        toast: {

          createSuccess: "Quadro criado",

          createError: "Não foi possível criar o quadro.",

          updateSuccess: "Quadro atualizado",

          updateError: "Não foi possível atualizar o quadro.",

          deleteSuccess: "Quadro excluído",

          deleteError: "Não foi possível excluir o quadro.",

          reorderError: "Não foi possível salvar a ordem dos quadros.",

        },

      },

      empty: {

        title: "Nenhuma tarefa para exibir",

        description: "Use o botão “Adicionar tarefa” para criar a primeira.",

        filteredTitle: "Nenhuma tarefa corresponde aos filtros",

        filteredDescription:

          "Ajuste ou limpe os filtros para ver mais resultados.",

      },

      form: {

        title: "Nova tarefa",

        titleLabel: "Título",

        titlePlaceholder: "Ex.: Preparar apresentação",

        titleRequired: "Adicione um título antes de salvar.",

        descriptionLabel: "Descrição",

        descriptionPlaceholder: "Detalhes adicionais ou anotações…",

        statusLabel: "Status",

        substatusLabel: "Substatus",

        cancel: "Cancelar",

        confirm: "Salvar tarefa",

        saving: "Salvando…",

        assigneeLoadError: "Não foi possível carregar a equipe Mapache.",

        unspecifiedOption: "Não definido",

      },

      validation: {

        emailInvalid: "Insira um email válido.",

        clientNameRequired: "Informe o nome do cliente.",

        productKeyRequired: "Informe o produto.",

        websitesInvalid: "Inclua URLs válidas (https://…).",

        presentationDateInvalid: "Data inválida.",

        urlInvalid: "URL inválida.",

        numberInvalid: "Insira um número válido.",

        deliverableTitleRequired: "Insira um título.",

        deliverableUrlRequired: "Insira uma URL.",

      },

      toast: {

        loadError: "Não foi possível carregar as tarefas.",

        createSuccess: "Tarefa criada",

        createError: "Não foi possível criar a tarefa.",

        validationError: "Revise os campos destacados.",

        updateSuccess: "Tarefa atualizada",

        updateError: "Não foi possível atualizar a tarefa.",

        deleteSuccess: "Tarefa excluída",

        deleteError: "Não foi possível excluir a tarefa.",

        autoAssignSuccess: "Tarefas atribuídas automaticamente",

        autoAssignError: "Não foi possível atribuir as tarefas automaticamente.",

        autoAssignNoUsers: "Configure ao menos um Mapache antes de distribuir.",

        autoAssignNone: "Não há tarefas sem responsável.",

        filterPresetsLoadError: "Não foi possível carregar os filtros salvos.",

        filterPresetSaved: "Filtro salvo",

        filterPresetSaveError: "Não foi possível salvar o filtro.",

        filterPresetNameRequired: "Informe um nome para salvar o filtro.",

        filterPresetLoaded: "Filtro aplicado",

        filterPresetApplyError: "Não foi possível aplicar o filtro selecionado.",

      },

    },

    admin: {

      usersLegacy: {

        title: "Usuários (admin)",

        table: {

          loading: "Carregando…",

          headers: {

            email: "Email",

            name: "Nome",

            role: "Função",

            team: "Equipe",

            portals: "Portais",

            actions: "Ações",

          },

          fallback: "—",

          teamPlaceholder: "(sem equipe)",

          refresh: "Atualizar",

        },

        forms: {

          title: "Gestão de equipes",

          create: {

            placeholder: "Nova equipe",

            submit: "Criar",

          },

          rename: {

            selectPlaceholder: "(escolha uma equipe)",

            placeholder: "Novo nome",

            submit: "Renomear",

          },

          delete: {

            selectPlaceholder: "(escolha uma equipe)",

            placeholder: "Mover usuários para… (opcional)",

            submit: "Excluir / Mover",

          },

        },

        feedback: {

          save: {

            success: "Alterações salvas",

            error: {

              generic: "Não foi possível salvar as alterações",

              unauthorized: "Não autorizado",

              invalid: "Dados inválidos",

              notFound: "Registro não encontrado",

            },

          },

          teams: {

            create: {

              success: "Equipe criada",

              error: {

                generic: "Não foi possível criar a equipe",

                unauthorized: "Não autorizado",

                invalid: "Informe um nome válido",

              },

            },

            rename: {

              success: "Equipe renomeada",

              error: {

                generic: "Não foi possível renomear a equipe",

                unauthorized: "Não autorizado",

                invalid: "Escolha uma equipe e um nome válido",

                notFound: "Equipe não encontrada",

              },

            },

            delete: {

              success: "Equipe excluída",

              error: {

                generic: "Não foi possível excluir a equipe",

                unauthorized: "Não autorizado",

                invalid: "Escolha uma equipe válida",

                notFound: "Equipe não encontrada",

              },

            },

          },

        },

      },

      teams: {

        header: "Equipes",

        summary: {

          label: "Mostrando:",

          all: "todas as equipes",

          visible: "apenas equipes com integrantes",

        },

        toggleEmpty: "Mostrar equipes vazias (admin)",

        management: {

          title: "Gestão de equipes",

          placeholder: "Nova equipe",

          create: "Criar equipe",

          creating: "Criando…",

        },

        empty: {

          noTeams: "Ainda não há equipes.",

          createPrompt: "Crie a primeira com o formulário acima.",

          noVisible: "Nenhuma equipe visível ainda.",

          hint: "As equipes sem líderes nem membros são ocultadas automaticamente.",

        },

        card: {

          membersCount: "{count, plural, one {# integrante} other {# integrantes}}",

          leaders: "LÍDERES",

          members: "MEMBROS",

          rename: "Renomear",

          delete: "Excluir",

          unnamed: "(sem nome)",

          portals: {

            title: "Acesso aos portais",

            helper:

              "{count, plural, =0 {Este time não tem integrantes para atualizar.} one {Aplicará alterações a # integrante.} other {Aplicará alterações a # integrantes.}}",

            all: "Todos da equipe têm acesso.",

            partial: "{count} de {total} integrantes têm acesso.",

            none: "Nenhum integrante tem acesso.",

          },

        },

        toast: {

          createSuccess: "Equipe criada",

          createError: "Não foi possível criar a equipe",

          renameSuccess: "Equipe renomeada",

          renameError: "Não foi possível renomear a equipe",

          deleteSuccess: "Equipe excluída",

          deleteError: "Não foi possível excluir a equipe",

          portalsUpdated: "Acesso ao {portal} atualizado para {team}.",

          portalsError: "Não foi possível atualizar os acessos do time.",

          portalsNoMembers: "Este time não tem integrantes para atualizar.",

          portalsNoChanges: "Os acessos já estavam configurados.",

        },

        dialogs: {

          rename: {

            title: "Renomear equipe",

            descriptionPrefix: "Alterar nome de",

            descriptionSuffix: ".",

            inputLabel: "Novo nome",

            inputPlaceholder: "Ex.: Lobos",

            validation: "Mínimo de 2 caracteres",

            confirm: "Renomear",

          },

          delete: {

            title: "Excluir equipe",

            description:

              "Tem certeza de que deseja excluir a equipe {team}? Os usuários ficarão sem equipe.",

            confirm: "Excluir",

          },

        },

      },

      users: {

        title: "Usuários",

        kpis: {

          total: "Usuários",

          superadmins: "Superadmins",

          leaders: "Líderes",

          withoutTeam: "Sem equipe",

          active30: "Ativos em 30 dias",

          pctWithTeam: "% com equipe",

        },

        actions: {

          exportCsv: "CSV",

          refresh: "Atualizar",

        },

        filters: {

          searchLabel: "Buscar",

          searchPlaceholder: "Email ou nome…",

          roleLabel: "Função",

          teamLabel: "Equipe",

          allOption: "Todas",

          onlyNoTeam: "Somente sem equipe",

          includeEmptyTeams: "Incluir equipes vazias",

          clear: "Limpar",

          clearAria: "Remover filtro",

          chips: {

            query: "Busca: \"{query}\"",

            role: "Função: {role}",

            team: "Equipe: {team}",

            onlyNoTeam: "Somente sem equipe",

          },

        },

        table: {

          loading: "Carregando…",

          headers: {

            email: "Email",

            name: "Nome",

            role: "Função",

            team: "Equipe",

            portals: "Portais",

            actions: "Ações",

          },

          sortTooltip: "Ordenar",

          openProfile: "Abrir perfil",

          changeRole: "Alterar função",

          assignTeam: "Definir equipe",

          placeholderTeam: "(sem equipe)",

          dropdown: {

            copyEmail: "Copiar email",

            viewHistory: "Ver histórico",

            removeTeam: "Remover da equipe",

            viewProfile: "Perfil",

          },

          lastLogin: "Último acesso: {value}",

          noResults: "Nenhum resultado para os filtros.",

        },

        toast: {

          unauthorized: "Não autorizado",

          saved: "Alterações salvas",

          copySuccess: "Email copiado",

          copyError: "Não foi possível copiar",

          missingEmail: "O usuário não tem email",

          csvExported: "CSV exportado",

        },

        export: {

          filename: "usuarios.csv",

          headers: {

            email: "Email",

            name: "Nome",

            role: "Função",

            team: "Equipe",

            lastLogin: "Último login",

            created: "Criado",

          },

        },

        relative: {

          minutes: "há {count}m",

          hours: "há {count}h",

          days: "há {count}d",

        },

        portals: {

          directAlways: "Portal Direto habilitado automaticamente.",

          mapache: "Portal Mapache",

          partner: "Portal Partner",

          marketing: "Portal Marketing",

        },

      },

    },

    goals: {

      page: {

        title: "Metas",

        teamTitle: "Minha equipe",

        teamTitleWithName: "Equipe {team} — Detalhe",

        emptySuperadmin: "Selecione uma equipe acima para ver as metas.",

        emptyMember: "Você ainda não faz parte de uma equipe.",

      },

      quarterPicker: {

        year: "Ano",

        quarter: "Trimestre",

      },

      individual: {

        title: "Meta individual",

        quarterlyGoalLabel: "Meta trimestral",

        monthlyGoalLabel: "Meta mensal",

        progressLabel: "Progresso",

        remainingLabel: "Restante",

        monthLabel: "Mês {month}",

        quarterlyBarLabel: "Meta trimestral",

        monthlyBarLabel: "Meta mensal (vendas do mês atual)",

        monthlyProgressLabel: "Vendas do mês",

        monthlyRemainingLabel: "Restante do mês",

        monthlyCompleted: "{pct}% da meta mensal",

        completed: "{pct}% concluído",

        progressTitle: "Progresso do trimestre {year} — Q{quarter}",

        period: "Período: {from} — {to}",

        editCta: "Editar minha meta",

        manualCta: "Registrar Won manual",

        metrics: {

          goal: "Meta",

          progress: "Progresso (WON)",

          remaining: "Restante",

          pct: "% Conclusão",

        },

        dialog: {

          title: "Editar meta pessoal",

          description: "Informe a meta do trimestre em USD.",

          inputLabel: "Valor (USD)",

          inputPlaceholder: "Ex: 5000",

          confirm: "Salvar",

        },

      },

      team: {

        title: "Meta da equipe",

        selectPlaceholder: "Selecione uma equipe…",

        exportCsv: "CSV",

        empty: {

          superadmin: "Selecione uma equipe para ver as metas.",

          member: "Você ainda não faz parte de uma equipe.",

        },

        progressTitle: "Progresso do trimestre {year} — Q{quarter}",

        progressLabel: "Progresso",

        remainingLabel: "Restante",

        completed: "{pct}% concluído",

        deltaLabel: "Delta da meta vs soma dos membros:",

        deltaLabelShort: "Delta de alinhamento",

        teamGoalLabel: "Meta da equipe",

        membersSumLabel: "Soma das metas individuais",

        editCta: "Editar meta da equipe",

        metrics: {

          goal: "Meta da equipe",

          progress: "Progresso (WON)",

          remaining: "Restante",

          pct: "% Conclusão",

        },

        dialog: {

          title: "Editar meta da equipe",

          description:

            "Defina a meta do trimestre em USD. Não precisa coincidir com a soma individual.",

          inputLabel: "Valor (USD)",

          inputPlaceholder: "Ex: 25000",

          confirm: "Salvar",

        },

      },

      table: {

        headers: {

          user: "Usuário",

          goal: "Meta",

          progress: "Progresso",

          pct: "% Concl.",

        },

        labels: {

          monthly: "Mensal",

          visual: "Progresso visual",

        },

        actions: {

          title: "Ações",

          profile: "Perfil",

          edit: "Editar",

          cancel: "Cancelar",

          save: "Salvar",

        },

        loading: "Carregando…",

        empty: "Sem membros ou sem dados.",

      },

      csv: {

        headers: {

          user: "Usuário",

          goal: "Meta trimestral",

          progress: "Progresso (WON)",

          pct: "%",

        },

        fileName: "metas_{team}.csv",

        fallbackTeam: "equipe",

      },

      billing: {

        title: "Minha faturação",

        subtitle: "{count, plural, one {# negócio registrado} other {# negócios registrados}}",

        loading: "Carregando faturação…",

        empty: "Você ainda não registrou negócios ganhos neste trimestre.",

        unknownCompany: "Sem empresa",

        autoLabel: "Auto",

        manualLabel: "Manual",

        wonTypeNew: "Novo cliente",

        wonTypeUpsell: "Upsell",

        manualCta: "Registrar Won manual",

        deleteManual: "Excluir",

        deleteManualTitle: "Confirmar Exclusão",

        deleteManualConfirm: "Tem certeza de que deseja excluir o Won manual de {company}?",

        deleteCancel: "Cancelar",

        deleteConfirm: "Excluir",

        deleteWarning: "Esta ação não pode ser desfeita. O progresso da sua meta será ajustado automaticamente.",

        wonTypeLabel: "Tipo de Won",

        editBilling: "Atualizar faturado",

        monthlyFee: "Fee mensal",

        billed: "Faturado",

        pending: "Pendente",

        viewProposal: "Ver proposta",

        totalMonthly: "Total fees mensais",

        totalBilled: "Total faturado",

        totalPending: "Total pendente",

        editBillingPrompt: "Novo valor faturado para {company}",

        invalidAmount: "Informe um número válido",

      },

      ranking: {

        title: "Ranking da equipe",

        subtitle: "Equipe {team}",

        subtitleNoTeam: "Sem equipe atribuída",

        modeDeals: "Por negócios",

        modeAmount: "Por valor",

        emptyTeam: "Selecione uma equipe para ver o ranking.",

        loading: "Calculando ranking…",

        empty: "Sem dados para este trimestre.",

        dealsLabel: "Negócios ganhos",

        amountLabel: "Valor ganho",

        dealsCount: "{count, plural, one {# negócio} other {# negócios}}",

        amountShort: "Valor: {amount}",

        positionLabel: "#{position}",

      },

      toast: {

        myGoalSaved: "Meta atualizada",

        myGoalError: "Não foi possível salvar sua meta",

        userGoalSaved: "Meta do usuário atualizada",

        userGoalError: "Não foi possível atualizar a meta do usuário",

        teamGoalSaved: "Meta da equipe atualizada",

        teamGoalError: "Não foi possível atualizar a meta da equipe",

        restrictedEdit: "Apenas líderes ou superadmins podem editar metas de outras pessoas.",

        manualWonSaved: "Won manual registrado",

        manualWonError: "Não foi possível registrar o Won manual",

        manualWonDeleted: "Won manual excluído",

        manualWonDeleteError: "Não foi possível excluir o Won manual",

        billingSaved: "Faturação atualizada",

        billingError: "Não foi possível atualizar a faturação",

      },

      validation: {

        nonNegative: "Deve ser ≥ 0",

        required: "Campo obrigatório",

      },

      manualDialog: {

        title: "Registrar Won manual",

        target: "Registrando para {target}",

        companyLabel: "Empresa",

        companyPlaceholder: "Ex: Empresa XYZ",

        monthlyFeeLabel: "Fee mensal",

        monthlyFeePlaceholder: "Ex: 2000",

        proposalUrlLabel: "Link da proposta",

        proposalUrlPlaceholder: "https://…",

        wonTypeLabel: "Classificacao do Won",

        wonTypeNew: "Novo cliente",

        wonTypeUpsell: "Upsell",

        cancel: "Cancelar",

        confirm: "Salvar",

        saving: "Salvando…",

        submitError: "Não foi possível salvar o Won manual",

      },

    },

    proposals: {

      errors: {

        catalog: {

          loadFailed: "Não foi possível carregar o catálogo.",

          createFailed: "Não foi possível criar o item.",

          updateFailed: "Não foi possível atualizar o item.",

          deleteFailed: "Não foi possível excluir o item.",

          categories: {

            loadFailed: "Não foi possível carregar as categorias.",

            createFailed: "Não foi possível criar a categoria.",

            renameFailed: "Não foi possível renomear a categoria.",

            deleteFailed: "Não foi possível excluir/mover a categoria.",

          },

        },

        filiales: {

          loadFailed: "Não foi possível carregar as filiais.",

          createGroupFailed: "Não foi possível criar a filial.",

          renameGroupFailed: "Não foi possível renomear a filial.",

          deleteGroupFailed: "Não foi possível excluir a filial.",

          createCountryFailed: "Não foi possível adicionar o país.",

          renameCountryFailed: "Não foi possível renomear o país.",

          deleteCountryFailed: "Não foi possível excluir o país.",

          unauthorized: "Você não tem permissão para executar esta ação.",

        },

        glossary: {

          loadFailed: "Não foi possível carregar o glossário.",

          createFailed: "Não foi possível criar o link.",

          updateFailed: "Não foi possível atualizar o link.",

          deleteFailed: "Não foi possível excluir o link.",

          unauthorized: "Você não tem permissão para executar esta ação.",

        },

        pricing: {

          whatsAppFailed: "Não foi possível calcular WhatsApp.",

          minutesFailed: "Não foi possível calcular Minutos.",

        },

        proposal: {

          saveFailed: "Não foi possível salvar a proposta.",

        },

      },

      onboarding: {
        title: "Complete seus dados",
        intro:
          "Para personalizar sua experiência precisamos saber seu time, cargo e líder direto.",
        teamLabel: "De qual time (versão animal) você faz parte?",
        selectPlaceholder: "(escolha um time)",
        teamOtherOption: "Outros...",
        customTeamLabel: "Informe o nome do time",
        customTeamPlaceholder: "Ex.: CX Especiais",
        positionLabel: "Nome do cargo",
        positionPlaceholder: "Ex.: Líder de Operações",
        leaderEmailLabel: "Email do líder direto",
        leaderEmailHint: "Precisa ser um e-mail @wisecx.com",
        actions: {
          save: "Salvar",
          saving: "Salvando…",
        },
        toasts: {
          saved: "Informações salvas",
          error: "Não foi possível salvar suas informações",
        },
        errors: {
          leaderEmail: "Informe um e-mail válido @wisecx.com",
        },
      },

      countries: {

        Argentina: "Argentina",

        Alemania: "Alemanha",

        Aruba: "Aruba",

        Belgica: "Bélgica",

        Bolivia: "Bolívia",

        Brasil: "Brasil",

        "Canadá": "Canadá",

        Chile: "Chile",

        Colombia: "Colômbia",

        "Costa Rica": "Costa Rica",

        Ecuador: "Equador",

        Egipto: "Egito",

        "El Salvador": "El Salvador",

        España: "Espanha",

        "Estados Unidos": "Estados Unidos",

        Francia: "França",

        Guatemala: "Guatemala",

        "Haití": "Haiti",

        Honduras: "Honduras",

        India: "Índia",

        Indonesia: "Indonésia",

        Israel: "Israel",

        Italia: "Itália",

        Jamaica: "Jamaica",

        Malasia: "Malásia",

        "México": "México",

        Nicaragua: "Nicarágua",

        Nigeria: "Nigéria",

        Noruega: "Noruega",

        "Países Bajos": "Países Baixos",

        "Pakistán": "Paquistão",

        "Panamá": "Panamá",

        Paraguay: "Paraguai",

        "Perú": "Peru",

        Polonia: "Polônia",

        "Puerto Rico": "Porto Rico",

        "Reino Unido": "Reino Unido",

        "República Dominicana": "República Dominicana",

        Rumania: "Romênia",

        Rusia: "Rússia",

        "Arabia Saudita": "Arábia Saudita",

        Suecia: "Suécia",

        Suiza: "Suíça",

        "Turquía": "Turquia",

        Uruguay: "Uruguai",

        Venezuela: "Venezuela",

        "Emiratos Árabes Unidos": "Emirados Árabes Unidos",

        "Resto de Asia": "Resto da Ásia",

        "Resto de Europa": "Resto da Europa",

        "Resto de Africa": "Resto da África",

        "Resto de America": "Resto da América",

        Other: "Outro",

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

          modeLabel: "Sincronização com o Pipedrive",

          options: {

            sync: "Sincronizar negócio no Pipedrive",

            skip: "Não sincronizar negócio no Pipedrive",

            create: "Criar novo negócio no Pipedrive",

          },

          notAvailable: "Funcionalidade indisponível.",

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

          minutesApplied: "Minutos aplicados",

          wiserApplied: "Wiser PRO adicionado",

          itemDeleted: "Item excluído",

          itemDeleteError: "Não foi possível excluir o item: {message}",

          proposalCreated: "Proposta registrada",

        },

        whatsappCalculator: {

          title: "Calculadora de WhatsApp",

          description:

            "Informe quantas conversas precisa por tipo para estimar o credito.",

          fields: {

            subsidiary: "Filial de faturamento",

            destination: "Pais de destino",

            destinationPlaceholder: "Selecione um pais",

            marketing: "Conversas de Marketing",

            utility: "Conversas de Utility",

            auth: "Conversas de Auth",

          },

          actions: {

            calculate: "Calcular",

            calculating: "Calculando...",

            reset: "Reiniciar",

          },

          result: {

            label: "Credito necessario",

          },

          errors: {

            missingSubsidiary: "Selecione uma filial antes de calcular.",

            missingCountry: "Selecione um pais de destino.",

          },

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

          oneShot: "Pagamento unico",

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

      history: {

        title: "Histórico",

        actions: {

          downloadCsvTitle: "Baixar CSV da visão filtrada",

          downloadCsv: "CSV",

          refreshTitle: "Atualizar",

          refresh: "Atualizar",

        },

        quickRanges: {

          currentMonth: "Mês atual",

          previousMonth: "Mês anterior",

          currentWeek: "Semana atual",

          previousWeek: "Semana anterior",

        },

        filters: {

          team: {

            label: "Equipe",

            all: "Todas",

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

          clear: "Limpar",

          from: "De",

          to: "Até",

        },

        table: {

          headers: {

            id: "ID",

            company: "Empresa",

            country: "País",

            email: "Email",

            monthly: "Mensal",

            created: "Criado",

            status: "Status",

            actions: "Ações",

          },

          sortTooltip: "Ordenar",

          copyId: "Copiar ID",

          emailFallback: "—",

          monthlyTitle: "Mensal",

          createdTitle: "Data de criação",

          statusBadges: {

            won: "Ganha",

            lost: "Perdida",

            open: "Aberta",

          },

          wonTypeBadges: {

            newCustomer: "Novo cliente",

            upsell: "Upsell",

          },

          statusLabels: {

            won: "Ganha",

            lost: "Perdida",

            open: "Aberta",

          },

          actions: {

            reopenTooltip: "Reverter para OPEN",

            reopen: "OPEN",

            markWonTooltip: "Marcar como WON",

            markWon: "WON",

            open: "Abrir proposta",

            view: "Ver",

            copyLink: "Copiar link",

            copy: "Copiar",

            noLink: "—",

            deleteTooltip: "Excluir (não conta nas estatísticas)",

            delete: "Excluir",

          },

          empty: "Sem resultados para o filtro selecionado.",

        },

        pagination: {

          display: "Mostrando {start}–{end} de {total}",

          perPage: "{count} / página",

          previous: "Anterior",

          next: "Próxima",

          pageStatus: "{current} / {total}",

        },

        wonTypeModal: {

          title: "Classificar Won",

          description: "Escolha se o Won representa um novo cliente ou um upsell.",

          newCustomer: "Novo cliente",

          upsell: "Upsell",

          cancel: "Cancelar",

          confirm: "Confirmar",

          saving: "Salvando...",

        },

        deleteModal: {

          title: "Excluir proposta",

          cancel: "Cancelar",

          confirm: "Excluir",

          message: "Esta ação remove a proposta das estatísticas. Deseja continuar?",

        },

        toast: {

          markWonError: "Não foi possível marcar como WON",

          markWonSuccess: "Marcada como WON",

          markOpenError: "Não foi possível reverter para OPEN",

          markOpenSuccess: "Proposta revertida para OPEN",

          deleteError: "Não foi possível excluir",

          deleteSuccess: "Proposta excluída",

        },

        csv: {

          fileName: "historico.csv",

          headers: {

            id: "ID",

            company: "Empresa",

            country: "País",

            email: "Email",

            monthly: "Mensal",

            created: "Criado",

            status: "Status",

            url: "URL",

          },

        },

      },

      stats: {

        title: "Estatísticas",

        quickRanges: {

          quarterTooltip: "Aplicar intervalo do trimestre",

          currentMonth: "Mês atual",

          previousMonth: "Mês anterior",

          currentWeek: "Semana atual",

          previousWeek: "Semana anterior",

        },

        filters: {

          from: "De",

          to: "Até",

          team: {

            label: "Equipe",

            all: "Todas",

          },

          country: {

            label: "País",

            all: "Todos",

          },

          user: {

            label: "Usuário",

            all: "Todos",

          },

          orderBy: {

            label: "Ordenar por",

            createdAt: "Data de criação",

            totalAmount: "Valor mensal",

          },

          direction: {

            label: "Direção",

            desc: "Descendente",

            asc: "Ascendente",

          },

          active: {

            title: "Filtros ativos",

            none: "Nenhum filtro aplicado",

            clear: "Remover filtro",

          },

          summary: "Exibindo {filtered} de {total} propostas ({percent}%)",

        },

        actions: {

          reset: "Limpar",

          exportFiltered: "Exportar",

          showAll: "Ver tudo",

          showAllTitle: "Ver todos os resultados",

          topN: "Top N",

          topNTitle: "Top N (agregado)",

          csvButton: "CSV",

          csvTooltip: "Baixar CSV completo",

        },

        toast: {

          loadError: "Não foi possível carregar as propostas",

          networkError: "Erro de rede ao carregar propostas",

          reset: "Filtros redefinidos",

          csv: {

            sku: "CSV de itens baixado",

            country: "CSV por país baixado",

            user: "CSV por usuário baixado",

            filtered: "CSV de propostas filtradas baixado",

          },

        },

        csv: {

          sku: {

            fileName: "stats_por_sku.csv",

            headers: {

              sku: "SKU",

              item: "Item",

              quantity: "Quantidade total",

            },

          },

          country: {

            fileName: "stats_por_pais.csv",

            headers: {

              country: "País",

              quantity: "Quantidade",

            },

          },

          user: {

            fileName: "stats_por_usuario.csv",

            headers: {

              user: "Usuário (email)",

              proposals: "Propostas",

            },

          },

          filtered: {

            fileName: "propostas_filtradas.csv",

            headers: {

              id: "ID",

              company: "Empresa",

              country: "País",

              user: "Usuário",

              monthly: "Mensal",

              hours: "Horas",

              oneShot: "OneShot",

              created: "Criado",

              url: "URL",

            },

          },

        },

        kpis: {

          generated: "Propostas geradas",

          uniqueUsers: "Usuários únicos",

          uniqueCompanies: "Empresas distintas",

          totalMonthly: "Valor mensal total",

          averagePerProposal: "Média por proposta",

          wonCount: "Propostas WON",

          wonAmount: "Valor WON",

          winRate: "Taxa de ganho",

          wonAverageTicket: "Ticket médio WON",

        },

        sections: {

          deepDive: "Análise aprofundada",

          bySku: {

            title: "Itens mais cotados (por SKU)",

          },

          byCountry: {

            title: "Propostas por país",

          },

          byUser: {

            title: "Top usuários por quantidade de propostas",

          },

        },

        charts: {

          empty: "Dados insuficientes para esta visualização.",

          others: "Outros",

          trend: {

            positive: "+{value}% vs. período anterior",

            negative: "-{value}% vs. período anterior",

            equal: "Sem mudanças vs. período anterior",

            unavailable: "Sem histórico suficiente",

          },

          monthlyPerformance: {

            title: "Evolução mensal",

            description: "Acompanhe o volume de propostas e o valor mensal gerado.",

            countLabel: "Propostas",

            amountLabel: "Valor mensal",

            latestLabel: "Último mês com dados: {label}",

          },

          statusDistribution: {

            title: "Status das propostas",

            description: "Veja como o pipeline filtrado está distribuído.",

            totalLabel: "Total filtrado: {total}",

            unknown: "Sem status",

          },

          countryLeaderboard: {

            title: "Países mais ativos",

            description: "Onde mais propostas estão sendo geradas.",

          },

          skuMomentum: {

            title: "Itens em destaque",

            description: "SKUs com mais cotações no período atual.",

          },

        },

        table: {

          empty: "Sem dados para os filtros selecionados.",

          sku: {

            headers: {

              sku: "SKU",

              item: "Item",

              quantity: "Quantidade total",

            },

          },

          country: {

            headers: {

              country: "País",

              quantity: "Quantidade",

            },

            footer: {

              showAll: "Mostrando todos ({count})",

              total: "Total de países: {count}",

            },

          },

          user: {

            headers: {

              user: "Usuário (email)",

              proposals: "Propostas",

            },

            fallback: "(sem email)",

          },

        },

      },

    },

  };

export default messages;
