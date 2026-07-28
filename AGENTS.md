# AGENTS.md — Link Hub Internal PT Putra Perkasa Abadi (PPA)

## 1. ARCHITECTURE OVERVIEW & TECH STACK
- **Framework**: Next.js 14+ (App Router, Server & Client Components, TypeScript)
- **Database & ORM**: Vercel Postgres / Neon PostgreSQL + Prisma ORM (Models: `Admin`, `Category`, `Link`, `ClickLog`, `SiteSettings`)
- **Authentication**: Auth.js (NextAuth v5) Credentials Provider (bcrypt password hashing, JWT session mode)
- **Rate Limiting**: Lightweight in-memory sliding-window rate limiter in Middleware/API routes (suitable for internal enterprise usage with zero external service overhead)
- **Theme Switcher**: `next-themes` with custom 3-theme strategy (`data-theme="light"`, `data-theme="dark"`, `data-theme="glass"`) mapping to root CSS variables & backdrop filters
- **Styling & Tokens**: Tailwind CSS v4 / Custom CSS Variables (Glass, Neu, Clay hybrid design system)
- **Animations**: Framer Motion (custom bezier curves `[0.22, 1, 0.36, 1]`, staggered list reveals, smooth page transitions)
- **Icons**: Restyled Lucide/Phosphor SVG icon containers (custom stroke widths, morphic backdrops, hover states)
- **Charts**: Recharts (Custom themed dark/light/glass charts)

---

## 2. DESIGN SYSTEM & VISUAL RULES (STRICT ANTI-AI-SLOP)

### 2.1 PPA Corporate & Safety Color Palette
- **Primary Navy**: `#0B192C` (Deep Dark Navy), `#1E3E62` (PPA Corporate Navy)
- **Safety Orange**: `#FF6500` (PPA Safety Orange - CTA, Badges, Highlights)
- **Accent Glow**: `#FF8A00` (Glows & subtle hover states)
- **Neutral Dark Base**: `#070F1B` (Background), `#111C2E` (Surface/Card)
- **Neutral Light Base**: `#F4F6F9` (Background), `#FFFFFF` (Surface)

### 2.2 Hybrid Morphism Guidelines & 3-Theme Switcher Strategy
Using `next-themes` Provider (`attribute="data-theme"`):
1. **Glass Mode (`data-theme="glass"`)**:
   - Deep dark navy background with dynamic ambient gradient glow.
   - Glassmorphism: `backdrop-blur-xl`, `bg-navy-900/60`, `border border-white/10`, `shadow-2xl shadow-black/20`.
2. **Dark Mode (`data-theme="dark"`)**:
   - Solid slate/dark navy surfaces, subtle borders, high-contrast text for low-light environments.
3. **Light Mode (`data-theme="light"`)**:
   - Crisp `#F4F6F9` background, clean white cards with soft shadow elevation, bold PPA navy typography & safety orange CTA elements.

### 2.3 Morphism Specifics
- **Glassmorphism (Main Cards & Nav)**: Section containers, link cards, navigation bar, admin sidebars.
- **Neumorphism (Interactive Controls & Toggles)**: Search inputs, theme toggles, language switches, pagination buttons. Soft dual shadows (inset/outset) creating tactile feel.
- **Claymorphism (Badges, Accents, Floating Badges)**: Category badges, count pills, live status indicators. Soft rounded 3D shapes with subtle inner highlight (`box-shadow: inset 2px 2px 4px rgba(255,255,255,0.3)`).

### 2.4 Explicit Anti-Slop Bans
- ❌ **NO Default OS Emojis** (no 😀🚀✨ anywhere in code or UI).
- ❌ **NO Generic Stock 3D AI illustrations** (no purple/pink generic blob backgrounds).
- ❌ **NO Plain unmodified Linktree/Bento templates**.
- ❌ **NO Hardcoded Secrets** (all database URLs, Auth secrets, admin credentials stored in `.env.local` / Vercel Environment Variables).

---

## 3. FILE ORGANIZATIONAL PATTERNS
```
/
├── app/
│   ├── (public)/          # Public routes (/, /hub) - NO LOGIN REQUIRED
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (admin)/           # Admin routes (/admin/*) - AUTH REQUIRED
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── links/
│   │   │   ├── categories/
│   │   │   ├── analytics/
│   │   │   └── settings/  # SiteSettings manager (logo, taglines ID/EN, default theme)
│   │   └── layout.tsx
│   ├── api/               # API Routes (auth, links, click-tracking, categories, analytics, settings)
│   ├── globals.css        # CSS Variables for Glass/Neu/Clay & PPA palette
│   └── layout.tsx
├── components/
│   ├── ui/                # Base design system elements (GlassCard, NeuButton, ClayBadge, ThemeProvider, etc.)
│   ├── icons/             # Custom restyled SVG icons (PPA bespoke icon set)
│   ├── public/            # LinkHub list, SearchBar, CategoryCollapsible, ThemeSwitcher, LangToggle
│   ├── admin/             # LinkForm, ReorderList (DND), CategoryManager, AnalyticsChart, Scheduler, SiteSettingsForm
│   └── motion/            # Framer Motion container wrappers & entrance animations
├── lib/
│   ├── prisma.ts          # Singleton Prisma client instance
│   ├── auth.ts            # Auth.js / NextAuth options & helpers
│   ├── rate-limit.ts      # In-memory sliding window rate-limiter
│   ├── utils.ts           # Classnames merger, date formatters
│   └── dictionary.ts      # ID / EN bilingual translation dictionary
├── prisma/
│   ├── schema.prisma      # Prisma Database Schema (Admin, Category, Link, ClickLog, SiteSettings)
│   └── seed.ts            # PPA initial seed data (Categories, Links, Admin user, SiteSettings)
└── public/
    ├── brand/             # PPA logos, icons, favicon
    └── og-image.png       # Bespoke Open Graph image
```

---

## 4. SUBAGENT WORKSTREAM ROLES & DEPENDENCIES

| Subagent Name | Role / Scope | Primary Dependencies |
|---|---|---|
| `agent-schema` | Prisma Schema (`Admin`, `Category`, `Link`, `ClickLog`, `SiteSettings`), Migrations, Seed Data, Prisma Client Singleton | None (Phase 1) |
| `agent-design-system` | Tailwind Config, CSS Variables (Glass/Neu/Clay), `next-themes` setup (Light/Dark/Glass), Base UI Components | None (Phase 1) |
| `agent-icon-motion` | Custom PPA SVG Icon collection & Framer Motion variants library | `agent-design-system` |
| `agent-auth` | Auth.js (NextAuth) setup, bcrypt password hashing, Login route, Middleware `/admin/*` protection, CSRF & in-memory rate limiting | `agent-schema` |
| `agent-public-page` | Public Link Hub (`/`), Search bar, Category collapsibles, Bilingual (ID/EN) switcher, 3-Theme switcher | `agent-design-system`, `agent-icon-motion` |
| `agent-admin-panel` | Admin Dashboard, Real-time Link CRUD, SiteSettings Manager, Drag & Drop Reordering (`@hello-pangea/dnd`), Scheduling | `agent-auth`, `agent-design-system` |
| `agent-analytics` | Click tracking API route, aggregate metrics, Recharts dark/light glass analytics charts | `agent-schema`, `agent-admin-panel` |
| `agent-seo` | SEO Metadata, Open Graph dynamic/static image, Favicon, i18n metadata | `agent-public-page` |
| `agent-qa-review` | Security audit (CSRF, sanitize, secrets), Accessibility audit (WCAG AA, contrast, aria), Lighthouse checks | All modules completed |
| `agent-deploy` | `.env.example`, Next.js build config, deployment guide, Vercel readiness verify | `agent-qa-review` approved |

---

## 5. HUMAN-IN-THE-LOOP CHECKPOINT (MANDATORY APPROVAL GATES)
The agent system MUST halt and solicit explicit user approval before proceeding when encountering any of the following:
1. **Destructive Database Operations**: Any migration or script that drops tables, columns, or destroys existing data.
2. **Production Deployment**: Executing `vercel --prod` or pushing commits directly to the main production branch.
3. **Security Configuration Edits**: Modifications to authentication files (`lib/auth.ts`, `middleware.ts`), secret handling, or CORS policy changes.
4. **New Dependency Installation**: Installing npm packages not explicitly listed in the master prompt tech stack (`@hello-pangea/dnd`, `recharts`, `framer-motion`, `lucide-react`, `@prisma/client`, `prisma`, `next-auth`, `bcryptjs`, `clsx`, `tailwind-merge`, `next-themes`).

---

## 6. DEFINITION OF DONE (DoD) CHECKLIST
Before any subagent or feature is considered complete:
- [ ] Code follows naming conventions and directory structure in `AGENTS.md`.
- [ ] NO default OS emojis or generic icon libraries are used; restyled SVG icons only.
- [ ] Responsive across Mobile (375px), Tablet (768px), and Desktop (1440px).
- [ ] Keyboard navigable & WCAG AA contrast compliant.
- [ ] Zero hardcoded secrets, API keys, or database credentials.
- [ ] All public-facing text translated in both Bahasa Indonesia and English dictionary.
- [ ] **Unit / Integration Tests**: Basic unit/integration tests verified for `agent-schema` (Prisma CRUD operations & seed execution), `agent-auth` (bcrypt password verification & route authorization guards), and `agent-analytics` (click logging & aggregation logic).
- [ ] Production build (`npm run build`) compiles cleanly with 0 TypeScript or Lint errors.
