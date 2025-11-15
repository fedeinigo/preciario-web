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

## UI/UX Decisions

The application features a modern purple-themed design with gradients. Recent updates have focused on creating compact, professional, and minimalist layouts, improving space utilization, and unifying modal themes. Key interfaces like the Home Page, Configuration, Team Management, and User Management have been restructured for better visual hierarchy and density. The statistics dashboard has been completely redesigned with a three-tier visual layout, glassmorphism elements, enhanced KPI cards with sparklines, and interactive drill-down capabilities.

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