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
**Key Models**: `User`, `Proposal`, `Item`, `MapacheTask`, `MapacheBoard`, `GoalsProgressSnapshot`.
**Relationships**: Proposals contain items and belong to users; tasks have statuses; users have portal and team memberships. GoalsProgressSnapshot stores user goal metrics.
**Indexing**: `Proposal.userId` is indexed for optimized queries.

## Authentication & Authorization

**Provider**: NextAuth v4 with Google OAuth.
**Session Strategy**: JWT-based sessions with server-side verification.
**Role System**: Three-tier hierarchy (`admin`, `lider`, `usuario`) mapped from Prisma `Role` enum.
**Portal Access**: Dynamic assignment via `PortalAccess` records or fallback logic.
**Security**: Feature flags for strict OAuth linking and API route security, with Google Drive and Docs scopes.
**Goals Permissions**: All users can add manual Won deals for themselves. Admin/leaders can additionally manage Won deals for their team members. Backend enforces authorization via `canManageTarget` function.

## UI/UX Decisions

The application features a modern purple-themed design with gradients. Recent updates have focused on creating compact, professional, and minimalist layouts, improving space utilization, and unifying modal themes. Key interfaces like the Home Page, Configuration, Team Management, and User Management have been restructured for better visual hierarchy and density. The statistics dashboard has been completely redesigned with a three-tier visual layout, glassmorphism elements, enhanced KPI cards with sparklines, and interactive drill-down capabilities. The Generator page (`/portal/directo/generator`) has been visually modernized with the same purple/slate glassmorphism design system while preserving all existing functionality.

### Portal Theme Token System

A scalable, portal-scoped design token system is implemented in `src/styles/portal-tokens.css` to manage theming. This system defines tokens for surfaces, text, borders, modals, shadows, and brand colors.
**Portal Scopes**:
- `[data-portal="directo"]`: Purple/violet light theme (default)
- `[data-portal="mapache"]`: Dark glassmorphism with cyan/violet accents
- `[data-portal="marketing"]`: Blue professional light theme
- `[data-portal="partner"]`: Neutral slate light theme
**Theme Activation**: `PortalThemeProvider` sets `data-portal` attribute on `<html>`, with modals detecting the current portal for token application.

### Mapache Portal UI Components

Reusable UI components (`MapacheInput`, `MapacheSelect`, `MapacheTextarea`, `MapacheButton`) are styled using inline `style` props with CSS custom properties and fallback values. Chart tokens have been added to `portal-tokens.css` to style analytics components within the Mapache portal, ensuring consistent glass panel and chart element styling.

### Goals Page Consolidation

The `TeamRankingCard` component has been removed, and team display unified into `TeamMembersTable` with ranking functionality. The table is now integrated into the secondary cards grid, featuring compact styling with icon-only action buttons, reduced spacing, and smaller text/avatar sizes. The default sort is by "% cumplimiento" descending.

### UserProfileModal Race Condition Fix

A race condition when quickly switching user profiles, leading to stale data display, has been resolved. The solution involves tracking the active target user, resetting state on user change, and using `activeTargetKeyRef` to ensure only relevant API responses update the UI. Loading indicators provide visual feedback during data fetching.

### Goals Progress Snapshot System

A system to persist synced Pipedrive progress data to the database allows users to view goal/progress metrics from any location.
**Database Model**: `GoalsProgressSnapshot` stores `userId`, `year`, `quarter`, `goalAmount`, `progressAmount`, `pct`, `dealsCount`, `lastSyncedAt`.
**Data Flow**: GoalsPage syncs with Pipedrive, then POSTs batch snapshots. UserProfileModal reads from localStorage cache, then DB snapshot, then legacy APIs. An individual sync button directly calls `/api/goals/sync-user`.
**Sync Mode Selection**: Determines Pipedrive matching logic based on user's team membership ("Mapaches NC" or "Mapaches Upsell" vs. other teams).
**Cache Strategy**: Team data and personal data are cached in localStorage.

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