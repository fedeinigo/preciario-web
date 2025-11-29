# Overview

This Next.js 15 application is an internal platform for Wise CX, designed to create, track, and manage commercial sales proposals. It integrates with Google Workspace for document generation, features specialized portals for various teams (Direct, Mapache, Partner, Marketing), and implements role-based access control. The system also connects with Google Docs/Drive, Pipedrive for CRM synchronization, and uses NextAuth with Google OAuth for authentication, supporting multiple locales (Spanish and English).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 15.5.1 (App Router, React 19.1.0) utilizing Server and Client Components with feature flags.
**State Management**: React Query for server state, React Context for application state, and NextAuth for session management.
**UI Components**: Custom component library with Tailwind CSS (purple brand theme), cmdk, react-table, and react-virtual.
**Routing Strategy**: Locale-aware routing (`/es`, `/en`) and portal-specific routes (`/mapache-portal`).

## Backend Architecture

**API Routes**: Next.js API routes (`/src/app/api/`) following RESTful conventions for proposals, items, admin, and CRM integration.
**Authentication Guards**: Centralized logic (`/src/app/api/_utils/require-auth.ts`) with feature flag support.
**Business Logic**: Separated modules for Google Workspace, OAuth, Pipedrive CRM, and portal-specific logic.
**Feature Flags**: Comprehensive flag system (`/src/lib/feature-flags.ts`) for progressive architectural rollout.
**Internationalization**: Custom i18n with server-side message loading, client-side context, and JSON message files.

## Data Layer

**ORM**: Prisma 6.18.0 for type-safe PostgreSQL database access.
**Key Models**: `User`, `Proposal`, `Item`, `MapacheTask`, `MapacheBoard`.
**Relationships**: Proposals contain items and belong to users; tasks have statuses; users have portal and team memberships.
**Indexing**: `Proposal.userId` is indexed for optimized queries.

## Authentication & Authorization

**Provider**: NextAuth v4 with Google OAuth.
**Session Strategy**: JWT-based sessions with server-side verification.
**Role System**: Three-tier hierarchy (`admin`, `lider`, `usuario`) mapped from Prisma `Role` enum.
**Portal Access**: Dynamic assignment via `PortalAccess` records or fallback logic.
**Security**: Feature flags for strict OAuth linking and API route security, with Google Drive and Docs scopes.
**Goals Permissions**: All users can add manual Won deals for themselves. Admin/leaders can additionally manage Won deals for their team members. Backend enforces authorization via `canManageTarget` function.

## UI/UX Decisions

The application features a modern purple-themed design with gradients. Recent updates have focused on creating compact, professional, and minimalist layouts, improving space utilization, and unifying modal themes. Key interfaces like the Home Page, Configuration, Team Management, and User Management have been restructured for better visual hierarchy and density. 

The statistics dashboard has been completely redesigned with a three-tier visual layout, glassmorphism elements, enhanced KPI cards with sparklines, and interactive drill-down capabilities.

The Generator page (`/portal/directo/generator`) has been visually modernized with the same purple/slate glassmorphism design system while preserving all existing functionality. Updates include:
- **Container**: Gradient background (`from-purple-50 via-white to-slate-50`)
- **Cards**: Glassmorphism styling (`rounded-2xl`, `bg-white/90`, `backdrop-blur-sm`, `shadow-lg`)
- **Headers**: Purple gradients (`from-purple-600 to-purple-800`) for main components, green for WhatsApp, slate for sidebars
- **Inputs**: Modern rounded borders with purple focus rings (`focus:ring-purple-400/20`)
- **Buttons**: Gradient-styled with proper visual hierarchy (purple primary, white secondary, red destructive)
- **Sidebars**: Modernized with Lucide chevron icons for collapse toggles
- **Modals**: Updated with purple/red gradient buttons and improved spacing

### Portal Theme Token System (Nov 2025)

**Architecture**: Implemented a scalable, portal-scoped design token system in `src/styles/portal-tokens.css` to resolve theming conflicts where global CSS rules were forcing dark text on dark backgrounds in modals.

**Token Categories**:
- `--surface-*`: Background colors (bg, primary, secondary, modal, navbar)
- `--text-*`: Text colors (primary, secondary, muted, inverse, link, label)
- `--border-*`: Border colors (primary, secondary, modal, focus)
- `--modal-*`: Modal-specific tokens (backdrop, text, border, header-bg, surface)
- `--shadow-*`: Shadow definitions (sm, md, lg, modal)
- `--brand-*`: Brand colors (primary, secondary, accent)

**Portal Scopes**:
- `[data-portal="directo"]`: Purple/violet light theme (default)
- `[data-portal="mapache"]`: Dark glassmorphism with cyan/violet accents
- `[data-portal="marketing"]`: Blue professional light theme
- `[data-portal="partner"]`: Neutral slate light theme

**Theme Activation**:
- `PortalThemeProvider` component (`src/app/components/theme/PortalThemeProvider.tsx`) sets `data-portal` attribute on `<html>`
- All portal layouts import and wrap content with `PortalThemeProvider`
- Modal component detects current portal and applies corresponding tokens via `data-portal-modal` attribute

**Modal Styling**:
- `Modal.tsx` uses CSS tokens via inline styles for maximum specificity
- All modal tokens use ready-to-use CSS values (e.g., `--modal-text: #111827`) for direct consumption via `var(--token-name)` without rgb() wrappers
- Dark portals (Mapache) get glassmorphism backgrounds with white text
- Light portals get clean white backgrounds with dark text
- Automatic color inheritance via `[data-portal-modal]` CSS selectors

**Token Value Format**:
- Modal tokens: Complete CSS values (hex colors, rgba, gradients) for direct use in `style={{}}` props
- Surface/text/border tokens: RGB triplets for Tailwind compatibility via `rgb(var(--token))`
- Shadow/backdrop tokens: Complete CSS values

**Files Modified**:
- `src/styles/portal-tokens.css`: Token definitions for all 4 portals
- `src/app/globals.css`: Import order fixed, redundant !important rules removed
- `src/app/components/ui/Modal.tsx`: Token-driven styling
- Portal layouts: `direct-portal`, `mapache-portal`, `marketing-portal`, `partner-portal`

### Mapache Portal UI Components (Nov 2025)

**Reusable Components** (`src/app/mapache-portal/components/ui/`):
- `MapacheInput.tsx`: Token-based text input with label and error support
- `MapacheSelect.tsx`: Token-based select dropdown with label and error support
- `MapacheTextarea.tsx`: Token-based textarea with label and error support
- `MapacheButton.tsx`: Token-based button with variants (primary, secondary, ghost, accent, danger)
- `index.ts`: Barrel export for all Mapache UI components

**Styling Approach**:
- All components use inline `style` props with CSS custom properties
- Fallback values ensure graceful degradation: `var(--mapache-glass-border, rgba(255,255,255,0.2))`
- Labels use `rgb(var(--text-label))` for consistent cyan accent
- Error states use `rgb(var(--status-error))` for red feedback

**Chart Tokens** (added to `portal-tokens.css` for Mapache portal):
- `--chart-grid-*`: Grid line and gradient colors
- `--chart-axis-text`: Axis label colors
- `--chart-label-text`: Data label colors
- `--chart-text-primary/muted`: Text hierarchy in charts
- `--chart-tooltip-*`: Tooltip background and text colors
- `--chart-point-stroke`: Circle stroke color for area charts

**Analytics Components Updated** (`src/app/mapache-portal/components/analytics/`):
- `ChartCard.tsx`: Uses glass panel tokens for container
- `ChartSkeleton.tsx`: Uses glass background token
- `DonutChart.tsx`: Uses chart tokens for text and tooltips
- `StackedBarChart.tsx`: Uses chart tokens for grid, axis, labels, and tooltips
- `AreaTrendChart.tsx`: Uses chart tokens for grid, axis, labels, points, and tooltips

**MapachePortalClient.tsx Refactoring**:
- Added `mapacheInputStyles` object with token-based colors
- Migrated 47 inputs and 7 textareas to use shared class constants
- Style constants now reference CSS custom properties instead of hardcoded colors

### Goals Page Consolidation (Nov 2025)

**Component Consolidation**:
- Removed `TeamRankingCard` component (deleted `src/app/components/features/goals/components/TeamRankingCard.tsx`)
- Unified team display into `TeamMembersTable` component with ranking functionality

**Layout Changes**:
- `TeamMembersTable` now appears in the Secondary Cards Grid alongside `BillingSummaryCard`
- Removed the separate full-width table section at the bottom of the page
- Added scrollable container with `max-h-[600px]` for the table
- Theme-aware empty state styling for both Mapache and Direct portals

**Sorting Behavior**:
- Default sort changed from "user" (ascending) to "pct" (% cumplimiento, descending)
- Maintains ranking order by default, matching the previous TeamRankingCard behavior
- All filter and sort options remain available (user, goal, progress, % cumpl.)

**Files Modified**:
- `src/app/components/features/goals/GoalsPage.tsx`: Removed TeamRankingCard, integrated table into secondary grid
- `src/app/components/features/goals/components/TeamMembersTable.tsx`: Changed default sort to pct descending

**Compact Table Styling (Nov 2025)**:
- Action buttons converted from text to icon-only with tooltips (Eye, UserCircle, Pencil, PlusCircle icons)
- Removed scroll container (`max-h-[600px] overflow-y-auto`) for natural content flow
- Reduced spacing: row padding (p-4→p-3), gaps (lg:gap-6→lg:gap-4), column min-widths
- Avatar size reduced (56→44px) with thinner ring (ring-4→ring-2)
- Text sizes reduced: names (text-base→text-sm), values (text-lg→text-base)
- % badge compacted: smaller padding, text-2xl→text-xl
- Icon button classes: `iconBtnClass` for primary, `secondaryIconBtnClass` for secondary actions

### UserProfileModal Race Condition Fix (Nov 2025)

**Problem**: When quickly switching between user profiles in the modal, stale API responses from the previous user could overwrite the current user's metrics, showing incorrect goal/progress data.

**Solution Architecture**:
- Added `activeTargetKeyRef` to track the current target user
- Added `targetKey` tracking with `prevTargetKeyRef` to detect user changes
- State reset on user change: `goalAmount` and `wonAmount` reset to 0 immediately
- Loading state with visual feedback: spinner, placeholder text, animate-pulse

**Race Condition Protection**:
- `loadGoal` and `loadProgress` capture `requestTargetKey` at request start
- Before updating state, verify `activeTargetKeyRef.current === requestTargetKey`
- Late responses from previous users are silently ignored
- Only responses matching the current target update the UI

**Loading Indicators**:
- Header shows loading spinner when `loadingData` is true
- Percentage badge shows "--%" placeholder
- Progress bar shows "Cargando..." text
- All metric values show "--" with animate-pulse
- Progress bar starts at 0% width during loading

**Files Modified**:
- `src/app/components/ui/UserProfileModal.tsx`: Race condition guards, loading states

### Goals Progress Snapshot System (Nov 2025)

**Purpose**: Persist synced Pipedrive progress data to the database so users can view their goal/progress metrics from any location in the app, not just the Goals page.

**Database Model**:
- `GoalsProgressSnapshot`: Stores userId, year, quarter, goalAmount, progressAmount, pct, dealsCount, lastSyncedAt
- Unique constraint on (userId, year, quarter) for upsert operations

**Data Flow**:
1. GoalsPage syncs with Pipedrive API
2. After sync, GoalsPage POSTs batch snapshots to `/api/goals/snapshot`
3. UserProfileModal reads from: localStorage cache → DB snapshot → legacy API endpoints
4. Event-based sync: Modal dispatches `goals:request-sync`, GoalsPage listens and triggers sync

**Cache Strategy**:
- Team data cached in localStorage: `goals:pipedrive:team:${team}:${year}:Q${quarter}`
- Personal data cached: `goals:pipedrive:${email}:${year}:Q${quarter}`
- Modal tries team cache first (by user ID/email match), then falls back to DB snapshot

**API Endpoint** (`/api/goals/snapshot`):
- GET: Fetch single user's snapshot by userId, year, quarter
- POST: Batch upsert snapshots for multiple users (used after team sync)

**Files Added/Modified**:
- `prisma/schema.prisma`: Added GoalsProgressSnapshot model
- `src/app/api/goals/snapshot/route.ts`: GET/POST handlers
- `src/app/components/features/goals/GoalsPage.tsx`: Snapshot persistence after sync
- `src/app/components/ui/UserProfileModal.tsx`: Multi-tier data loading, sync button, lastSyncedAt display

# External Dependencies

## Third-Party Services

**Google Workspace APIs**: OAuth, Docs API (document creation), Drive API (file permissions), Sheets API (cost data).
**Pipedrive CRM**: API integration for syncing won deals and proposal URLs.
**Vercel Analytics**: Production usage tracking.
**Vercel Speed Insights**: Real User Monitoring (RUM) for performance metrics in production.

## Database

**PostgreSQL**: Primary data store, accessed via Prisma ORM.

## UI Component Libraries

**Atlaskit Pragmatic Drag and Drop**: Drag-and-drop interactions.
**Floating UI**: Tooltip and popover positioning.
**Lucide React**: Icon library.
**TanStack Libraries**: React Query, React Table, React Virtual.