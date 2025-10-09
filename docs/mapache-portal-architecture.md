# Portal Mapache – Arquitectura 2025-10

Este documento describe la reorganización del Portal Mapache tras la refactorización de octubre de 2025.

## Capas principales

- **Server Components (Rutas `/mapache-portal/...`)**  
  Preparan los datos iniciales (configuración, metadatos, snapshots recientes) usando Prisma directamente. Delegan la lógica interactiva al cliente entregando `initialState`.

- **Client Shell (`MapachePortalShell`)**  
  Crea el contexto global (`MapachePortalProvider`) y registra los boundary components compartidos (modales, toasts, ready signal). Incluye solamente wiring y no lógica de negocio.

- **Estado compartido (`context/portal-context.tsx`)**  
  Implementa un store basado en React Context + React Query. Expone hooks derivados (`usePortalTasks`, `usePortalBoards`, `usePortalFilters`, `usePortalInsights`) que encapsulan las mutaciones contra la API.

- **Vistas (`components/views`)**  
  - `TasksView`: contiene filtros, grilla y formularios sobre tareas. Usa hooks de contexto y componentes reutilizables como `TaskDataGrid`.
  - `BoardView`: renderiza tableros con drag&drop y gestiona columnas. Toda la lógica de pipelines vive en `hooks/useBoardPipeline`.
  - `MetricsView`: muestra insights agregados y consume snapshots persistidos.

- **Modales y paneles (`components/modals`)**  
  Cada modal (configuración, edición de tarea, confirmaciones) es un componente autocontenido que recibe el slice de estado que necesita vía hooks. Controlan accesibilidad (foco, `aria-*`) y traducciones.

- **Servicios (`lib/mapache-portal/`)**  
  Contiene funciones puras para mapear payloads, construir queries Prisma y transformar snapshots. Se reutilizan en API routes y en el bootstrap server component.

## Flujo de datos

1. Las páginas servidoras (`tasks/page.tsx`, `metrics/page.tsx`) solicitan `loadMapachePortalBootstrap`, que ahora solo trae metadatos (estados, presets, tableros, usuarios) y el último snapshot.
2. En el cliente, `MapachePortalProvider` inicializa React Query con `initialQueries` para tareas y métricas. Los filtros del usuario hidratan estado desde `localStorage` y sincronizan la query string (hook `useUrlFiltersSync`).
3. Cambios en filtros → `usePortalTasks` invoca `invalidateTasks` que vuelve a disparar `fetchTasks` contra `/api/mapache/tasks` usando parámetros normalizados.
4. Acciones de tablero/estado → hooks especializados llaman a rutas como `/api/mapache/boards` y actualizan optimistamente la cache de React Query.
5. Insights → `usePortalInsights` combina los cálculos en memoria con snapshots persistidos (`/api/mapache/insights/snapshots`), permitiendo comparativas temporales.

## React Query

- Configuración base en `context/query-client.ts`.
- Tareas paginadas con `useInfiniteQuery`.
- Prefetch inicial proveniente del server component para evitar flashes.
- Revalidación automática cada 60 s (configurable).

## I18n y accesibilidad

- Todas las cadenas pasan por `useTranslations` con claves nuevas agregadas en `messages.ts`.
- Elementos interactivos drag&drop y tablas incluyen roles `aria`, focus management y shortcuts de teclado.
- Toasters utilizan `aria-live="assertive"` y los modales controlan el ciclo de foco (`returnFocus` en `Modal`).

## Persistencia de insights

- Los snapshots semanales viven en `MapacheInsightsSnapshot`.
- Servicio `captureInsightsSnapshot` guarda/agrega el registro (respetando `SNAPSHOT_LIMIT`) y se usa desde el cron job y desde el endpoint `/api/mapache/insights/snapshots`.
- El cliente puede guardar snapshots manualmente para “marcar” un estado del pipeline.

## Testing

- Tests unitarios en `tests/unit/mapache-portal/*.test.ts` cubren helpers de filtros, snapshots y normalizadores de tablero.
- Tests E2E en `tests/e2e/mapache-portal/*.test.ts` validan flujo de filtros, paginación y drag&drop (con Playwright headless).

