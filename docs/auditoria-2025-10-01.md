# Auditoría Integral — 2025-10-01

## Resumen de arquitectura y dependencias clave
- Aplicación **Next.js 15** usando App Router. `src/app/layout.tsx` envuelve toda la app en `SessionProviderWrapper` (Client Component) y `Navbar`, forzando hidratación global.  
- `src/app/page.tsx` es Client Component (`"use client"`), controla el flujo de sesión con `useSession` y delega la UI principal a `features/proposals`.  
- Autenticación via **NextAuth** con estrategia JWT y adaptador Prisma sobre PostgreSQL. El proveedor de Google habilita scopes amplios y `allowDangerousEmailAccountLinking`.  
- Persistencia con **Prisma** (`prisma/schema.prisma`), centrada en propuestas, ítems y objetivos trimestrales, sin índices adicionales fuera de claves primarias.  
- UI compuesta por componentes cliente bajo `src/app/components` y `src/features`. Componentes grandes (`Navbar`, `ProposalsIndex`) concentran lógica de estado, acceso a API y renderización condicional.  
- Dependencias clave: `next`, `react`, `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `googleapis`, `zod`, `tailwindcss`, `lucide-react`.  
- Tooling: ESLint (flat config), TypeScript con `strict: true` pero `skipLibCheck: true`, sin suites de prueba configuradas.  
- Infraestructura DevOps: sin workflows en `.github/workflows`, sin scripts de build analyzer ni documentación de entornos.  

## Checklist de hallazgos

### Rendimiento
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica base / objetivo |
|----|----------|---------|----------|--------|------------------------|-------------------------|
| R1 | `src/app/page.tsx` es Client Component y bloquea Server Components; toda la carga inicial requiere hidratación completa. | Alta | Media | Media | Crear variante bajo flag `NEXT_PUBLIC_FEATURE_RSC_ENTRY` para renderizado server y comparar con Lighthouse. | `next build --analyze`: medir KB cliente; objetivo: -30 % en bundle inicial. |
| R2 | `Navbar` y `History` obtienen todo el listado de propuestas/items desde el cliente, sin caché ni paginación, repitiendo fetch pesados. | Alta | Media | Media | Instrumentar `next dev` con `NEXT_PUBLIC_FEATURE_PROPOSALS_PAGINATION` y medir tamaño de payload vía `curl`. | Tamaño actual de `/api/proposals`; objetivo: -70 % por interacción. |
| R3 | `/api/proposals` devuelve dataset completo con `include` de subcolecciones, sin filtros ni límites. | Alta | Media | Alta | Implementar endpoint paginado + `cache-control` bajo feature flag y medir `EXPLAIN ANALYZE` con page size 50. | Tiempo p95 actual (baseline manual); objetivo: <500 ms. |
| R4 | No existe script de analyzer ni reporte en `docs/perf/`. | Media | Baja | Baja | Añadir script `npm run build:analyze` que genere reporte HTML y documentar pasos. | Reporte generado cada release. |

### Estructura / Arquitectura
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| A1 | `SessionProviderWrapper` en layout global impide aprovechar RSC granulares. | Alta | Media | Media | Introducir layout alternativo tras flag `FEATURE_SESSION_SPLIT` y validar rutas críticas. | Reducir componentes cliente iniciales >25 %. |
| A2 | `features/proposals/index.tsx` mezcla control de sesión, tabs, filtros y renderizado extenso. | Media | Media | Media | Refactor a contenedor server + tabs con `next/dynamic` y tests de interacción. | Archivo principal <200 líneas y props tipadas explícitas. |
| A3 | `Navbar` combina navegación, perfil, modal y métricas sin separación por responsabilidades. | Media | Alta | Media | Dividir en slices (`NavigationTabs`, `UserMenu`, `GoalModal`) con contratos testables. | Complejidad ciclomática <10 por componente. |
| A4 | Falta ADR que documente decisiones de arquitectura (por ejemplo, por qué usar Client Components globales). | Media | Baja | Baja | Redactar ADR en `docs/adr/` y referenciar cambios. | ADR actualizado por refactor. |

### Seguridad
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| S1 | Rutas `/api/proposals`, `/api/items`, `/api/admin/users` carecen de autenticación/autorización y aceptan llamadas anónimas. | Crítica | Media | Alta | Añadir middleware server-side con verificación de sesión/rol tras flag `FEATURE_SECURE_API`. Tests e2e de acceso 401/403. | 100 % rutas protegidas, 0 respuestas 200 sin sesión. |
| S2 | GoogleProvider usa `allowDangerousEmailAccountLinking`, permitiendo secuestro de cuentas si un atacante verifica email existente. | Crítica | Baja | Media | Desactivar opción tras flag `FEATURE_SAFE_ACCOUNT_LINKING`. Ejecutar smoke test login. | Tasa de fallos login <1 %. |
| S3 | No hay validación (`zod`) de payloads en POST/PUT; posible DoS o datos inconsistentes. | Alta | Media | Media | Definir esquemas compartidos y tests de contrato con Vitest. | >10 casos negativos cubiertos. |
| S4 | No existe documentación ni restricciones sobre dominios autorizados (`NEXTAUTH_URL`, `AUTH_URL`). | Media | Baja | Baja | Documentar en `docs/ENV.md` y validar configuración al inicio. | Checklist de despliegue actualizado. |

### Accesibilidad / SEO
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| X1 | Metadatos globales carecen de descripción, OG/Twitter y canonical. | Media | Baja | Baja | Enriquecer metadata bajo flag `FEATURE_IMPROVED_META` y auditar con Lighthouse. | Lighthouse SEO ≥90. |
| X2 | Estados de carga retornan `null` (pantalla en blanco) sin `aria` ni feedback para lectores de pantalla. | Media | Baja | Baja | Implementar skeleton accesible (`role="status"`) tras flag `NEXT_PUBLIC_FEATURE_LOADING_UI`. | Axe: 0 issues de estado. |
| X3 | Modal de perfil no asegura focus trap ni `aria` consistentes. | Media | Media | Media | Revisar `Modal` y añadir pruebas Playwright + axe. | Navegación teclado sin fugas de foco. |

### Base de datos
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| B1 | Falta índice en `Proposal.userId`, usado frecuentemente en joins/filtros. | Media | Baja | Baja | Crear migración no destructiva + rollback documentado. | `EXPLAIN` muestra uso del índice, coste <5 ms. |
| B2 | Consultas Prisma usan `include` completo, elevando I/O y memoria. | Alta | Media | Media | Ajustar selects mínimos y paginación. | Tiempo medio consulta -50 %. |
| B3 | No hay estrategia de seeds/rollback descrita para migraciones. | Media | Media | Media | Documentar proceso y scripts. | Documento de migraciones 100 % actualizado. |

### Testing / CI
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| T1 | `package.json` carece de dependencias/scripts de testing (unit/e2e). | Alta | Media | Media | Introducir Vitest + Playwright gradualmente con feature flags. | Cobertura mínima 40 % módulo proposals. |
| T2 | No existe pipeline CI (`.github/workflows`). | Alta | Baja | Baja | Crear workflow `ci.yml` con lint, typecheck, build, smoke tests. | Pipeline <10 min, status check obligatorio. |
| T3 | Falta automatización de lint en commits/PRs. | Media | Baja | Baja | Configurar husky/lint-staged o reforzar en CI. | 100 % PRs ejecutan lint. |

### DX
| ID | Hallazgo | Impacto | Esfuerzo | Riesgo | Verificación propuesta | Métrica |
|----|----------|---------|----------|--------|------------------------|---------|
| D1 | No hay `docs/ENV.md` ni validación de variables de entorno. | Media | Baja | Baja | Documentar variables, añadir validación runtime con `zod`. | Onboarding <30 min. |
| D2 | `skipLibCheck` habilitado; errores externos pasan inadvertidos. | Media | Media | Media | Habilitar `skipLibCheck: false` tras corregir tipos críticos. | TypeScript `--noEmit` sin errores. |
| D3 | Carece de scripts para generar reportes de performance (`docs/perf/`). | Media | Baja | Baja | Añadir script analyzer + documentación. | Reporte actualizado post-release. |

## Tabla de acciones priorizadas
| Prioridad | Acción | Categoría | Impacto | Esfuerzo | Riesgo | Notas |
|-----------|--------|-----------|---------|----------|--------|-------|
| P1 | Blindar endpoints (`/api/*`) con middleware de sesión/rol y validaciones zod (feature flag). | Seguridad / Rendimiento | Crítica | Media | Alta | Coordinar con front; añadir pruebas e2e. |
| P1 | Paginar y cachear `/api/proposals` + refactor consumo en `History`/`Navbar`; generar reporte `docs/perf/`. | Rendimiento / Base de datos | Alta | Media | Media | Desplegar tras mediciones comparativas. |
| P1 | Configurar pipeline CI (`lint`, `typecheck`, `build`, smoke tests) en `.github/workflows/ci.yml`. | Testing / DX | Alta | Baja | Baja | Base para futuros PRs. |
| P2 | Refactor `SessionProvider` y `ProposalsIndex` en arquitectura híbrida RSC/Client (feature flags). | Arquitectura | Media | Alta | Media | Documentar en ADR. |
| P2 | Documentar entornos y validar config (`docs/ENV.md`, validación runtime). | DX / Seguridad | Media | Baja | Baja | Prerrequisito para despliegues. |
| P2 | Añadir índice `Proposal.userId` + plan de rollback. | Base de datos | Media | Baja | Baja | Migración no destructiva. |
| P3 | Mejorar metadatos SEO y estados de carga accesibles. | Accesibilidad / SEO | Media | Baja | Baja | Depende de refactor UI. |
| P3 | Endurecer TypeScript (`skipLibCheck: false`) tras cubrir tests. | DX / Calidad | Media | Media | Media | Realizar cuando CI estable. |

## Plan de acción por etapas
1. **Etapa 0 — Preparación (P1)**  
   - Crear pipeline CI (`chore/ci-pipeline`).  
   - Documentar variables actuales y revisar entorno (`docs/env-hardening`).  
   - Agregar script de analyzer y directorio `docs/perf/`.  

2. **Etapa 1 — Seguridad y performance crítica (P1)**  
   - PR `feat/security-guards`: middleware, validación, feature flags, pruebas.  
   - PR `feat/perf-proposals-pagination`: paginación, caching, reducción payload, reporte comparativo.  

3. **Etapa 2 — Arquitectura y DX (P2)**  
   - PR `refactor/app-session-split`: aislar `SessionProvider`, introducir RSC.  
   - PR `chore/db-index-proposal-user`: índice y ADR.  
   - PR `test/smoke-auth`: seeds y pruebas e2e básicas.  

4. **Etapa 3 — Accesibilidad y calidad continua (P3)**  
   - PR `feat/accessibility-feedback`: skeletons, focus trap, metadatos SEO.  
   - PR `chore/ts-strict-pass`: desactivar `skipLibCheck` y corregir tipados.  

## Propuesta de PRs
| PR | Alcance | Riesgo | Tiempo estimado |
|----|---------|--------|-----------------|
| feat/security-guards | Middleware de auth, validación zod, feature flags, pruebas e2e de acceso. | Medio-Alto | 1.5 días |
| feat/perf-proposals-pagination | Paginación server, cache tags, refactor `History`/`Navbar`, métricas en `docs/perf/`. | Medio | 2 días |
| refactor/app-session-split | RSC para entrada, split de sesión, modularización de proposals. | Medio | 2 días |
| chore/ci-pipeline | Workflow CI (lint, typecheck, build, smoke). | Bajo | 0.5 días |
| docs/env-hardening | Documentación env + validación runtime. | Bajo | 0.5 días |
| test/smoke-auth | Playwright/Vitest, seeds de prueba. | Medio | 1.5 días |
| feat/accessibility-feedback | Skeletons accesibles, focus trap, metadatos SEO. | Bajo | 1 día |
| chore/db-index-proposal-user | Índice Prisma + ADR + plan rollback. | Bajo | 0.5 días |

## Seguimiento de implementación

- ✅ `refactor/app-session-split`: layout híbrido con `FEATURE_APP_SHELL_RSC`, `ClientSessionBoundary`, navbar modular y ADR `docs/adr/2025-10-01-app-shell.md`.
- ✅ `feat/accessibility-feedback`: skeleton accesible detrás de flag y `Modal` con focus trap/cierre vía `Escape`.
- ✅ `chore/db-index-proposal-user`: migración `20251001123000_add_proposal_user_idx` y rollback documentado en `docs/adr/2025-10-01-db-index.md`.
- ✅ `docs/env-hardening`: ampliación de `docs/ENV.md` con flags adicionales y dominios autorizados para OAuth.
- ✅ `docs/perf`: carpeta dedicada con baseline `docs/perf/2025-10-01-base.md` y guía `docs/perf/README.md`.
