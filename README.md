# LTReee

**One link. Your whole orbit.**

LTReee is a link-in-bio platform for people who build things. Every account gets a fast, shareable profile with links, contact details, and an optional **Developer's Arena** for showcasing projects — live demos, repositories, tags, and per-project analytics.

## Features

- **Public profile** at `/:username` with links, bio, avatar, location, website, and contact details.
- **Developer's Arena** at `/:username?view=arena` — project cards with covers, demos, repos, tags, and a deep-space visual theme.
- **Link management** with drag-and-drop ordering, visibility toggles, private links, and URL validation.
- **Profile editor** with debounced autosave and a live preview.
- **Embeddable widget** at `/embed/:username` with configurable layouts and themes.
- **Analytics** for embed views, link clicks, project views, and demo/repo clicks.
- **Public leaderboard** with per-project upvotes and downvotes.
- **AI-assisted SEO** for profile titles and descriptions.
- **Private storage** for avatars and project covers, served through cached public routes only when the profile is published.
- **SEO-ready** metadata, structured data, sitemap, and `noindex` on private pages.

## Tech stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Framework        | React 19, TanStack Start, TanStack Router         |
| Data fetching    | TanStack Query                                    |
| Styling          | Tailwind CSS 4, Radix UI, shadcn-style components |
| Backend          | Supabase (Postgres, Auth, Storage)                |
| Server functions | TanStack Start `createServerFn`                   |
| AI               | Vercel AI SDK with an OpenAI-compatible API       |
| Build            | Vite 8, Nitro (Cloudflare module preset)          |
| Language         | TypeScript                                        |

## Getting started

### Prerequisites

- Node.js 22+
- npm 10+
- A Supabase project

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` for local overrides, then fill in the values. The existing `.env` contains the project defaults; Vite loads `.env.local` first. Never put server secrets in a `VITE_`-prefixed variable — those are embedded in the browser bundle.

| Variable                        | Required        | Scope           | Purpose                                                                                 |
| ------------------------------- | --------------- | --------------- | --------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                  | Yes             | Server + client | Supabase project URL                                                                    |
| `SUPABASE_PUBLISHABLE_KEY`      | Yes             | Server + client | Supabase publishable (anon) key                                                         |
| `VITE_SUPABASE_URL`             | Yes             | Browser         | Same URL, exposed to Vite                                                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes             | Browser         | Same publishable key, exposed to Vite                                                   |
| `VITE_SUPABASE_PROJECT_ID`      | Yes             | Browser         | Project ref used by Supabase auth                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server features | Server only     | Admin client for tracking, storage proxies, and username checks. **Never expose this.** |
| `EMBED_TRACK_SECRET`            | Embed analytics | Server only     | HMAC key for short-lived embed tokens. Generate with `openssl rand -base64 32`.         |
| `OPENAI_API_KEY`                | AI SEO          | Server only     | API key for the OpenAI-compatible provider                                              |
| `OPENAI_BASE_URL`               | No              | Server only     | Defaults to `https://api.openai.com/v1`                                                 |
| `OPENAI_MODEL`                  | No              | Server only     | Defaults to `gpt-4o-mini`                                                               |
| `DATABASE_URL`                  | Migrations      | Local only      | Postgres connection string for Drizzle tooling                                          |

### Database

The repository currently has two migration sets. Apply **both**, in this order:

1. `supabase/migrations/*.sql` in filename (timestamp) order — core tables, RLS policies, storage policies, voting, and project events.
2. `drizzle/migrations/*.sql` in numeric order — SEO columns, the `public_profiles` view, leaderboard views, and embed nonce columns/indexes.

With the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`supabase db push` applies the `supabase/migrations` set. Apply the Drizzle set with `psql` (or your SQL editor) afterwards:

```bash
for f in drizzle/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

Then:

- Create a **private** Storage bucket named `avatars`. Avatar and project-cover policies are defined in the first migration.
- Enable the **Google** provider under Supabase Auth if you want Google sign-in.
- Add your local and production origins to the Supabase Auth redirect allow-list.

### Run

```bash
npm run dev
```

The dev server listens on `http://localhost:8080`.

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                          |
| `npm run build`     | Production build (Nitro, Cloudflare module preset) |
| `npm run build:dev` | Development-mode build                             |
| `npm run preview`   | Preview the production build                       |
| `npm run lint`      | Run ESLint                                         |
| `npm run format`    | Format with Prettier                               |

## Project structure

```text
src/
  components/          UI primitives and feature components
  hooks/               TanStack Query hooks and session state
  integrations/
    supabase/          Browser/admin clients and auth middleware
  lib/                 Server functions, validation, domain helpers
  routes/              File-based routes
  styles.css           Tailwind entry point and theme tokens
supabase/migrations/   Core schema and RLS
drizzle/migrations/    Follow-up schema changes
public/                Static assets
```

Server-only modules use the `.server.ts` suffix or are imported dynamically inside server functions, so secrets never reach the client bundle.

## Routes

| Route                                                                               | Description                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `/`                                                                                 | Landing page                                       |
| `/:username`                                                                        | Public profile (`?view=arena` opens the Arena tab) |
| `/leaderboard`                                                                      | Public project leaderboard                         |
| `/embed/:username`                                                                  | Embeddable links widget                            |
| `/auth`, `/reset-password`                                                          | Sign-in, sign-up, and password reset               |
| `/dashboard`, `/arena`, `/private`, `/embed`, `/analytics`                          | Authenticated workspace                            |
| `/link-in-bio`, `/linktree-alternative`, `/free-link-in-bio`, `/instagram-bio-link` | Marketing pages                                    |
| `/developers`, `/examples`                                                          | Arena and profile examples                         |
| `/sitemap.xml`                                                                      | Generated sitemap                                  |

## Security model

- Row-level security is enabled on all user tables.
- Anonymous reads are limited to published profiles, visible links/projects, and opt-in public contact details.
- Writes are owner-scoped through RLS, with bearer-token middleware on protected server functions.
- The service-role key is only used in server modules.
- Embed tracking uses HMAC-signed, short-lived tokens with replay protection.
- Avatar and cover proxies only serve files belonging to published profiles.
- Private and authenticated pages send `noindex`.

## Deployment

`npm run build` produces a Nitro server bundle in `.output/` targeting Cloudflare Workers by default. Deploy that output with Wrangler or your hosting provider's Nitro integration, and set the server-side environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `EMBED_TRACK_SECRET`, and the AI variables) in the hosting dashboard.

## Before opening a pull request

```bash
npx tsc --noEmit
npm run lint
npm run build
```

There is no automated test suite yet; the checks above are the current baseline.
