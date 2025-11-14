# Overview

This is a Next.js 15 application using the App Router for managing commercial proposals at Wise CX. The application provides an internal platform for creating, tracking, and managing sales proposals with Google Workspace integration for document generation. It includes specialized portals for different teams (Direct, Mapache, Partner, Marketing) with role-based access control.

The system integrates with Google Docs/Drive for proposal document generation, Pipedrive for CRM synchronization, and uses NextAuth with Google OAuth for authentication. The application supports multiple locales (Spanish and English) and includes comprehensive testing infrastructure.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## Goals Page UX Improvements (November 2025)

### Phase 1: UX Enhancements (Completed)

Implemented 5 major UX enhancements for `/portal/directo/goals`:

1. **Skeleton Loaders**: Added `CardSkeleton` component used in `GoalsPage` to display loading states for `IndividualGoalCard` and `TeamGoalCard`, eliminating zero-data flash and improving perceived performance.

2. **Professional Billing Editor**: Created `BillingEditorModal` component to replace legacy `window.prompt()` with a modern modal that includes:
   - Input validation for billing amounts
   - Preview of billed vs. pending amounts
   - Professional purple-themed design matching the brand
   - Proper form controls and error handling

3. **Explanatory Tooltips**: Added `Tooltip` component with explanatory content for KPI metrics in the header (Delta, Progress, etc.) to help users understand what each metric represents.

4. **Filters and Search**: Enhanced `TeamMembersTable` with:
   - Real-time search by name or email
   - Status filter (All / Above objective / Below objective)
   - Performant filtering using `React.useMemo`
   - Modern purple-themed filter UI with icons

5. **Deal Drill-down Modal**: Created `DealDetailsModal` that opens when clicking on a deal in `BillingSummaryCard`, showing:
   - Complete deal information (ID, URL, title, amounts)
   - Billed vs. pending breakdown
   - Creation and update timestamps
   - Proper event handling with `stopPropagation` to prevent conflicts with inline controls

### Phase 2: Team Members Table Redesign (Completed)

Completely redesigned `TeamMembersTable` from traditional table to modern **Hybrid Table-Card** layout:

**Visual Improvements**:
- Each team member now displayed in a beautiful mini-card with rounded-3xl borders
- Large avatar (16x16) with performance-based gradient colors:
  - Purple gradient: ≥100% (exceeding goal)
  - Blue gradient: ≥75% (on track)
  - Amber gradient: ≥50% (needs attention)
  - Grey gradient: <50% (behind)
- Performance badge prominently showing completion percentage
- Decorative progress background fill that visually shows completion
- Generous spacing and professional shadows with elegant hover effects

**Layout Changes**:
- Replaced table header with modern pill-style sort buttons with icons
- Metrics displayed in 2-column grid (Objetivo and Avance)
- Visual progress bar with gradient and smooth animations
- Enhanced search with larger input and better focus states
- Filter dropdown with emoji indicators

**Preserved Functionality**:
- All existing actions (Profile, Edit, Manual Billing)
- Search and filter capabilities
- Sortable columns (User, Goal, Progress, Percentage)
- Inline editing for goals
- Permission-based controls (canEdit)
- Responsive layout for mobile and desktop

All improvements maintain existing functionality, follow the established purple design system (#311160, #4c1d95, #5b21b6), and use modern gradients, shadows, and rounded borders for a professional appearance.

**Next Steps Suggested**:
- Localize new modal, tooltip, and filter strings through existing i18n layer
- QA with large datasets to confirm performance under stress
- Add regression tests for search/status filtering

# System Architecture

## Frontend Architecture

**Framework**: Next.js 15.5.1 with App Router and React 19.1.0, using both Server Components and Client Components strategically.

**Rationale**: App Router enables granular control over server-side rendering and client-side interactivity. The architecture supports progressive enhancement through feature flags.

**Client-Server Boundary**: The application uses feature flags (`FEATURE_APP_SHELL_RSC`, `FEATURE_PROPOSALS_CLIENT_REFACTOR`) to control the split between Server Components and Client Components. The legacy approach wraps the entire app in Client Components, while the new approach leverages RSC for initial data fetching and metadata generation.

**State Management**: 
- React Query (`@tanstack/react-query`) for server state and caching
- React Context for application-level state (language preferences, portal state)
- Session state managed through NextAuth's `SessionProvider`

**UI Components**: Custom component library with Tailwind CSS for styling, using vendor-managed packages for specialized components (cmdk, react-table, react-virtual). The design system includes a purple brand theme (`--primary: #3B0A69`) with consistent spacing and typography tokens.

**Routing Strategy**: Locale-aware routing with support for `/es` and `/en` prefixes. Special portal routes under `/mapache-portal` for team-specific features. The application redirects root `/` to `/home`.

## Backend Architecture

**API Routes**: Next.js API routes under `/src/app/api/` following RESTful conventions:
- `/api/proposals` - CRUD operations for proposals with optional pagination
- `/api/items` - Item catalog management
- `/api/admin/users` - User administration
- `/api/mapache/*` - Team-specific task and board management
- `/api/pipedrive/sync` - CRM integration endpoints

**Authentication Guards**: Centralized authentication logic in `/src/app/api/_utils/require-auth.ts` with feature flag support (`FEATURE_SECURE_API_ROUTES`). Guards can be enabled/disabled without code changes.

**Business Logic**: Separated into specialized modules:
- `/src/lib/google-system.ts` - Google Workspace document generation
- `/src/lib/google-oauth.ts` - OAuth client management
- `/src/lib/pipedrive.ts` - Pipedrive CRM integration
- `/src/app/mapache-portal/` - Portal-specific business logic

**Feature Flags**: Comprehensive flag system (`/src/lib/feature-flags.ts`) enabling safe rollout of architectural improvements without breaking existing functionality. Flags default to "off" to maintain backward compatibility.

**Internationalization**: Custom i18n implementation with server-side message loading, client-side context, and support for ICU MessageFormat-style placeholders. Messages stored in JSON files per locale.

## Data Layer

**ORM**: Prisma 6.18.0 for type-safe database access with schema defined in `/prisma/schema.prisma`.

**Key Models**:
- `User` - Authentication and authorization with role and team assignments
- `Proposal` - Commercial proposals with items, amounts, and status tracking
- `Item` - Service catalog with SKUs, pricing, and multilingual translations
- `MapacheTask` - Team task management with status workflows
- `MapacheBoard` - Kanban board configurations with column mappings

**Relationships**: 
- Proposals belong to users and contain multiple items
- Tasks have status relationships and support assignees
- Users can have multiple portal accesses and team memberships

**Indexing**: Schema includes a manually added index on `Proposal.userId` (documented in ADR 2025-10-01-db-index.md) to optimize user-filtered queries.

**Query Optimization**: Feature flag `FEATURE_PROPOSALS_PAGINATION` enables paginated responses with reduced `select` to minimize data transfer. Legacy endpoints return full datasets for backward compatibility.

## Authentication & Authorization

**Provider**: NextAuth v4 with Google OAuth as the primary authentication method.

**Session Strategy**: JWT-based sessions with server-side verification. Session data includes user ID, role, team, and portal access list.

**Role System**: Three-tier role hierarchy (`admin`, `lider`, `usuario`) mapped from Prisma `Role` enum to application `AppRole` type via `/src/lib/roles.ts`.

**Portal Access**: Dynamic portal assignment based on explicit `PortalAccess` records or fallback logic (admins get all portals, Mapache team members get mapache portal). Portal keys: `direct`, `mapache`, `partner`, `marketing`.

**Security Considerations**: 
- OAuth uses `allowDangerousEmailAccountLinking` by default (can be disabled via `FEATURE_STRICT_OAUTH_LINKING`)
- API routes can enforce session/role checks when `FEATURE_SECURE_API_ROUTES` is enabled
- Scopes requested include Google Drive and Docs access for document generation

**Adapter**: Prisma adapter for NextAuth stores sessions, accounts, and verification tokens in the database.

# External Dependencies

## Third-Party Services

**Google Workspace APIs**:
- **Google OAuth**: Client ID and secret for authentication
- **Google Docs API**: Document creation and template population
- **Google Drive API**: File permissions and folder management
- **Google Sheets API**: Fetching cost data for WhatsApp tiers
- **Scopes**: Full Drive access, email, profile, and Docs permissions
- **Integration**: `/src/lib/google-oauth.ts` and `/src/lib/google-system.ts`

**Pipedrive CRM**:
- **Purpose**: Sync won deals and proposal URLs to CRM records
- **API**: RESTful integration via `/src/lib/pipedrive.ts`
- **Configuration**: Base URL, API token, custom field IDs for oneshot amounts and proposal URLs
- **Endpoints**: Deal products replacement, field updates

**Vercel Analytics**: 
- **Package**: `@vercel/analytics`
- **Purpose**: Production usage tracking

## Database

**PostgreSQL**: Primary data store accessed via Prisma ORM.

**Connection**: Configured through `DATABASE_URL` environment variable.

**Migration Strategy**: Prisma Migrate with separate dev and deploy commands. Migrations must be applied manually before deployment (`npm run db:deploy`).

**Schema Management**: Schema versioning through Prisma migrations stored in `/prisma/migrations/`.

## UI Component Libraries

**Atlaskit Pragmatic Drag and Drop**: 
- **Version**: 1.7.7
- **Purpose**: Drag-and-drop interactions for Mapache boards
- **Custom Types**: `/src/types/atlaskit-pragmatic-dnd.d.ts`

**Floating UI**: 
- **Purpose**: Tooltip and popover positioning
- **Vendor Package**: Local vendor copy at `/vendor/@floating-ui/react`

**Lucide React**: 
- **Version**: 0.542.0
- **Purpose**: Icon library

**TanStack Libraries**:
- **React Query**: Server state management and caching
- **React Table**: Data grid functionality (vendor copy)
- **React Virtual**: Virtualized list rendering (vendor copy)

## Development Tools

**TypeScript**: Strict mode enabled with path aliases (`@/*` mapping to `src/*`).

**ESLint**: Flat config setup with Next.js recommended rules.

**Testing**: 
- **Framework**: Node.js native test runner
- **Libraries**: Testing Library (custom mock implementation), React DOM for rendering
- **Structure**: Unit tests (`tests/unit/`), integration tests (`tests/integration/`), e2e tests (`tests/e2e/`)
- **Mocks**: Custom implementations for Next.js modules (navigation, dynamic imports) and NextAuth

**Build Tooling**: 
- **Turbopack**: Development mode bundler
- **Bundle Analyzer**: Optional via `npm run build:analyze` (requires `ANALYZE=true`)
- **PostCSS**: Tailwind CSS processing with autoprefixer

## Deployment

**Platform**: Designed for Vercel deployment with specific build command (`vercel-build` script includes Prisma generation).

**Environment Variables**: Documented in `/docs/ENV.md` with feature flags, OAuth credentials, database URL, and NextAuth configuration.

**Domains**: 
- Local: `http://localhost:3000`
- Preview: `https://<branch>-preciario-web.vercel.app`
- Production: `https://preciario.wisecx.com`