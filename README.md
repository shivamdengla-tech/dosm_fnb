# DOSM FnB — BITS Goa Fest Team

A CRM for managing in-kind F&B brand deals across the three BITS Goa fests —
**Waves** (cultural), **Quark** (tech), and **Spree** (sports). Admins run the
master brand list, allocate brands to callers, and track the whole pipeline;
members see only their own brands and log every call.

Built by **Shivam Dengla — FnB Coordinator, DOSM**.

## Stack

React + Vite · Tailwind CSS v4 · Supabase (auth + Postgres + RLS) ·
react-router-dom · recharts · lucide-react. No heavy component library —
components are hand-built.

## Setup

```bash
npm install
```

### Environment

Create two files in the project root:

`.env` (public — bundled into the app):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local` (secret — used only by the seed script, never bundled, gitignored):

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Seed the 270 brands (one-time)

```bash
node src/seed.js
```

Reads `brands.csv`, inserts every brand into the `brands` table using the
service-role key (bypasses RLS). It's idempotent — existing brand names are
skipped, so re-running is safe.

### Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production build
npm run lint
```

## Database

Tables (already created in Supabase, RLS on):

- `profiles(id, full_name, role['admin'|'member'])`
- `brands(id, name, category, fest_tag)`
- `allocations(id, brand_id, member_id, fest, status)`
- `call_logs(id, allocation_id, member_id, poc_name, poc_number, poc_email, status, notes, quantity, skus, delivery_date, stall_space, created_at)`

A brand's pipeline status lives on its **allocation**; each saved call appends a
snapshot row to `call_logs` and syncs `allocations.status`.

## Roles & privacy

- **Admin** → `/admin`: dashboard, all companies, allocations, team, add
  company, progress board, settings. Sees everything.
- **Member** → `/dashboard`: own dashboard, own companies, add company,
  settings. Queries are filtered to `member_id = auth.uid()` in the UI **and**
  must be enforced by RLS server-side.

### Allocation rule

`Healthy Snacking`, `Makhana`, and `Protein & Nutrition` brands can only be
allocated to the **Spree** fest (enforced in the Allocations page and the
member Add-Company form).

## RLS notes (important)

The **Add member** flow (Team page) signs the new user up via a session-isolated
Supabase client (so the admin stays logged in), then upserts their `profiles`
row. For that upsert to succeed, an RLS policy must let admins write profiles —
for example:

```sql
create policy "admins manage profiles"
on public.profiles for all
to authenticated
using   ( exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role = 'admin') )
with check ( true );
```

Also disable **Confirm email** in Supabase → Authentication → Providers → Email
for the temporary-password flow, otherwise new members must confirm before their
first login. Deleting the auth login itself (on member removal) must be done from
the Supabase dashboard — the app only removes the profile + allocations.
