# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start development server with external network access
npm run dev:clean        # Clean build and start development server
npm run dev:https        # Start development server with HTTPS
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:auth        # Run authentication-specific tests
```

## Architecture Overview

### Unified Authentication System
The application uses a **unified authentication system** that handles both user and admin authentication through a single store and hook:

- **Store**: `stores/auth-store.ts` - Unified Zustand store managing both user and admin auth states
- **Hook**: `hooks/use-auth.ts` - Single hook with type parameter: `useAuth('user')` or `useAuth('admin')`
- **Provider**: `components/auth-provider.tsx` - Global auth initialization
- **Roles**: Role-based access control with `role_id` (1: user, 2: admin)

### Route Protection
Middleware-based route protection with role verification:
- User routes: `/client/*`, `/home/*`, `/my-page/*`, etc.
- Admin routes: `/admin/*`
- Auth routes: `/login`, `/signup`, `/verify`, etc.
- Automatic redirection based on user role and route access

### Database Architecture
PostgreSQL via Supabase with the following key tables:
- `user_profiles` - User/admin profiles with role-based separation
- `business_cards` - Digital business cards
- `events` - Networking events
- `collected_cards` - User's saved business cards
- `event_participants` - Event participation tracking
- `notifications` - System notifications
- `feedback` - User feedback system

### App Router Structure
```
app/
├── (auth)/           # Shared authentication pages (login, signup)
├── admin/            # Admin-only pages with nested auth routes
├── client/           # User-facing application pages
├── api/auth/         # Authentication API endpoints
└── api/              # Other API routes
```

### State Management
- **Zustand** for global state management
- **Persist middleware** for auth state persistence
- **React Hook Form** with Zod validation for forms

### UI Components
- **Radix UI** primitives with custom styling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Framer Motion** for animations

## Key Development Patterns

### Authentication Usage
```typescript
// User authentication
const { user, profile, signOut } = useAuth('user')

// Admin authentication
const { user: admin, profile, signOut } = useAuth('admin')
```

### Route-based Development
- User features go in `/client/*` or dedicated user routes
- Admin features go in `/admin/*`
- Shared auth components in `/(auth)/*`

### Component Organization
- Reusable UI components in `components/ui/`
- Feature-specific components in `components/admin/` or user-specific directories
- Auth-related components at component root level

### API Development
Authentication APIs follow the pattern:
- Email/password authentication
- OAuth integration (Google, Kakao, Naver)
- Role-based profile creation and management
- Automatic user/admin separation

## MCP Integration
When working with Supabase operations, use the `supabase-neimd` MCP server as specified in `.cursor/rules/rule.mdc`.

## Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL

## Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Authentication**: Supabase Auth with custom role management