# Overview

This Next.js 15 application, using the App Router, is an internal platform for Wise CX to create, track, and manage commercial sales proposals. It features Google Workspace integration for document generation, specialized portals for different teams (Direct, Mapache, Partner, Marketing), and role-based access control. The system integrates with Google Docs/Drive, Pipedrive for CRM synchronization, and uses NextAuth with Google OAuth for authentication, supporting multiple locales (Spanish and English).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: Next.js 15.5.1 (App Router, React 19.1.0) leveraging Server Components and Client Components, with feature flags for progressive enhancement.

**State Management**: React Query for server state, React Context for application-level state, and NextAuth for session management.

**UI Components**: Custom component library with Tailwind CSS, including a purple brand theme. Uses specialized components from cmdk, react-table, and react-virtual.

**Routing Strategy**: Locale-aware routing (`/es`, `/en`) and specific portal routes (`/mapache-portal`).

## Backend Architecture

**API Routes**: Next.js API routes (`/src/app/api/`) following RESTful conventions for proposals, items, admin, and CRM integration.

**Authentication Guards**: Centralized logic (`/src/app/api/_utils/require-auth.ts`) with feature flag support (`FEATURE_SECURE_API_ROUTES`).

**Business Logic**: Separated modules for Google Workspace integration, OAuth, Pipedrive CRM, and portal-specific logic.

**Feature Flags**: Comprehensive flag system (`/src/lib/feature-flags.ts`) for safe architectural rollout.

**Internationalization**: Custom i18n with server-side message loading, client-side context, and JSON message files.

## Data Layer

**ORM**: Prisma 6.18.0 for type-safe database access (PostgreSQL).

**Key Models**: `User`, `Proposal`, `Item`, `MapacheTask`, `MapacheBoard`.

**Relationships**: Proposals contain items and belong to users; tasks have statuses; users have portal and team memberships.

**Indexing**: `Proposal.userId` is indexed for optimized queries.

## Authentication & Authorization

**Provider**: NextAuth v4 with Google OAuth.

**Session Strategy**: JWT-based sessions with server-side verification.

**Role System**: Three-tier hierarchy (`admin`, `lider`, `usuario`) mapped from Prisma `Role` enum.

**Portal Access**: Dynamic assignment via `PortalAccess` records or fallback logic.

**Security**: Feature flags for strict OAuth linking and API route security. Scopes include Google Drive and Docs.

# External Dependencies

## Third-Party Services

**Google Workspace APIs**: OAuth, Docs API (document creation), Drive API (file permissions), Sheets API (cost data).

**Pipedrive CRM**: API integration for syncing won deals and proposal URLs.

**Vercel Analytics**: Production usage tracking.

## Database

**PostgreSQL**: Primary data store, accessed via Prisma ORM.

## UI Component Libraries

**Atlaskit Pragmatic Drag and Drop**: Drag-and-drop interactions.

**Floating UI**: Tooltip and popover positioning.

**Lucide React**: Icon library.

**TanStack Libraries**: React Query, React Table, React Virtual.

## Development Tools

**TypeScript**: Strict mode with path aliases.

**ESLint**: Flat config with Next.js rules.

**Testing**: Node.js native test runner, Testing Library for unit, integration, and e2e tests.

**Build Tooling**: Turbopack (dev), Bundle Analyzer, PostCSS with Tailwind CSS.

## Deployment

**Platform**: Vercel.

**Environment Variables**: Configured via `DATABASE_URL`, OAuth credentials, and NextAuth settings.

# Recent Changes

## UI/UX Complete Restructure (November 15, 2025)

Comprehensive restructure of key management and configuration interfaces, moving beyond visual updates to fundamental layout reorganization:

**Home Page (`/home`)**:
- Replaced large hero section with compact inline header
- Implemented 4-column grid layout (lg:grid-cols-4) for portal cards
- Reduced card size and padding (p-5 instead of p-8)
- Minimized icon sizes (h-5 w-5) for better proportion
- Created more professional, dashboard-like appearance

**Configurations Landing (`/configuraciones`)**:
- Eliminated centered large gradient headers
- Implemented compact horizontal cards with inline icons and stats
- Reduced spacing and shadows for cleaner look
- Created professional dashboard aesthetic

**Team Management (`/configuraciones/team-management`)**:
- **Eliminated sidebar panel** (previous lg:grid-cols-3 layout)
- Moved team creation to modal dialog instead of sidebar form
- Made table full-width and primary interface element
- Simplified header with compact team counter
- Improved visual hierarchy and space utilization

**User Management (`/configuraciones/user-management`)**:
- **Eliminated 3-filter grid** (previous md:grid-cols-3 layout)
- Condensed all filters (search, role, team, count) into single compact horizontal row
- Reduced table padding (px-4 py-3 instead of px-6 py-4)
- Smaller avatars (h-9 w-9) and text sizes for better density
- Improved vertical space usage significantly
- All filtering functionality preserved and verified working

**Design Philosophy**:
- Modern purple-themed gradients maintained
- Compact, professional layouts prioritized
- Minimalist approach without "enormous" elements
- Better space utilization throughout
- All existing functionality preserved (zero regressions)

### Further Refinements (Same Session)

**Header Simplification**:
- Removed breadcrumb navigation ("Configuraciones / Gestión de...")
- Eliminated descriptive subtitles in Team and User Management pages
- Now shows only clean, simple page titles (h1 text-xl)

**Modal Components Redesign**:
- Updated `Modal.tsx` to use slate colors instead of gray throughout
- Updated `ConfirmDialog.tsx` for consistent slate palette
- Changed portal access button from bg-slate-900 to bg-purple-600 for theme consistency
- Simplified all modal titles (removed redundant font styling)

**Translation Namespace Fix**:
- Corrected portal name translations from `admin.users.portals` to `navbar.portalSwitcher.options`
- Fixed "Portal Directo" displaying as "admin.users.portals.direct" in tables
- All portal names now render correctly with proper labels and icons

**Visual Consistency**:
- Complete shift from gray/black accents to purple/slate theme
- Unified color palette across all modals and dialogs
- Improved professional appearance while maintaining accessibility