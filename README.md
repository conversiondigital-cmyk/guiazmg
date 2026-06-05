# Guía ZMG

Hyperlocal business directory and search engine for the Guadalajara Metropolitan Area (ZMG).

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: TailwindCSS v4 + ShadCN v4
- **Database**: PostgreSQL 17 + Prisma 7
- **Auth**: Auth.js v5 beta (NextAuth)
- **Payments**: Mercado Pago (primary), Stripe (optional)
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions

## Requirements

- Node.js 22+
- pnpm (recommended) or npm
- PostgreSQL 16+

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-org/guiazmg.git
cd guiazmg
npm install

# 2. Copy env vars
cp .env.example .env

# 3. Start database
docker compose up -d

# 4. Apply migrations & seed
npx prisma migrate dev
npm run seed:base

# 5. Run dev server
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 3100) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest (watch) |
| `npm run test:run` | Run Vitest once |
| `npm run test:e2e` | Run Playwright e2e |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create migration |
| `npm run db:migrate:deploy` | Deploy migrations |
| `npm run db:push` | Push schema (dev only) |
| `npm run db:seed` | Run base seed |
| `npm run seed:base` | Base seed (locations, plans, admin) |
| `npm run seed:demo` | Demo data seed |
| `npm run seed:production` | Production essentials |
| `npm run db:reset` | Reset database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/              # Next.js App Router (routes, APIs, pages)
│   ├── api/          # API route handlers
│   ├── admin/        # Admin panel pages
│   ├── dashboard/    # Business owner dashboard
│   ├── agente/       # Agent CRM
│   ├── editor/       # Editor panel
│   └── ...
├── components/       # React components
│   ├── ui/           # ShadCN UI primitives
│   └── ...
├── lib/              # Business logic
│   ├── analytics/    # Analytics events
│   ├── security/     # Auth, CORS, CSRF, rate-limit
│   ├── email/        # Email templates & sending
│   ├── payments/     # Mercado Pago, Stripe
│   └── ...
├── proxy.ts          # Edge proxy (middleware)
└── generated/        # Prisma client (gitignored)
```
