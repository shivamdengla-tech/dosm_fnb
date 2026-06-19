# CLAUDE.md — DOSM FnB

Context for AI assistants working on this repo. Keep it current when architecture changes.

## What this is

**DOSM FnB** is a CRM for the BITS Goa fest team to manage in-kind **F&B / FMCG brand deals**
across three fests — **Waves** (cultural), **Quark** (tech), **Spree** (sports). ~15–20 team
members cold-call brands and log progress; an admin (the FnB Coordinator) runs the master brand
list, allocates brands to callers, and tracks the pipeline.

Two roles:
- **admin** → `/admin` — sees everything; manages companies, allocations, team.
- **member** → `/dashboard` — sees only their own allocated brands and their own stats.

## Tech stack

- **React 19** + **Vite 8** (`npm run dev` / `build` / `lint`)
- **Tailwind CSS v4** via `@tailwindcss/vite` — **no `tailwind.config.js`**; theme lives in
  `src/index.css` under `@theme` + custom `@utility` blocks. Dark glassmorphism theme.
- **Supabase** (`@supabase/supabase-js`) — auth (email/password) + Postgres + RLS
- **react-router-dom v7** — routing
- **recharts v3** — charts; **lucide-react** — icons
- No component library — all UI is hand-built in `src/components/`.

## Project layout

```
src/
  lib/supabase.js      shared browser client + makeIsolatedClient() (session-isolated signUp)
  lib/data.js          shared Supabase fetchers + write helpers (logCall,
                       updateAllocationStatus, fetchMyQueue) + pure helpers
                       (flattenBrand, callsPerDay, normalizePhone/contactLinks,
                       followUpState, daysSince, buildCallQueue)
  constants.js         STATUSES, FESTS, FEST_META, CATEGORIES, SPREE_ONLY_CATEGORIES, app strings
  contexts/AuthContext.jsx   session + profile (role) state; signIn/signOut/refreshProfile
  contexts/ToastContext.jsx  toast stack; useToast() → toast.success/error/info(msg)
  components/
    ui.jsx             Card, Button, Input/Select/Textarea, StatusBadge, FestBadge, StatTile,
                       Modal, Banner, PageHeader, Loading, EmptyState, Field, CardTitle,
                       ContactLinks (tel/wa.me/mailto), FollowUpBadge, Skeleton* loaders
    charts.jsx         CategoricalBar, HorizontalBar, PipelineBar, Donut, AreaTrend, CompletionRing
    DataTable.jsx      searchable + multi-filter table
    LogCallSheet.jsx   fast modal to log a call outcome (+ optional follow-up) anywhere
    KanbanBoard.jsx    drag-to-change-status pipeline board (Progress Board "Board" view)
    CommandPalette.jsx ⌘K / Ctrl+K jump-to-company / jump-to-page + inline status-change (admin)
    BottomNav.jsx      mobile tab bar for members (md:hidden)
    Sidebar / Topbar / Layout / Footer / ProtectedRoute
                       Layout enables BottomNav (members) + CommandPalette (admin) via props
  pages/
    Login.jsx
    admin/    Dashboard, AllCompanies, Allocations, Team, ProgressBoard (Table + Kanban)
    member/   Dashboard (Up Next queue), MyCompanies
    shared/   AddCompany (role-aware), Settings, CompanyDetail
  seed.js              Node: one-time seed of 270 brands from brands.csv (service-role key)
  createAdmin.js       Node: create/promote an admin (service-role key)
migrations/            hand-run .sql schema changes (e.g. 0001_add_next_follow_up.sql)
brands.csv             seed data (name, category, fest_tag) — 270 rows
```

## Database schema (Supabase, RLS on)

- `profiles(id, full_name, role['admin'|'member'])` — `id` = auth.users id
- `brands(id, name, category, fest_tag)` — `fest_tag` is `'All'` or `'Spree'`
- `allocations(id, brand_id, member_id, fest, status)` — `fest` ∈ Waves/Quark/Spree;
  `status` is one of the pipeline statuses below. **This is where a brand's current status lives.**
- `call_logs(id, allocation_id, member_id, poc_name, poc_number, poc_email, status, notes,
  quantity, skus, delivery_date, stall_space, next_follow_up, created_at)` — **append-only**
  snapshot per call. `next_follow_up` is added by `migrations/0001_add_next_follow_up.sql`
  (run it in Supabase). Reads use `select('*')` and writes only send the column when a date
  is set, so the app keeps working before the migration is applied.

**Schema changes ship as `.sql` files in `migrations/`** for the user to run manually — the app
never alters the DB itself.

**Pipeline statuses** (ordered; colours in `constants.js > STATUSES`):
Not Started · First Call Done · Follow Up · Unresponsive · Denied · Confirmed · MOU Sent · MOU Signed.

## Routes (`src/App.jsx`)

| Path | Role | Page |
|---|---|---|
| `/login` | public | Login (redirects logged-in users to their home) |
| `/` | any | RootRedirect → `/admin` or `/dashboard` by role |
| `/admin` | admin | Dashboard (index) |
| `/admin/companies` | admin | All Companies (table, inline add/edit/delete, click name → detail) |
| `/admin/allocations` | admin | Allocations (assign/reassign inline) |
| `/admin/team` | admin | Team (member stats, add/remove member) |
| `/admin/add-company` | admin | Add Company (master list only) |
| `/admin/progress` | admin | Progress Board (Table + Kanban "Board" toggle, status pills, follow-up/going-cold flags, click row → detail) |
| `/admin/settings` | admin | Settings |
| `/admin/company/:allocationId` | admin | Company Detail |
| `/dashboard` | member | Dashboard (index — "Up Next" call queue + stats; bottom tab nav on mobile) |
| `/dashboard/companies` | member | My Companies (cards grouped by category) |
| `/dashboard/add-company` | member | Add Company (auto-allocates to self) |
| `/dashboard/settings` | member | Settings |
| `/dashboard/company/:allocationId` | member | Company Detail |
| `*` | — | redirect to `/` |

`ProtectedRoute` (in `components/`) gates by auth + role; unauth → `/login`, wrong role → own home.

## RLS policies (relied upon)

RLS is **on** for all tables. The app assumes these behaviours; manage actual policies in Supabase:

- **profiles** — everyone reads (for member names); a user updates their own row.
  **Admins must be allowed to insert/update any profile** (required by the Team "add member" flow):
  ```sql
  create policy "admins manage profiles" on public.profiles for all to authenticated
  using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') )
  with check ( true );
  ```
- **brands** — readable by all authenticated; writes by admin (and members via Add Company).
- **allocations** — members read/update **only rows where `member_id = auth.uid()`**; admin all.
- **call_logs** — members read/insert only for their own allocations; admin all.

Privacy is enforced **twice**: member queries in `lib/data.js` filter `member_id = user.id`, and RLS
is the server-side backstop. Never weaken RLS to fix a query — fix the query.

## Key design decisions

1. **Status lives on `allocations`; `call_logs` is append-only.** Logging a call (Company Detail or the
   `LogCallSheet`) goes through `logCall()` in `lib/data.js`, which inserts a `call_logs` snapshot **and**
   updates `allocations.status` (so boards/charts stay in sync). The Kanban board's drag-to-change-status
   is the one exception: it calls `updateAllocationStatus()` (status only, no snapshot) as a quick admin
   correction. Un-allocated brands render as "Not Started / Untouched".
2. **Follow-ups drive action.** Each call snapshot can carry `next_follow_up`; the latest one per
   allocation surfaces as a `FollowUpBadge` (amber = due today, red = overdue). `buildCallQueue()` powers
   the member "Up Next" list — due/overdue → "going cold" (in Follow Up, untouched 3+ days) → untouched —
   and the admin Progress Board flags the same signals.
3. **Toasts + optimistic UI.** Writes (log call, Kanban move, palette status-change, settings) update
   local state immediately and confirm with a toast (`useToast()`); failures revert and surface an error toast.
4. **`flattenBrand` (lib/data.js)** collapses a brand + its allocations into one display row carrying
   its primary allocation (`allocationId`, `fest`, `status`, `memberName`). Used across admin tables.
5. **Member creation is client-side and session-isolated.** `makeIsolatedClient()` (persistSession
   off) calls `signUp` so the admin's session isn't replaced, then upserts the `profiles` row. A true
   admin-invite API would need an Edge Function (out of scope). Deleting an auth login must be done in
   the Supabase dashboard — the app only removes the profile + allocations.
6. **Spree-only categories** (`Healthy Snacking`, `Makhana`, `Protein & Nutrition`) can only be
   allocated to the **Spree** fest — enforced in Allocations and the member Add Company form.
7. **Theme is token-driven.** All colours/radii/shadows are `@theme` tokens in `index.css`; components
   use utility classes (`bg-surface`, `text-ink`, `shadow-glow`, `glass`, `gradient-accent`, …).
   Re-skinning = edit tokens, not every component. Status/fest badge colours come from `constants.js`
   and are applied inline (dynamic, so not Tailwind classes).
8. **Secrets:** `VITE_*` keys are public (bundled). The **service-role key must never be `VITE_`-prefixed
   or committed** — it lives in `.env.local` (gitignored) and is read only by the Node scripts.
9. **Responsive app shell.** Desktop uses a hover-expand sidebar rail that **pushes** content via a
   `peer-hover` padding shift on the main column (never overlays it). Members get a fixed `BottomNav`
   tab bar on small screens (≥44px targets); admins get the ⌘K `CommandPalette`. Loading states use the
   `Skeleton*` primitives so "loading" never looks like "empty".

## Run locally

```bash
npm install

# .env  (public — committed values are placeholders only)
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
# .env.local  (secret, gitignored — Node scripts only)
#   SUPABASE_SERVICE_ROLE_KEY=...

node src/seed.js                  # one-time: insert 270 brands (idempotent)
node src/createAdmin.js <email> <password> "<Full Name>"   # create/promote an admin

npm run dev      # http://localhost:5173
npm run build    # production build (must be zero errors)
npm run lint     # eslint (zero errors; seed.js & createAdmin.js are Node-scoped in eslint.config.js)
```

Deployed on **Vercel**: set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel env vars
(do **not** add the service-role key there). For new members, disable "Confirm email" in Supabase
Auth, or they must confirm before first login.

## Conventions

- Data access goes through `lib/data.js` helpers; don't scatter raw Supabase queries in pages.
- Reuse `components/ui.jsx` primitives; match the existing dark/glass styling.
- Keep `npm run build` and `npm run lint` clean before committing.
