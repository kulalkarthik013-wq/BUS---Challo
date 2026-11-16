# Mangaluru Bus Timings

A free, live bus-arrival site for Mangaluru commuters. Visitors search a bus
stop (or plan a From → To journey) and see scheduled arrival times, bus names,
registration numbers, routes and destinations — plus QR codes at stops for
instant lookup. An admin panel manages all the data.

**Stack:** Node.js + Express (static server) · Supabase (Postgres + Auth +
Storage + Row Level Security) · vanilla JS frontend · installable PWA ·
English / Kannada / Hindi UI.

## Features

**Public site**
- Search by stop, or From → To journey planner, with autocomplete
- Live "time to next bus" per stop (IST), favorites & recent stops
  (`locallocalStorage`, per visitor)
- Today / Tomorrow schedules, printable per-stop timetable
- Service-alert badges (delayed / cancelled / detour), announcement
  banner & popup, maintenance-mode countdown page
- QR deep links (`/s/<slug>?src=qr`), PWA offline app-shell
- Language picker: English, Kannada, Hindi — remembered per visitor
- SEO: dynamic sitemap/robots (real domain, all stops + blog posts),
  canonical + Open Graph + Twitter cards, real PNG favicons & OG image

**Admin panel (`/admin`)**
- Tabs: Dashboard · Stops · Buses · Routes · Trips & times · Announcements ·
  Blog · Analytics · Activity log · Settings
- Stops: bulk paste, CSV import, per-stop QR + printable QR sheet; slugs are
  permanent so printed QR codes never break
- Buses: name, registration, photo upload to Supabase Storage
- Routes: named ordered stop lists (seeded with 100 Mangaluru routes)
- Trips: one scheduled run with per-stop times, day-of-week and date-range
  restrictions, bulk paste, CSV export
- Announcements: banner or popup, toggle without deleting
- Maintenance mode with countdown + custom visitor message
- Service alerts per route
- Blog: title/slug/excerpt/cover/body/published — feeds public `/blog`
- Analytics: page views, QR scans, From→To searches (today/7d/30d/all),
  bar chart, top stops/routes
- Activity log: every admin add/edit/delete with email + timestamp
- Settings: contact email + WhatsApp number (enables the floating
  WhatsApp button and the Contact page details)

## One-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
   (free tier is enough).
2. **Run the schema.** Dashboard → SQL Editor → paste
   `supabase/schema.sql` → Run. Creates all tables, RLS policies and the
   `bus-photos` + `blog-covers` storage buckets. Safe to re-run.
   - If the bucket insert errors, create `bus-photos` manually (Storage →
     New bucket → Public) and re-run the `storage.objects` policies.
3. **Seed data (optional).**
   - `supabase/seed.sql` — the original 5-stop demo dataset (fresh DBs only).
   - `supabase/routes-seed.sql` — **100 real Mangaluru bus routes with
     ~183 stops** in order. Run this to populate Routes + Stops.
4. **Create admin account(s).** Authentication → Users → Add user
   (email + password). There is no public sign-up — intentional.
5. **Copy API keys.** Project Settings → API → **Project URL** and
   **anon public key** (never the `service_role` key).
6. **Configure & run.**
   ```bash
   npm install
   cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_ANON_KEY
   npm start              # http://localhost:3000  (admin: /admin)
   ```

## Deploy to Vercel

`vercel.json` routes every request through `server.js` (without it Vercel
serves `public/` statically and `/env.js` 404s — the classic "admin login
does nothing" bug). `server.js` exports the Express app for the serverless
runtime and only calls `.listen()` locally.

1. Import the repo in Vercel.
2. Project Settings → Environment Variables → add `SUPABASE_URL` and
   `SUPABASE_ANON_KEY`.
3. Deploy. `/sitemap.xml` and `/robots.txt` pick up the real domain
automatically.

## Project structure

```
server.js               Express: static files, /env.js, pretty routes,
                        security headers + CSP, rate limit, dynamic
                        sitemap/robots
vercel.json             Routes all traffic through server.js on Vercel
supabase/
  schema.sql            Tables, RLS policies, storage buckets — run first
  seed.sql              Optional demo data (fresh DB)
  routes-seed.sql       100 real routes + ~183 stops (generated)
scripts/
  translate-i18n.js     Fill missing lang.js keys via MyMemory API
  gen-routes-seed.js    Regenerate routes-seed.sql from route data
public/
  index.html            Public site (/, /s/<slug>)
  admin.html            Admin panel (/admin)
  blog.html             Blog list · blog-post.html single post
  about/contact/faq/privacy/terms/cookies/404.html
  style.css             Indigo/cyan palette, dark mode, responsive
  sw.js                 PWA service worker (per-URL page caching)
  manifest.webmanifest  PWA manifest
  js/
    shared.js           Supabase client, helpers, theme toggle
    site.js             Public site logic (search, ETAs, journeys)
    admin.js            Admin panel logic (all tabs)
    lang.js             EN/KN/HI dictionaries + picker + prompt
    blog.js             Public blog rendering
    contact.js          Contact page settings lookup
    footer.js           Shared footer + canonical/OG urls
    cookies.js          Cookie-consent banner
    theme-init.js       Pre-paint theme bootstrap (external — CSP-safe)
```

## Security model

- **RLS is the authorization layer** — the anon key is public by design;
  it only grants what the policies allow (public reads, analytics
  inserts, nothing else).
- **Admin = any signed-in Supabase Auth user.** Fine for a small trusted
  team; for roles later, add an `admin_profiles` table.
- `/env.js` exposes only URL + anon key. `service_role` never ships.
- CSP: strict `script-src 'self'` on public pages (no inline handlers);
  `/admin` allows `'unsafe-inline'` because its generated UI uses inline
  handlers — it's auth-gated and `noindex`.
- All user-entered text is HTML-escaped; blog bodies are plain text.
- Rate limit: 300 req/min per IP (in-memory).

## Known limits

- Language picker translates site chrome, not admin-entered content
  (stop names, announcements, blog posts).
- Blog bodies are plain text (line breaks kept), not rich HTML — avoids
  XSS from unescaped admin input.
- Analytics are raw events; on a busy site add a rollup job later.
- Kannada/Hindi strings are machine-translated — worth a native review.
