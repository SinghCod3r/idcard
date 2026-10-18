<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — ID Card Platform Guide for AI Agents

> **Mandatory reading for all AI agents and automated assistants working in this repository.**  
> This file describes the verified architecture, tech stack, data pipelines, coding standards, and change protocols for the ID Card Management application. Do not make assumptions or introduce incompatible paradigms.

---

## 1. Project Overview

The **ID Card Platform** is a multi-tenant web application designed for colleges and educational institutions to manage student records, take/upload portraits, approve ID details, and generate/export identification card assets.

### Key Capabilities
- **Multi-Tenant College Isolation**: Each college's data (students, classes, photos) is isolated via Supabase Row Level Security (RLS) and server-side authorization guards.
- **Role-Based Access Control**:
  - `SUPER_ADMIN`: Manages colleges, platform users, and global student directories, and can bulk export photos as `.zip`.
  - `COLLEGE_ADMIN` / `COLLEGE_STAFF`: Manages student records and classes within their assigned college.
  - `UNASSIGNED`: Registered users awaiting assignment to a college.
- **Mobile-First PWA Experience**: Installable on Android (native prompt), iOS Safari (Add to Home Screen modal), and desktop (standalone display mode).
- **In-Browser Camera & Optimization Pipeline**: Fullscreen mobile camera with ID portrait frame, live preview step, and automatic client-side resizing/compression to the KB range (~50KB–300KB) before storage upload.

---

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) `16.3.8` (App Router, Turbopack, Server Actions, Server Components)
- **Runtime & Language**: Node.js, [TypeScript](https://www.typescriptlang.org/) `5.x`, [React](https://react.dev/) `19.2.8`
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) `v4` (`@import "tailwindcss";` in `globals.css`), `tw-animate-css`
- **UI Components & Primitives**: [Base UI](https://base-ui.com/) (`@base-ui/react`), [Radix UI](https://www.radix-ui.com/) (`@radix-ui/react-slot`, `@radix-ui/react-label`), [Lucide React](https://lucide.dev/) icons
- **Form Management**: `react-hook-form`, `@hookform/resolvers`, [Zod](https://zod.dev/) `v4`
- **Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js` `2.117.2`, `@supabase/ssr` `0.12.7`), PostgreSQL with RLS
- **Progress Feedback**: `nextjs-toploader` `3.9.17`
- **Export Utility**: `jszip` `3.10.2` (for batch photo zip downloads)

---

## 3. Repository Structure

```text
idcard/
├── AGENTS.md                  # This file (AI coding instructions & repository guide)
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies and development scripts
├── tsconfig.json              # TypeScript path aliases (@/* -> ./src/*)
├── eslint.config.mjs          # Flat ESLint configuration
├── public/                    # Static public assets served at root
│   ├── favicon.ico
│   ├── manifest.json          # Static fallback Web App Manifest
│   ├── sw.js                  # PWA Service Worker (precache & static caching)
│   └── icons/                 # PWA icons (192x192, 512x512, maskable, apple-touch)
├── src/
│   ├── proxy.ts               # Next.js edge middleware proxying Supabase session
│   ├── app/                   # App Router pages, layouts, and route handlers
│   │   ├── layout.tsx         # Root layout (Viewport, PWA head script, PWAProvider)
│   │   ├── page.tsx           # Root redirect controller (routes by auth/role)
│   │   ├── globals.css        # Tailwind v4 theme variables and base styling
│   │   ├── manifest.ts        # Next.js dynamic manifest route (/manifest.webmanifest)
│   │   ├── (auth)/
│   │   │   ├── login/         # User authentication
│   │   │   ├── forgot-password/
│   │   │   ├── set-password/
│   │   │   └── auth/confirm/  # Auth callback handler
│   │   ├── admin/             # Super Admin portal routes (/admin/colleges, /admin/users, etc.)
│   │   ├── app/               # College User portal routes (/app/students, /app/classes, etc.)
│   │   └── api/               # API route handlers (e.g. photos zip download)
│   ├── components/            # Reusable React components
│   │   ├── ui/                # Base UI / Radix primitives (button, dialog, sheet, input, etc.)
│   │   ├── layout/            # App chrome, desktop sidebar, and mobile navigation
│   │   ├── forms/             # Form fields, actions, and alert wrappers
│   │   ├── pwa/               # PWA Provider, install buttons, and guidance modals
│   │   └── students/          # Student table, filters, form, and camera modal
│   ├── hooks/                 # Custom React client hooks
│   │   └── use-pwa-install.ts # PWA install state, prompt handler, and context hook
│   ├── lib/                   # Core business logic, data access, and utilities
│   │   ├── auth/              # Server-side session resolution and login actions
│   │   ├── authz/             # Role guards (requireSuperAdmin, requireCollegeMember)
│   │   ├── db/                # Supabase database queries and mutations (server-only)
│   │   ├── forms/             # Server action runners, form state, and Zod parsers
│   │   ├── media/             # Client-side image compression and canvas resizing
│   │   ├── supabase/          # Supabase client/server/middleware initializers
│   │   ├── nav.ts             # Navigation configuration by role
│   │   ├── labels.ts          # Display helpers, date formatters, role badges
│   │   ├── site.ts            # Site origin and redirect URL helpers
│   │   └── utils.ts           # Class merge utility (cn) and slug generators
│   └── types/                 # Shared TypeScript domain interfaces
│       └── index.ts           # Database entities, profiles, roles, and pagination
└── supabase/                  # Supabase local config, migrations, and seeds
```

### Directory Placement Rules
- **`src/app/`**: Only route segments, page layouts, route handlers, and error boundaries. No raw database queries directly in page files if reusable via `src/lib/db/`.
- **`src/components/ui/`**: Headless/design system UI primitives. Do not put business logic or database operations here.
- **`src/lib/db/`**: Marked `'server-only'`. Contains database mutations and queries. Client components must never import from this directory.
- **`src/lib/media/`**: Client-side media utilities (`compressImage`). Uses browser APIs (`canvas`, `createImageBitmap`).
- **`src/hooks/`**: Client-side React hooks. Always include `'use client'`.

---

## 4. Application Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  - AppChrome (Desktop Aside & Mobile Sheet)             │
│  - StudentForm (Live Preview, Validation, Optimizing)   │
│  - CameraModal (ID Guide Frame, Shutter, Switch, Retake)│
│  - compressImage() (Canvas resize to 1000px, 50-300KB)  │
│  - PWAProvider (Early head capture, promptInstall)      │
└────────────────────────────┬────────────────────────────┘
                             │
                      Server Actions
                             │
┌────────────────────────────▼────────────────────────────┐
│               Next.js App Server (Node.js)              │
│  - proxy.ts & middleware.ts (Session refresh)           │
│  - requireAuth() / requireCollegeMember() / guards      │
│  - Server Actions (createStudentAction, etc.)           │
│  - src/lib/db/ (colleges, students, photos, members)    │
└────────────────────────────┬────────────────────────────┘
                             │
                      Supabase Client
                             │
┌────────────────────────────▼────────────────────────────┐
│                    Supabase Backend                     │
│  - Postgres with Row Level Security (RLS)               │
│  - Auth Service (Users & Sessions)                      │
│  - Storage Bucket: 'student-photos'                     │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Important Source of Truth Files

| Feature | Primary File | Description |
|---|---|---|
| **PWA Manifest** | [`src/app/manifest.ts`](file:///home/ayushcod3r/project_works/idcard/src/app/manifest.ts) | Dynamic manifest returning `MetadataRoute.Manifest` |
| **PWA Service Worker** | [`public/sw.js`](file:///home/ayushcod3r/project_works/idcard/public/sw.js) | Precache & static asset caching, bypassing dynamic/auth APIs |
| **PWA Context & Prompt** | [`src/components/pwa/pwa-provider.tsx`](file:///home/ayushcod3r/project_works/idcard/src/components/pwa/pwa-provider.tsx) | Early capture synchronization & install execution |
| **Download App Button** | [`src/components/pwa/download-app-button.tsx`](file:///home/ayushcod3r/project_works/idcard/src/components/pwa/download-app-button.tsx) | Sidebar action with instant prompt trigger & iOS fallback |
| **Camera Modal** | [`src/components/students/camera-modal.tsx`](file:///home/ayushcod3r/project_works/idcard/src/components/students/camera-modal.tsx) | Fullscreen scanner, ID card overlay, preview/retake |
| **Image Compression** | [`src/lib/media/compress-image.ts`](file:///home/ayushcod3r/project_works/idcard/src/lib/media/compress-image.ts) | Browser-native canvas resize to max 1000px & JPEG compression |
| **Student Form** | [`src/components/students/student-form.tsx`](file:///home/ayushcod3r/project_works/idcard/src/components/students/student-form.tsx) | Student fields, photo preview, optimization feedback badge |
| **Photo Storage Backend**| [`src/lib/db/photos.ts`](file:///home/ayushcod3r/project_works/idcard/src/lib/db/photos.ts) | Server-side upload to `student-photos` bucket & DB recording |
| **Role Authorization** | [`src/lib/authz/guards.ts`](file:///home/ayushcod3r/project_works/idcard/src/lib/authz/guards.ts) | `requireSuperAdmin`, `requireCollegeMember`, `resolveCollegeAccess` |
| **Session Resolver** | [`src/lib/auth/session.ts`](file:///home/ayushcod3r/project_works/idcard/src/lib/auth/session.ts) | Cached `getCurrentUser()` combining auth & college membership |
| **Middleware & Matcher**| [`src/proxy.ts`](file:///home/ayushcod3r/project_works/idcard/src/proxy.ts) | Session refresh matcher excluding static and PWA routes |
| **Sidebar Navigation** | [`src/components/layout/app-chrome.tsx`](file:///home/ayushcod3r/project_works/idcard/src/components/layout/app-chrome.tsx) | Desktop aside, mobile hamburger sheet, user role display |

---

## 6. Authentication & Roles

User accounts are authenticated via Supabase Auth and resolved through database records in `profiles` and `college_members`.

### Role Hierarchy
1. **`SUPER_ADMIN`**:
   - Resolved when `profiles.role === 'SUPER_ADMIN'`.
   - Access to `/admin` routes.
   - Allowed to manage all colleges, platform users, and global students.
   - Can download bulk student photos as zip files.
2. **`COLLEGE_ADMIN` / `COLLEGE_STAFF`**:
   - Resolved when user has an active membership in `college_members`.
   - Access to `/app` routes.
   - Locked to their assigned `college_id`. Cannot access or modify other colleges.
3. **`UNASSIGNED`**:
   - Valid auth session, but no college membership and not Super Admin.
   - Redirected to `/no-college`.

### Guard Protocol
Never trust client-supplied college IDs. Always validate using server guards:
```ts
// For college actions:
const { college, user } = await requireCollegeMember()
// For super admin actions:
const user = await requireSuperAdmin()
```

---

## 7. Photo Capture & Optimization Pipeline

Both camera-captured photos and gallery-uploaded files follow the exact same pipeline:

```text
[ Camera Capture ] ──┐
                     ├──► [ compressImage() ] ──► [ Optimized File ] ──► [ FormData ] ──► [ uploadStudentPhoto() ]
[ Gallery Upload ]  ──┘    - Max 1000x1000px        - 50 KB – 300 KB                      - Supabase Storage
                           - EXIF orientation       - High face sharpness                 - student_photos table
                           - Multi-pass JPEG
```

### Compression Rules
- **Max dimensions**: `1000px × 1000px` (aspect ratio preserved; no upscaling).
- **MIME type**: Output as `image/jpeg`.
- **Quality target**: Starts at `0.82`, dynamically drops to `0.72` or `0.64` (floor `0.60`) if file exceeds `350 KB`.
- **Target size**: ~50 KB – 300 KB (~90-95% reduction on raw camera photos).
- **Face Quality**: Never over-compress below `0.60`; facial features must remain sharp for printed ID cards.

---

## 8. Progressive Web App (PWA) Rules

### 1. Immediate Prompt Triggering
- In Chromium browsers, `beforeinstallprompt` is captured early in `<head>` via an inline script in [`src/app/layout.tsx`](file:///home/ayushcod3r/project_works/idcard/src/app/layout.tsx) and cached in `window.__deferredPrompt`.
- Clicking **📱 Download App** triggers `activePrompt.prompt()` immediately within the user gesture.
- Never delay `prompt()` with timeouts or route transitions.

### 2. Middleware Exclusions
All PWA assets must be explicitly exempt from auth redirects in [`src/proxy.ts`](file:///home/ayushcod3r/project_works/idcard/src/proxy.ts) and `src/lib/supabase/middleware.ts`:
- `/manifest.webmanifest`
- `/manifest.json`
- `/sw.js`
- `/icons/*`

### 3. iOS Fallback
iOS Safari does not support `beforeinstallprompt`. The application detects iOS and presents a 3-step modal guide:
1. Tap **Share**.
2. Tap **Add to Home Screen**.
3. Tap **Add**.

### 4. Standalone Mode Detection
When running inside standalone PWA mode (`display-mode: standalone` or `navigator.standalone === true`), the button automatically switches to a static **✓ App Installed** indicator.

---

## 9. UI / UX & Design System Guidelines

- **Color Palette**:
  - Background: Slate-900 / dark accents for sidebars, white / muted-slate for application canvas.
  - Primary Action: Blue (`#2563eb` / `#3b82f6`).
  - Success / Active: Emerald (`#10b981`).
  - Destructive: Red / destructive tokens from `globals.css`.
- **Typography & Icons**:
  - Font: Inter (`var(--font-inter)`).
  - Icons: Exclusively use `lucide-react`. Do not install other icon packages.
- **Components**:
  - Use primitives from `@/components/ui/` (`Button`, `Dialog`, `Sheet`, `TextField`, `Card`, `Table`).
  - Use `cn()` from `@/lib/utils` for conditional Tailwind class merging.
- **Mobile First**:
  - Touch targets must be at least 44×44px.
  - Safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) must be respected on fixed headers, mobile sheets, and bottom actions.
  - Prevent horizontal overflow (`overflow-x: hidden`).

---

## 10. AI Coding Agent Rules

### Mandatory Workflow
1. **Inspect First**: Always check existing components in `src/components/`, utilities in `src/lib/`, and hooks in `src/hooks/` before writing new code.
2. **Reuse Existing Patterns**: Follow the structure of existing forms (`student-form.tsx`, `college-form.tsx`) and database query files.
3. **No Duplicate Implementations**:
   - Do NOT create a second camera modal or file compression function.
   - Do NOT create duplicate Supabase clients.
   - Do NOT create secondary auth providers.
4. **Preserve Documentation & Comments**: Keep existing explanatory comments and docstrings intact.
5. **No Blind Dependency Additions**: Do not run `npm install` for utilities that can be solved with browser-native APIs or existing dependencies.
6. **Protect Client/Server Boundaries**:
   - Files with database queries or Supabase secret keys must remain `'server-only'`.
   - Files with hooks, `window`, `navigator`, or DOM events must be marked `'use client'`.

---

## 11. Change Protocol

When implementing any task, follow this exact sequence:

```text
1. UNDERSTAND   → Read user instructions and verify requirements.
2. INSPECT      → View existing files, check types in src/types/, review active routes.
3. PLAN         → Formulate a focused edit plan touching the minimum number of files.
4. IMPLEMENT    → Make precise, non-breaking modifications adhering to existing styling.
5. VERIFY       → Run `npm run build` to confirm TypeScript and build clean pass.
6. REPORT       → Summarize changes concisely with clickable file links.
```

---

## 12. Environment Variables

The project references the following environment variables:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | Supabase project API endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | Supabase anonymous public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Elevated key for admin operations (creating users, setting passwords) |
| `NEXT_PUBLIC_SITE_URL` | Optional | Custom production domain (falls back to `http://localhost:3000`) |

> [!CAUTION]
> Never commit actual secret keys or `.env.local` files to version control. Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components or browser bundles.

---

## 13. Development Commands

Run all commands from the repository root:

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
  Launches Turbopack on `http://localhost:3000`.

- **Production Build & Typecheck**:
  ```bash
  npm run build
  ```
  Runs `next build` with Turbopack and verifies all TypeScript definitions.

- **Start Production Server**:
  ```bash
  npm run start
  ```

- **Run Lint Checks**:
  ```bash
  npm run lint
  ```

---

## 14. Common Pitfalls to Avoid

1. **Hydration Mismatches with Browser APIs**:
   Never access `window`, `navigator`, or `localStorage` during initial SSR render. Guard all browser-only checks inside `useEffect` or inside event handlers.
2. **Blocking PWA Manifest / Service Worker**:
   If modifying `src/proxy.ts` or `src/lib/supabase/middleware.ts`, never remove `/manifest.webmanifest`, `/manifest.json`, or `/sw.js` from the public matcher list.
3. **Uncompressed Photo Uploads**:
   Never bypass `compressImage()` when setting a student photo. Uploading raw 5MB–15MB mobile photos degrades mobile network performance and risks hitting Supabase bucket payload limits.
4. **Camera Stream Leaks**:
   Whenever a camera stream is closed or switched, ensure `stream.getTracks().forEach(t => t.stop())` is called.
5. **Cross-Tenant Data Leakage**:
   Always scope student and class queries by `college_id`. Do not rely solely on the client URL parameter.

---

## 15. Definition of Done

A task is only complete when:
- [ ] Code compiles cleanly with zero TypeScript errors via `npm run build`.
- [ ] Existing features (ID cards, authentication, photo pipeline, PWA) remain fully functional.
- [ ] Responsive design works properly on mobile screens and desktop.
- [ ] No extraneous dependencies or duplicate components were introduced.
- [ ] Secrets and environment variables are protected.
- [ ] Changes are cleanly committed to Git.
