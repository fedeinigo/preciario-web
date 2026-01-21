import type { DeepRecord } from "./types";

const messages: DeepRecord = {

    common: {

      language: {

        label: "Language",

        spanish: "Spanish",

        english: "English",

        portuguese: "Portuguese",

      },

      combobox: {

        placeholder: "Select…",

        noResults: "No results",

        open: "Open",

      },

      dialog: {

        title: "Confirm",

        confirm: "Confirm",

        cancel: "Cancel",

        processing: "Processing…",

        required: "This field is required.",

      },

      loading: {

        session: "Loading your session…",

      },

      roles: {

        superadmin: "Superadmin",

        admin: "Admin",

        lider: "Leader",

        usuario: "User",

        unknown: "Role not set",

      },

      profileModal: {

        title: "My profile and goal",

        periodSummary: "Period: {year} - Q{quarter} ({from} — {to})",

        buttons: {

          close: "Close",

          save: "Save goal",

        },

        viewerBadge: "Edited as {role}",

        labels: {

          role: "Role",

          team: "Team",

          position: "Position",

          leader: "Leader",

          period: "Period & Goal",

          year: "Year",

          quarter: "Quarter",

          goal: "Goal (USD)",

        },

        fallbacks: {

          name: "(no name)",

          team: "—",

          email: "—",

          position: "—",

          leader: "—",

        },

      },

      footer: {

        logoAlt: "Wise CX",

        copy: "© 2025 Wise CX — Smart Solutions",

        developedBy: "Built by {name}",

        contact: "federico.i@wisecx.com",

      },

      teamSelectModal: {

        title: "Choose your team",

        description: "This selection is used to segment History and Stats.",

        cancel: "Cancel",

        confirm: "Confirm",

        saving: "Saving…",

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

      logoAlt: "Wise CX",

      ariaLabel: "Primary",

      tabsAriaLabel: "Navigation tabs",

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

        mapachePortal: "Mapache Portal",

        mapachePortalReturn: "Web Generator",

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

        name: "User",

        team: "—",

        email: "—",

      },

      mapachePortalSections: {

        pipedrive: "Pipedrive",

        goals: "Goals",

        generator: "Generator",

        tasks: "Tasks",

        metrics: "Metrics",

      },

      portalSwitcher: {

        button: "Portal",

        title: "Choose a portal",

        description: "Select where you want to go.",

        action: "Enter",

        loading: "Entering portal",

        options: {

          direct: {

            label: "Direct Portal",

            description: "Web generator",

          },

          mapache: {

            label: "Mapache Portal",

            description: "Workspace for the Mapache team",

          },

          partner: {

            label: "Partner Portal",

            description: "Resources for partner administrators",

          },

          marketing: {

            label: "Marketing Portal",

            description: "Marketing campaigns and assets",

          },

        },

      },

    },

    configurations: {

      title: "Configurations",

      description: "Manage Direct Portal teams and users.",

      tabs: {

        home: "Home",

        teams: "Team management",

        users: "User management",

      },

      sections: {

        visit: "Go to section",

        back: "Back to Configurations",

      },

      teamPanel: {

        header: {

          title: "Team management",

          description: "Create, rename or delete teams and manage their portal access.",

        },

        form: {

          title: "Create team",

          subtitle: "Pick a clear name to organise your users.",

          placeholder: "Team name",

          submit: "Add team",

        },

        summary: {

          label: "Total teams:",

        },

        table: {

          title: "Active teams",

          loading: "Refreshing teams…",

          empty: "There are no teams yet.",

          people: "people",

          noPortals: "No access configured.",

          headings: {

            team: "Team",

            leaders: "Leaders",

            members: "Members",

            portals: "Portals",

            actions: "Actions",

          },

        },

        actions: {

          portals: "Portals",

          rename: "Rename",

          delete: "Delete",

        },

        rename: {

          title: "Rename team",

          description: "Update the name so everyone can identify it easily.",

          cancel: "Cancel",

          save: "Save changes",

        },

        portals: {

          title: "{team} access",

          description: "Apply or remove portal access for every member in the team.",

          members: "members",

          enable: "Enable",

          disable: "Revoke",

          empty: "The team has no members yet.",

          noChanges: "Access was already configured.",

          updated: "{team} access to {portal} updated.",

          error: "We couldn't update the access.",

          saving: "Applying changes…",

        },

        dialogs: {

          delete: {

            title: "Delete team",

            description: "Are you sure you want to delete {team}? Users will remain without a team.",

            confirm: "Delete",

          },

        },

        toast: {

          createSuccess: "Team created",

          createError: "Couldn't create the team",

          renameSuccess: "Team renamed",

          renameError: "Couldn't rename the team",

          deleteSuccess: "Team deleted",

          deleteError: "Couldn't delete the team",

        },

      },

      userPanel: {

        header: {

          title: "User management",

          description: "Update role, team and portal access for every user in the portal.",

        },

        filters: {

          searchPlaceholder: "Search by name or email…",

          allRoles: "All roles",

          allTeams: "All teams",

          onlyNoTeam: "Only without team",

        },

        table: {

          headers: {

            name: "User",

            role: "Role",

            team: "Team",

            portals: "Portals",

            actions: "Status",

          },

          noResults: "No results for the current filters.",

          placeholderName: "(no name)",

          placeholderTeam: "(no team)",

          saving: "Saving…",

          synced: "Up to date",

          loading: "Loading users…",

        },

        toast: {

          saveSuccess: "Changes saved",

          saveError: "Couldn't save the changes",

        },

      },

    },

    mapachePortal: {

      title: "Mapache Portal",

      loading: "Loading tasks…",

      loadFallback:

        "We couldn't refresh tasks. Showing the latest known data.",

      noDescription: "No description provided.",

      statuses: {

        all: "All",

        pending: "Pending",

        in_progress: "In progress",

        completed: "Completed",

      },

      filters: {

        advancedFilters: "Advanced filters",

        advancedFiltersTitle: "Advanced filters",

        advancedFiltersSubtitle:

          "Combine multiple criteria to find the right tasks.",

        advancedFiltersSummary: "Filter summary",

        advancedFiltersSummaryEmpty: "No advanced filters are active yet.",

        mine: "My tasks",

        unassigned: "Unassigned",

        open: "Advanced filters",

        title: "Advanced filters",

        reset: "Clear filters",

        resetAdvancedFilters: "Clear advanced filters",

        close: "Close",

        needFromTeam: "Team need",

        directness: "Lead type",

        integrationType: "Integration type",

        origin: "Signal origin",

        assignee: "Assigned to",

        noAssignees: "No assignments available yet.",

        searchPlaceholder: "Search…",

        clearSearch: "Clear search",

        clearSelection: "Clear selection",

        noResults: "No matches found",

        selectionHelper: "No items selected yet.",

        presentationDate: "Presentation date",

        from: "From",

        to: "To",

        summary: "Summary",

        summaryEmpty: "No filters are active yet.",

        advancedFiltersHint:

          "Filters are applied automatically when closing this panel.",

        needFromTeamTooltip: "Choose the relevant team needs.",

        needFromTeamHelper: "Pick one or more needs to filter by.",

        needFromTeamSearch: "Search needs…",

        needFromTeamEmpty: "No needs available.",

        directnessTooltip: "Filter by lead type.",

        directnessHelper: "Pick one or more lead types.",

        directnessSearch: "Search lead types…",

        directnessEmpty: "No lead types available.",

        integrationTypeTooltip: "Choose the available integration types.",

        integrationTypeHelper: "Pick one or more integration types.",

        integrationTypeSearch: "Search integration types…",

        integrationTypeEmpty: "No integration types recorded.",

        originTooltip: "Limit by the most relevant origins.",

        originHelper: "Pick one or more origins.",

        originSearch: "Search origins…",

        originEmpty: "No origins available.",

        assigneeTooltip: "Find Mapaches quickly.",

        assigneeHelper: "Pick teammates to filter by.",

        assigneeSearch: "Search Mapaches…",

        assigneeEmpty: "No Mapaches match your search.",

        savePreset: "Save filter",

        savingPreset: "Saving…",

        loadPreset: "Load filter",

        presetsLabel: "Saved filters",

        selectPresetPlaceholder: "Choose a saved filter",

        noPresets: "No saved filters yet",

        savePresetPrompt: "Enter a name for this filter preset.",

      },

      insights: {

        title: "Pipeline pulse",

        subtitle: "Quick insights to understand Mapache demand.",

        activeScope: "Showing: {scope}",

        scopes: {

          filtered: "Filtered tasks",

          all: "All tasks",

        },

        cards: {

          total: "Active tasks",

          dueSoon: "Due in next 7 days",

          overdue: "Overdue",

        },

        sections: {

          status: "By status",

          substatus: "By substatus",

          need: "Team need",

          workload: "Workload by Mapache",

          upcoming: "Upcoming agenda",

          timeline: "Historic trend",

        },

        charts: {

          status: {

            description: "Total tasks grouped by current status.",

          },

          axis: {

            tasks: "Tasks",

          },

        },

        segments: {

          label: "Segmentation",

          mode: {

            none: "No segmentation",

            team: "By team",

            assignee: "By Mapache",

          },

          focus: {

            all: "All",

          },

          others: "Others",

          team: {

            mapache: "Mapache team",

            external: "Other teams",

            unassigned: "Unassigned",

          },

        },

        timeRange: {

          lastSixWeeks: "Last 6 weeks",

          lastTwelveWeeks: "Last 12 weeks",

          lastTwentyFourWeeks: "Last 24 weeks",

          all: "Entire history",

        },

        timeline: {

          description: "Track total volume week over week.",

          empty: "Not enough historical snapshots yet.",

          meta: "Due soon: {dueSoon} · Overdue: {overdue}",

        },

        empty: "No data yet.",

        upcomingEmpty: "No upcoming dates recorded.",

        needs: {

          none: "Not specified",

        },

        trend: {

          positive: "+{value} vs. last week",

          negative: "{value} fewer vs. last week",

          equal: "No change vs. last week",

          unavailable: "No historical data",

          filtered: "Based on active filters",

        },

        trendShort: {

          positive: "+{value}",

          negative: "-{value}",

          equal: "0",

          unavailable: "—",

          filtered: "Filtered",

        },

      },

      statusBadges: {

        unassigned: "Unassigned",

        assigned: "Assigned",

        in_progress: "In progress",

        completed: "Completed",

      },

      enums: {

        needFromTeam: {

          QUOTE_SCOPE: "Quote & scope",

          QUOTE: "Quote",

          SCOPE: "Scope",

          PRESENTATION: "Presentation",

          OTHER: "Other",

        },

        directness: {

          DIRECT: "Direct",

          PARTNER: "Partner",

        },

        integrationType: {

          REST: "REST",

          GRAPHQL: "GraphQL",

          SDK: "SDK",

          OTHER: "Other",

        },

        integrationOwner: {

          OWN: "In-house",

          THIRD_PARTY: "Third party",

        },

        origin: {

          GOOGLE_FORM: "Google Form",

          GENERATOR: "Generator",

          API: "API",

          MANUAL: "Manual",

          OTHER: "Other",

        },

        deliverableType: {

          SCOPE: "Scope",

          QUOTE: "Quote",

          SCOPE_AND_QUOTE: "Scope & quote",

          OTHER: "Other",

        },

      },

      substatuses: {

        backlog: "Backlog",

        waiting_client: "Waiting for client",

        blocked: "Blocked",

      },

      deliverables: {

        title: "Deliverables",

        empty: "No deliverables yet.",

        open: "Open",

        types: {

          scope: "Scope",

          quote: "Quote",

          scope_and_quote: "Scope & quote",

          other: "Other",

        },

      },

      actions: {

        add: "Add task",

        statusLabel: "Status",

        substatusLabel: "Substatus",

        delete: "Delete",

        remove: "Remove",

        deleting: "Deleting…",

        deleteConfirm: "Are you sure you want to delete task {id}?",

        cancel: "Cancel",

      },

      settings: {

        title: "Mapache Portal settings",

        tabs: {

          assignment: "Assignment",

          boards: "Boards",

          statuses: "Statuses",

        },

      },

      statusSettings: {

        title: "Task statuses",

        description:

          "Manage the statuses available in Mapache Portal. Changes propagate to filters, forms, and boards.",

        form: {

          keyLabel: "Key",

          keyHint: "Stored in uppercase and must be unique.",

          labelLabel: "Display label",

          orderLabel: "Order (ascending)",

        },

        create: {

          heading: "Create status",

          description: "Provide the key, label, and order for the new status.",

          submit: "Create status",

          saving: "Creating…",

        },

        edit: {

          heading: "Edit status",

          description: "Select an existing status to update its information.",

          selectLabel: "Status",

          selectPlaceholder: "Pick a status",

          submit: "Save changes",

          saving: "Saving…",

          delete: "Delete status",

        },

        delete: {

          confirmTitle: "Delete status",

          confirmDescription:

            "This will remove \"{label}\" and may impact filters or boards.",

          cancel: "Cancel",

          confirm: "Delete",

          deleting: "Deleting…",

        },

        list: {

          heading: "Current statuses",

          empty: "No statuses configured yet.",

          order: "Order",

          key: "Key",

          label: "Label",

          actions: "Actions",

          edit: "Edit",

          delete: "Delete",

        },

        validation: {

          keyRequired: "Enter a key.",

          labelRequired: "Enter a label.",

          orderRequired: "Enter an order.",

          orderInvalid: "Enter a valid number.",

        },

        toast: {

          validationError: "Check the highlighted fields.",

          createSuccess: "Status created",

          createError: "Could not create the status.",

          updateSuccess: "Status updated",

          updateError: "Could not update the status.",

          deleteSuccess: "Status deleted",

          deleteError: "Could not delete the status.",

        },

      },

      assignment: {

        configure: "Settings",

        title: "Automatic assignment",

        description:

          "Set the percentage of unassigned tasks each Mapache should receive. Values are normalized automatically.",

        percentageLabel: "Desired percentage",

        reset: "Reset ratios",

        totalLabel: "Configured total",

        normalizedHint: "Percentages automatically adjust to add up to 100%.",

        empty: "No Mapache teammates available.",

        cancel: "Cancel",

        save: "Save ratios",

        autoAssign: "Auto-assign",

        autoAssigning: "Assigning…",

      },

      boards: {

        title: "Custom boards",

        description:

          "Design different Kanban views and tune the columns for your workflow.",

        loading: "Loading boards…",

        loadError: "Boards could not be loaded.",

        empty: {

          title: "No boards yet",

          description:

            "Create the first one here to customize the board view.",

          action: "Create board",

        },

        list: {

          heading: "Boards",

          reorderHint: "Use up/down to reorder",

          defaultName: "Board {index}",

        },

        form: {

          nameLabel: "Board name",

          namePlaceholder: "E.g. Weekly follow-up",

          delete: "Delete board",

          confirmDeleteTitle: "Delete board",

          confirmDeleteDescription:

            "This will remove the \"{name}\" board for the whole team.",

          cancel: "Cancel",

          confirmDelete: "Delete",

          save: "Save board",

        },

        columns: {

          heading: "Columns",

          empty: "Add at least one column so the board can work.",

          add: "Add column",

          delete: "Remove",

          moveUp: "Move up",

          moveDown: "Move down",

          titleLabel: "Name",

          statusesLabel: "Included statuses",

          defaultTitle: "Column {index}",

          dropMenuTitle: "Pick the destination status",

          dropMenuDescription: "Choose where this task should move.",

          dropMenuCancel: "Cancel",

        },

        validation: {

          nameRequired: "Enter a board name.",

          columnTitleRequired: "Each column needs a name.",

          columnStatusesRequired:

            "Each column must include at least one status.",

          columnsRequired: "Add at least one column.",

        },

        selector: {

          label: "Board",

          placeholder: "Choose a board",

          empty: "Configure a board in settings to use this view.",

        },

        toast: {

          createSuccess: "Board created",

          createError: "The board could not be created.",

          updateSuccess: "Board updated",

          updateError: "The board could not be updated.",

          deleteSuccess: "Board deleted",

          deleteError: "The board could not be deleted.",

          reorderError: "Could not save the board order.",

        },

      },

      empty: {

        title: "No tasks yet",

        description: "Use the “Add task” button to create the first one.",

        filteredTitle: "No tasks match your filters",

        filteredDescription:

          "Adjust or clear the filters to see additional tasks.",

      },

      form: {

        title: "New task",

        titleLabel: "Title",

        titlePlaceholder: "E.g. Prepare presentation",

        titleRequired: "Please add a title before saving.",

        descriptionLabel: "Description",

        descriptionPlaceholder: "Additional details or notes…",

        statusLabel: "Status",

        substatusLabel: "Substatus",

        cancel: "Cancel",

        confirm: "Save task",

        saving: "Saving…",

        assigneeLoadError: "We couldn't load the Mapache team.",

        unspecifiedOption: "Not specified",

      },

      validation: {

        emailInvalid: "Enter a valid email.",

        clientNameRequired: "Enter the client's name.",

        productKeyRequired: "Enter the product.",

        websitesInvalid: "Add valid URLs (https://…).",

        presentationDateInvalid: "Date is invalid.",

        urlInvalid: "URL is invalid.",

        numberInvalid: "Enter a valid number.",

        deliverableTitleRequired: "Enter a title.",

        deliverableUrlRequired: "Enter a URL.",

      },

      toast: {

        loadError: "Tasks could not be loaded.",

        createSuccess: "Task created",

        createError: "The task could not be created.",

        validationError: "Check the highlighted fields.",

        updateSuccess: "Task updated",

        updateError: "The task could not be updated.",

        deleteSuccess: "Task deleted",

        deleteError: "The task could not be deleted.",

        autoAssignSuccess: "Tasks auto-assigned",

        autoAssignError: "We couldn't auto-assign the tasks.",

        autoAssignNoUsers: "Configure at least one Mapache before auto-assigning.",

        autoAssignNone: "There are no unassigned tasks.",

        filterPresetsLoadError: "Saved filters could not be loaded.",

        filterPresetSaved: "Filter saved",

        filterPresetSaveError: "The filter could not be saved.",

        filterPresetNameRequired: "Enter a name to save this filter.",

        filterPresetLoaded: "Filter applied",

        filterPresetApplyError: "The selected filter could not be applied.",

      },

    },

    admin: {

      usersLegacy: {

        title: "Users (admin)",

        table: {

          loading: "Loading…",

          headers: {

            email: "Email",

            name: "Name",

            role: "Role",

            team: "Team",

            portals: "Portals",

            actions: "Actions",

          },

          fallback: "—",

          teamPlaceholder: "(no team)",

          refresh: "Refresh",

        },

        forms: {

          title: "Team management",

          create: {

            placeholder: "New team",

            submit: "Create",

          },

          rename: {

            selectPlaceholder: "(choose team)",

            placeholder: "New name",

            submit: "Rename",

          },

          delete: {

            selectPlaceholder: "(choose team)",

            placeholder: "Move users to… (optional)",

            submit: "Delete / Move",

          },

        },

        feedback: {

          save: {

            success: "Changes saved",

            error: {

              generic: "Could not save changes",

              unauthorized: "Not authorized",

              invalid: "Invalid data",

              notFound: "Record not found",

            },

          },

          teams: {

            create: {

              success: "Team created",

              error: {

                generic: "Could not create the team",

                unauthorized: "Not authorized",

                invalid: "Enter a valid name",

              },

            },

            rename: {

              success: "Team renamed",

              error: {

                generic: "Could not rename the team",

                unauthorized: "Not authorized",

                invalid: "Choose a team and a valid name",

                notFound: "Team not found",

              },

            },

            delete: {

              success: "Team deleted",

              error: {

                generic: "Could not delete the team",

                unauthorized: "Not authorized",

                invalid: "Choose a valid team",

                notFound: "Team not found",

              },

            },

          },

        },

      },

      teams: {

        header: "Teams",

        summary: {

          label: "Showing:",

          all: "all teams",

          visible: "only teams with members",

        },

        toggleEmpty: "Show empty teams (admin)",

        management: {

          title: "Team management",

          placeholder: "New team",

          create: "Create team",

          creating: "Creating…",

        },

        empty: {

          noTeams: "No teams yet.",

          createPrompt: "Create the first one using the form above.",

          noVisible: "No teams visible yet.",

          hint: "Teams without leaders or members are hidden automatically.",

        },

        card: {

          membersCount: "{count, plural, one {# member} other {# members}}",

          leaders: "LEADERS",

          members: "MEMBERS",

          rename: "Rename",

          delete: "Delete",

          unnamed: "(no name)",

          portals: {

            title: "Portal access",

            helper:

              "{count, plural, =0 {This team has no members to update.} one {Apply changes to # member.} other {Apply changes to # members.}}",

            all: "Everyone in the team has access.",

            partial: "{count} of {total} members have access.",

            none: "No member has access.",

          },

        },

        toast: {

          createSuccess: "Team created",

          createError: "Couldn't create the team",

          renameSuccess: "Team renamed",

          renameError: "Couldn't rename the team",

          deleteSuccess: "Team deleted",

          deleteError: "Couldn't delete the team",

          portalsUpdated: "{portal} access updated for {team}.",

          portalsError: "We couldn't update the team's portal access.",

          portalsNoMembers: "This team has no members to update.",

          portalsNoChanges: "No changes were needed.",

        },

        dialogs: {

          rename: {

            title: "Rename team",

            descriptionPrefix: "Rename",

            descriptionSuffix: ".",

            inputLabel: "New name",

            inputPlaceholder: "Eg: Wolves",

            validation: "At least 2 characters",

            confirm: "Rename",

          },

          delete: {

            title: "Delete team",

            description:

              "Are you sure you want to delete {team}? Users will be left without a team.",

            confirm: "Delete",

          },

        },

      },

      users: {

        title: "Users",

        kpis: {

          total: "Users",

          superadmins: "Superadmins",

          leaders: "Leaders",

          withoutTeam: "Without team",

          active30: "Active last 30 days",

          pctWithTeam: "% with team",

        },

        actions: {

          exportCsv: "CSV",

          refresh: "Refresh",

        },

        filters: {

          searchLabel: "Search",

          searchPlaceholder: "Email or name…",

          roleLabel: "Role",

          teamLabel: "Team",

          allOption: "All",

          onlyNoTeam: "Only without team",

          includeEmptyTeams: "Include empty teams",

          clear: "Clear",

          clearAria: "Remove filter",

          chips: {

            query: "Search: \"{query}\"",

            role: "Role: {role}",

            team: "Team: {team}",

            onlyNoTeam: "Only without team",

          },

        },

        table: {

          loading: "Loading…",

          headers: {

            email: "Email",

            name: "Name",

            role: "Role",

            team: "Team",

            actions: "Actions",

          },

          sortTooltip: "Sort",

          openProfile: "Open profile",

          changeRole: "Change role",

          assignTeam: "Assign team",

          placeholderTeam: "(no team)",

          dropdown: {

            copyEmail: "Copy email",

            viewHistory: "View history",

            removeTeam: "Remove from team",

            viewProfile: "Profile",

          },

          lastLogin: "Last login: {value}",

          noResults: "No results for the current filters.",

        },

        toast: {

          unauthorized: "Unauthorized",

          saved: "Changes saved",

          copySuccess: "Email copied",

          copyError: "Couldn't copy",

          missingEmail: "User doesn't have an email",

          csvExported: "CSV exported",

        },

        export: {

          filename: "users.csv",

          headers: {

            email: "Email",

            name: "Name",

            role: "Role",

            team: "Team",

            lastLogin: "Last login",

            created: "Created",

          },

        },

        relative: {

          minutes: "{count}m ago",

          hours: "{count}h ago",

          days: "{count}d ago",

        },

        portals: {

          directAlways: "Direct Portal is always enabled.",

          mapache: "Mapache Portal",

          partner: "Partner Portal",

          marketing: "Marketing Portal",

        },

      },

    },

    goals: {

      page: {

        title: "Goals",

        teamTitle: "My team",

        teamTitleWithName: "Team {team} — Detail",

        emptySuperadmin: "Select a team above to see its goals.",

        emptyMember: "You are not assigned to a team yet.",

      },

      quarterPicker: {

        year: "Year",

        quarter: "Quarter",

      },

      individual: {

        title: "Individual goal",

        quarterlyGoalLabel: "Quarter goal",

        monthlyGoalLabel: "Monthly goal",

        progressLabel: "Progress",

        remainingLabel: "Remaining",

        monthLabel: "Month {month}",

        quarterlyBarLabel: "Quarterly goal",

        monthlyBarLabel: "Monthly goal (current month sales)",

        monthlyProgressLabel: "This month's sales",

        monthlyRemainingLabel: "Remaining this month",

        monthlyCompleted: "{pct}% of the monthly goal",

        completed: "{pct}% complete",

        progressTitle: "Quarter progress {year} — Q{quarter}",

        period: "Period: {from} — {to}",

        editCta: "Edit my goal",

        manualCta: "Log manual Won",

        metrics: {

          goal: "Goal",

          progress: "Progress (WON)",

          remaining: "Remaining",

          pct: "% Completion",

        },

        dialog: {

          title: "Edit personal goal",

          description: "Enter this quarter's goal in USD.",

          inputLabel: "Amount (USD)",

          inputPlaceholder: "Ex: 5000",

          confirm: "Save",

        },

      },

      team: {

        title: "Team goal",

        selectPlaceholder: "Select a team…",

        exportCsv: "CSV",

        empty: {

          superadmin: "Select a team to view its goals.",

          member: "You are not assigned to a team yet.",

        },

        progressTitle: "Quarter progress {year} — Q{quarter}",

        progressLabel: "Progress",

        remainingLabel: "Remaining",

        completed: "{pct}% complete",

        deltaLabel: "Goal vs members delta:",

        deltaLabelShort: "Alignment delta",

        teamGoalLabel: "Team goal",

        membersSumLabel: "Sum of individual goals",

        editCta: "Edit team goal",

        metrics: {

          goal: "Team goal",

          progress: "Progress (WON)",

          remaining: "Remaining",

          pct: "% Completion",

        },

        dialog: {

          title: "Edit team goal",

          description: "Set the quarter goal in USD. It does not need to match the sum of members.",

          inputLabel: "Amount (USD)",

          inputPlaceholder: "Ex: 25000",

          confirm: "Save",

        },

      },

      table: {

        headers: {

          user: "User",

          goal: "Goal",

          progress: "Progress",

          pct: "% Compl.",

        },

        labels: {

          monthly: "Monthly",

          visual: "Visual progress",

        },

        actions: {

          title: "Actions",

          profile: "Profile",

          edit: "Edit",

          cancel: "Cancel",

          save: "Save",

        },

        loading: "Loading…",

        empty: "No members or no data.",

      },

      csv: {

        headers: {

          user: "User",

          goal: "Quarter goal",

          progress: "Progress (WON)",

          pct: "%",

        },

        fileName: "goals_{team}.csv",

        fallbackTeam: "team",

      },

      billing: {

        title: "Bonus",

        subtitle: "{count, plural, one {# won deal} other {# won deals}}",

        loading: "Loading bonus…",

        empty: "You haven't logged won deals this quarter yet.",

        unknownCompany: "No company",

        autoLabel: "Auto",

        manualLabel: "Manual",

        wonTypeNew: "New customer",

        wonTypeUpsell: "Upsell",

        manualCta: "Log manual Won",

        deleteManual: "Delete",

        deleteManualTitle: "Confirm Deletion",

        deleteManualConfirm: "Are you sure you want to delete the manual Won for {company}?",

        deleteCancel: "Cancel",

        deleteConfirm: "Delete",

        deleteWarning: "This action cannot be undone. Your goal progress will be automatically adjusted.",

        wonTypeLabel: "Won Type",

        monthlyFee: "Monthly fee",

        handoffLabel: "Hand Off",

        handoffDone: "Hand off ready",

        handoffPending: "Hand off pending",

        handoffConfirmed: "Counts toward bonus",

        handoffMissing: "Not counting yet",

        bonusAmount: "Bonus amount",

        viewProposal: "View proposal",

        totalMonthly: "Total monthly fees",

        totalHandoff: "Total via hand off",

        totalPending: "Total pending",

      },

      ranking: {

        title: "Team ranking",

        subtitle: "Team {team}",

        subtitleNoTeam: "No team assigned",

        modeDeals: "By deals",

        modeAmount: "By amount",

        emptyTeam: "Select a team to view the ranking.",

        loading: "Calculating ranking…",

        empty: "No data for this quarter.",

        dealsLabel: "Won deals",

        amountLabel: "Won amount",

        dealsCount: "{count, plural, one {# deal} other {# deals}}",

        amountShort: "Amount: {amount}",

        positionLabel: "#{position}",

      },

      toast: {

        myGoalSaved: "Goal updated",

        myGoalError: "Could not save your goal",

        userGoalSaved: "User goal updated",

        userGoalError: "Could not update the user's goal",

        teamGoalSaved: "Team goal updated",

        teamGoalError: "Could not update the team goal",

        restrictedEdit: "Only leaders or superadmins can edit other people's goals.",

        manualWonSaved: "Manual Won logged",

        manualWonError: "Could not log the manual Won",

        manualWonDeleted: "Manual Won removed",

        manualWonDeleteError: "Could not delete the manual Won",

        handoffSaved: "Hand off recorded",

        handoffRemoved: "Hand off removed",

        billingError: "Could not update billing",

      },

      validation: {

        nonNegative: "Must be ≥ 0",

        required: "Required",

      },

      manualDialog: {

        title: "Log manual Won",

        target: "Logging for {target}",

        companyLabel: "Company",

        companyPlaceholder: "Ex: Company XYZ",

        monthlyFeeLabel: "Monthly fee",

        monthlyFeePlaceholder: "Ex: 2000",

        proposalUrlLabel: "Proposal link",

        proposalUrlPlaceholder: "https://…",

        wonTypeLabel: "Won classification",

        wonTypeNew: "New customer",

        wonTypeUpsell: "Upsell",

        cancel: "Cancel",

        confirm: "Save",

        saving: "Saving…",

        submitError: "We couldn't save the manual Won",

      },

    },

    proposals: {

      errors: {

        catalog: {

          loadFailed: "Could not load the catalog.",

          createFailed: "Could not create the item.",

          updateFailed: "Could not update the item.",

          deleteFailed: "Could not delete the item.",

          categories: {

            loadFailed: "Categories could not be loaded.",

            createFailed: "Category could not be created.",

            renameFailed: "Category could not be renamed.",

            deleteFailed: "Category could not be deleted/moved.",

          },

        },

        filiales: {

          loadFailed: "Could not load subsidiaries.",

          createGroupFailed: "Could not create the subsidiary.",

          renameGroupFailed: "Could not rename the subsidiary.",

          deleteGroupFailed: "Could not delete the subsidiary.",

          createCountryFailed: "Could not add the country.",

          renameCountryFailed: "Could not rename the country.",

          deleteCountryFailed: "Could not delete the country.",

          unauthorized: "You are not allowed to perform this action.",

        },

        glossary: {

          loadFailed: "Could not load the glossary.",

          createFailed: "Could not create the link.",

          updateFailed: "Could not update the link.",

          deleteFailed: "Could not delete the link.",

          unauthorized: "You are not allowed to perform this action.",

        },

        pricing: {

          whatsAppFailed: "Could not calculate WhatsApp.",

          minutesFailed: "Could not calculate Minutes.",

        },

        proposal: {

          saveFailed: "Could not save the proposal.",

        },

      },

      onboarding: {
        title: "Complete your details",
        intro:
          "To personalize your experience we need to know your animal team, your role and your direct leader.",
        teamLabel: "Which animal team are you part of?",
        selectPlaceholder: "(choose a team)",
        teamOtherOption: "Other…",
        customTeamLabel: "Tell us the team name",
        customTeamPlaceholder: "e.g. CX Specials",
        positionLabel: "Position name",
        positionPlaceholder: "e.g. Operations Lead",
        leaderEmailLabel: "Direct leader email",
        leaderEmailHint: "Must be an @wisecx.com address",
        actions: {
          save: "Save",
          saving: "Saving…",
        },
        toasts: {
          saved: "Information saved",
          error: "We couldn’t save your information",
        },
        errors: {
          leaderEmail: "Enter a valid @wisecx.com email",
        },
      },

      countries: {

        Argentina: "Argentina",

        Alemania: "Germany",

        Aruba: "Aruba",

        Belgica: "Belgium",

        Bolivia: "Bolivia",

        Brasil: "Brazil",

        "Canadá": "Canada",

        Chile: "Chile",

        Colombia: "Colombia",

        "Costa Rica": "Costa Rica",

        Ecuador: "Ecuador",

        Egipto: "Egypt",

        "El Salvador": "El Salvador",

        España: "Spain",

        "Estados Unidos": "United States",

        Francia: "France",

        Guatemala: "Guatemala",

        "Haití": "Haiti",

        Honduras: "Honduras",

        India: "India",

        Indonesia: "Indonesia",

        Israel: "Israel",

        Italia: "Italy",

        Jamaica: "Jamaica",

        Malasia: "Malaysia",

        "México": "Mexico",

        Nicaragua: "Nicaragua",

        Nigeria: "Nigeria",

        Noruega: "Norway",

        "Países Bajos": "Netherlands",

        "Pakistán": "Pakistan",

        "Panamá": "Panama",

        Paraguay: "Paraguay",

        "Perú": "Peru",

        Polonia: "Poland",

        "Puerto Rico": "Puerto Rico",

        "Reino Unido": "United Kingdom",

        "República Dominicana": "Dominican Republic",

        Rumania: "Romania",

        Rusia: "Russia",

        "Arabia Saudita": "Saudi Arabia",

        Suecia: "Sweden",

        Suiza: "Switzerland",

        "Turquía": "Turkey",

        Uruguay: "Uruguay",

        Venezuela: "Venezuela",

        "Emiratos Árabes Unidos": "United Arab Emirates",

        "Resto de Asia": "Rest of Asia",

        "Resto de Europa": "Rest of Europe",

        "Resto de Africa": "Rest of Africa",

        "Resto de America": "Rest of America",

        Other: "Other",

      },

      itemsTable: {

        headers: {

          sku: "SKU",

          category: "Category",

          item: "Item",

          quantity: "Qty.",

          unitPrice: "Unit price",

          discount: "Discount (%)",

          subtotal: "Subtotal",

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

        wonTypeModal: {

          title: "Classify Won",

          description: "Choose whether this Won is a new customer or an upsell.",

          newCustomer: "New customer",

          upsell: "Upsell",

          cancel: "Cancel",

          confirm: "Confirm",

          saving: "Saving...",

        },

      },

      generator: {

        heading: "Proposal generator",

        emptyValue: "—",

        pipedrive: {

          modeLabel: "Pipedrive synchronization",

          options: {

            sync: "Sync deal in Pipedrive",

            skip: "Do not sync deal in Pipedrive",

            create: "Create new deal in Pipedrive",

          },

          notAvailable: "Feature not available.",

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

          exportCsv: "Download CSV",

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

          minutesApplied: "Minutes applied",

          wiserApplied: "Wiser PRO added",

          itemDeleted: "Item deleted",

          itemDeleteError: "Could not delete the item: {message}",

          proposalCreated: "Proposal saved",

          csvExported: "Catalog exported",

        },

        csv: {

          fileName: "product_catalog.csv",

          headers: {

            sku: "SKU",

            name: "Name",

            description: "Description",

            category: "Category",

            devHours: "Development hours",

            unitPrice: "Unit price",

          },

        },

        whatsappCalculator: {

          title: "WhatsApp Calculator",

          description:

            "Enter how many conversations you need per type to estimate the required credit.",

          fields: {

            subsidiary: "Billing subsidiary",

            destination: "Destination country",

            destinationPlaceholder: "Select a country",

            marketing: "Marketing conversations",

            utility: "Utility conversations",

            auth: "Auth conversations",

          },

          actions: {

            calculate: "Calculate",

            calculating: "Calculating...",

            reset: "Reset",

          },

          result: {

            label: "Required credit",

          },

          errors: {

            missingSubsidiary: "Choose a subsidiary before calculating.",

            missingCountry: "Select a destination country.",

          },

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

          oneShot: "One-shot",

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

      history: {

        title: "History",

        actions: {

          downloadCsvTitle: "Download filtered view CSV",

          downloadCsv: "CSV",

          refreshTitle: "Refresh",

          refresh: "Refresh",

        },

        quickRanges: {

          currentMonth: "Current month",

          previousMonth: "Previous month",

          currentWeek: "Current week",

          previousWeek: "Previous week",

        },

        filters: {

          team: {

            label: "Team",

            all: "All",

          },

          id: {

            label: "ID",

            placeholder: "Search by ID",

          },

          company: {

            label: "Company",

            placeholder: "Search company",

          },

          country: {

            label: "Country",

            all: "All",

          },

          email: {

            label: "Email",

            placeholder: "Search email",

          },

          clear: "Clear",

          from: "From",

          to: "To",

        },

        table: {

          headers: {

            id: "ID",

            company: "Company",

            country: "Country",

            email: "Email",

            monthly: "Monthly",

            created: "Created",

            status: "Status",

            actions: "Actions",

          },

          sortTooltip: "Sort",

          copyId: "Copy ID",

          emailFallback: "—",

          monthlyTitle: "Monthly",

          createdTitle: "Created at",

          statusBadges: {

            won: "Won",

            lost: "Lost",

            open: "Open",

          },

          wonTypeBadges: {

            newCustomer: "New customer",

            upsell: "Upsell",

          },

          statusLabels: {

            won: "Won",

            lost: "Lost",

            open: "Open",

          },

          actions: {

            reopenTooltip: "Revert to OPEN",

            reopen: "OPEN",

            markWonTooltip: "Mark as WON",

            markWon: "WON",

            open: "Open proposal",

            view: "View",

            copyLink: "Copy link",

            copy: "Copy",

            noLink: "—",

            deleteTooltip: "Delete (excluded from stats)",

            delete: "Delete",

          },

          empty: "No results for the selected filters.",

        },

        pagination: {

          display: "Showing {start}–{end} of {total}",

          perPage: "{count} / page",

          previous: "Previous",

          next: "Next",

          pageStatus: "{current} / {total}",

        },

        deleteModal: {

          title: "Delete proposal",

          cancel: "Cancel",

          confirm: "Delete",

          message: "This action removes the proposal from statistics. Continue?",

        },

        toast: {

          markWonError: "Could not mark as WON",

          markWonSuccess: "Marked as WON",

          markOpenError: "Could not revert to OPEN",

          markOpenSuccess: "Proposal reverted to OPEN",

          deleteError: "Could not delete proposal",

          deleteSuccess: "Proposal deleted",

        },

        wonTypeModal: {

          title: "Classify Won",

          description: "Choose whether this Won is a new customer or an upsell.",

          newCustomer: "New customer",

          upsell: "Upsell",

          cancel: "Cancel",

          confirm: "Confirm",

          saving: "Saving...",

        },

        csv: {

          fileName: "history.csv",

          headers: {

            id: "ID",

            company: "Company",

            country: "Country",

            email: "Email",

            monthly: "Monthly",

            created: "Created",

            status: "Status",

            url: "URL",

          },

        },

      },

      stats: {

        title: "Statistics",

        quickRanges: {

          quarterTooltip: "Apply quarter range",

          currentMonth: "Current month",

          previousMonth: "Previous month",

          currentWeek: "Current week",

          previousWeek: "Previous week",

        },

        filters: {

          from: "From",

          to: "To",

          team: {

            label: "Team",

            all: "All",

          },

          country: {

            label: "Country",

            all: "All",

          },

          user: {

            label: "User",

            all: "All",

          },

          orderBy: {

            label: "Order by",

            createdAt: "Created date",

            totalAmount: "Monthly amount",

          },

          direction: {

            label: "Direction",

            desc: "Descending",

            asc: "Ascending",

          },

          active: {

            title: "Active filters",

            none: "No filters applied",

            clear: "Remove filter",

          },

          summary: "Showing {filtered} of {total} proposals ({percent}%)",

        },

        actions: {

          reset: "Clear",

          exportFiltered: "Export",

          showAll: "Show all",

          showAllTitle: "Show all results",

          topN: "Top N",

          topNTitle: "Top N (aggregated)",

          csvButton: "CSV",

          csvTooltip: "Download full CSV",

        },

        toast: {

          loadError: "Could not load proposals",

          networkError: "Network error while loading proposals",

          reset: "Filters reset",

          csv: {

            sku: "Item CSV downloaded",

            country: "Country CSV downloaded",

            user: "User CSV downloaded",

            filtered: "Filtered proposals CSV downloaded",

          },

        },

        csv: {

          sku: {

            fileName: "stats_by_sku.csv",

            headers: {

              sku: "SKU",

              item: "Item",

              quantity: "Total quantity",

            },

          },

          country: {

            fileName: "stats_by_country.csv",

            headers: {

              country: "Country",

              quantity: "Quantity",

            },

          },

          user: {

            fileName: "stats_by_user.csv",

            headers: {

              user: "User (email)",

              proposals: "Proposals",

            },

          },

          filtered: {

            fileName: "filtered_proposals.csv",

            headers: {

              id: "ID",

              company: "Company",

              country: "Country",

              user: "User",

              monthly: "Monthly",

              hours: "Hours",

              oneShot: "One-shot",

              created: "Created",

              url: "URL",

            },

          },

        },

        kpis: {

          generated: "Proposals generated",

          uniqueUsers: "Unique users",

          uniqueCompanies: "Unique companies",

          totalMonthly: "Total monthly amount",

          averagePerProposal: "Average per proposal",

          wonCount: "WON proposals",

          wonAmount: "WON amount",

          winRate: "Win rate",

          wonAverageTicket: "Average WON ticket",

        },

        sections: {

          deepDive: "Deep dive",

          bySku: {

            title: "Top quoted items (by SKU)",

          },

          byCountry: {

            title: "Proposals by country",

          },

          byUser: {

            title: "Top users by proposal count",

          },

        },

        charts: {

          empty: "Not enough data for this visualization.",

          others: "Others",

          trend: {

            positive: "+{value}% vs. previous period",

            negative: "-{value}% vs. previous period",

            equal: "No change vs. previous period",

            unavailable: "Not enough history",

          },

          monthlyPerformance: {

            title: "Monthly momentum",

            description: "Track how many proposals you create and the monthly amount closed.",

            countLabel: "Proposals",

            amountLabel: "Monthly amount",

            latestLabel: "Last month with data: {label}",

          },

          statusDistribution: {

            title: "Proposal status mix",

            description: "See how the filtered pipeline is distributed.",

            totalLabel: "Filtered total: {total}",

            unknown: "No status",

          },

          countryLeaderboard: {

            title: "Most active countries",

            description: "Where proposals are being created the most.",

          },

          skuMomentum: {

            title: "Trending items",

            description: "SKUs with the highest number of quotes in the current filters.",

          },

        },

        table: {

          empty: "No data for the selected filters.",

          sku: {

            headers: {

              sku: "SKU",

              item: "Item",

              quantity: "Total quantity",

            },

          },

          country: {

            headers: {

              country: "Country",

              quantity: "Quantity",

            },

            footer: {

              showAll: "Showing all ({count})",

              total: "Total countries: {count}",

            },

          },

          user: {

            headers: {

              user: "User (email)",

              proposals: "Proposals",

            },

            fallback: "(no email)",

          },

        },

      },

    },

  };

export default messages;
