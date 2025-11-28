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

### Portal Mapache - Goals Section Modals (Nov 2025)

Improved contrast and legibility for dark glassmorphism theme in `/portal/mapache/goals`:

**UserProfileModal** (appearance="mapache"):
- **Text Classes**: Changed from low-opacity whites to solid white with enhanced drop-shadows
- **Labels**: Cyan-300 with drop-shadow for visibility (`text-cyan-300`)
- **Subtle Text**: Cyan-200 for secondary information (`text-cyan-200`)
- **Info Cards**: Slate/indigo gradient backgrounds with violet borders instead of `mapache-surface-card`
- **Avatar Ring**: Cyan glow effect (`ring-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]`)
- **Section Borders**: Cyan accent borders (`border-cyan-400/30`)

**MemberDealsModal** (theme="mapache"):
- **Deal Cards**: Solid slate/indigo gradient backgrounds with violet borders for clear separation
- **Labels**: Cyan-200 for muted text, solid white for values
- **Badges**: Cyan-to-violet gradient with glow effect
- **Panel**: Solid dark gradient with cyan border accent
- **Button**: Cyan-violet gradient with hover glow effect

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