# Superform — V1

A premium form builder that competes with Typeform and Google Forms.

## Stack
- **Next.js 16** (App Router) · TypeScript · Tailwind CSS
- **Supabase** — PostgreSQL + Auth + Realtime
- **Zustand** — editor state
- **@dnd-kit** — drag-and-drop question reordering
- **Framer Motion** — transitions

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy your keys into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ANTHROPIC_API_KEY=your-claude-api-key   # optional, for AI generation
   ```
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Routes
| Route | Description |
|-------|-------------|
| `/` | Marketing landing page with live demo |
| `/auth` | Login / Signup |
| `/dashboard` | Your forms list |
| `/builder/[formId]` | Form editor (Build · Design · Preview) |
| `/f/[slug]` | Public respondent view |
| `/responses/[formId]` | Response room |

## Art Directions
- **Minimal** — White, DM Mono, quiet
- **Editorial** — Warm cream, Cormorant Garamond, dramatic
- **Glass** — Frosted blur, layered depth
- **Brutalist** — Black borders, heavy weight, zero radius
- **Cinematic** — Dark, warm gold, serif elegance
