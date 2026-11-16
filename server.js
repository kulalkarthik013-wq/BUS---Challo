// Bus Timings server — v2 (Supabase backend)
//
// This server does ONE job: serve the static site and hand the browser
// its Supabase connection details. All data (stops, buses, routes, trips,
// announcements, analytics) lives in Supabase/Postgres. Reads are public,
// writes require a signed-in Supabase Auth session (admin) — both are
// enforced by Row Level Security policies in supabase/schema.sql, not by
// this server, so there is no custom API or password logic here anymore.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.set('trust proxy', 1); // correct req.ip/protocol behind Vercel/ proxies
const PORT = process.env.PORT || 3000;
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// Security headers on every response.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(),microphone=()');
  // The admin panel's generated markup uses inline onclick handlers
  // throughout (public/js/admin.js). It sits behind Supabase Auth and is
  // noindex, so we allow 'unsafe-inline' for /admin only — public pages
  // keep the strict policy.
  const isAdmin = req.path === '/admin' || req.path === '/admin.html';
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net" + (isAdmin ? " 'unsafe-inline'" : ''),
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '));
  next();
});

// Simple per-IP rate limit (in-memory, sliding 60s window).
const hits = new Map();
const RATE_LIMIT = 300; // requests per minute per IP
app.use((req, res, next) => {
  const now = Date.now(), ip = req.ip || '';
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= RATE_LIMIT) return res.status(429).send('Too many requests — slow down.');
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 60000) hits.delete(k);
  next();
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '\nMissing SUPABASE_URL / SUPABASE_ANON_KEY.\n' +
    'Copy .env.example to .env and fill in your Supabase project values,\n' +
    'then restart. See README.md for the full setup steps.\n'
  );
  process.exit(1);
}

// Gives the browser just the two public, RLS-protected values it needs.
// Never put the service_role key here — that key must never reach a browser.
app.get('/env.js', (req, res) => {
  res.type('application/javascript').send(
    `window.ENV = ${JSON.stringify({ SUPABASE_URL, SUPABASE_ANON_KEY })};`
  );
});

// Dynamic sitemap + robots: built per-request from the real Host header, so
// they are correct on localhost, a preview deploy, AND production with zero
// config. Sitemap also lists every stop page and published blog post, fetched
// from Supabase's public REST API (anon key — same data the site already
// exposes publicly). Cached for 10 minutes.
const reqOrigin = req => `${req.protocol}://${req.get('host')}`;
let sitemapCache = { at: 0, xml: '' };
async function buildSitemap(origin) {
  const pages = [
    ['/', 'hourly', '1.0'], ['/blog', 'weekly', '0.7'], ['/about', 'monthly', '0.5'],
    ['/faq', 'monthly', '0.5'], ['/contact', 'monthly', '0.5'],
    ['/privacy', 'yearly', '0.3'], ['/terms', 'yearly', '0.3'], ['/cookies', 'yearly', '0.3'],
  ];
  const urls = pages.map(([p, cf, pr]) => ({ loc: origin + p, changefreq: cf, priority: pr }));
  try {
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
    const [stops, posts] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/stops?select=slug&order=name&limit=5000`, { headers: h }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=slug&published=eq.true&order=created_at.desc`, { headers: h }).then(r => r.json()),
    ]);
    (Array.isArray(stops) ? stops : []).forEach(s => urls.push({ loc: `${origin}/s/${encodeURIComponent(s.slug)}`, changefreq: 'hourly', priority: '0.8' }));
    (Array.isArray(posts) ? posts : []).forEach(p => urls.push({ loc: `${origin}/blog/${encodeURIComponent(p.slug)}`, changefreq: 'weekly', priority: '0.6' }));
  } catch (e) { /* Supabase unreachable — static pages still listed */ }
  const body = urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
app.get('/sitemap.xml', async (req, res) => {
  if (Date.now() - sitemapCache.at > 600000) {
    sitemapCache = { at: Date.now(), xml: await buildSitemap(reqOrigin(req)) };
  }
  res.type('application/xml').send(sitemapCache.xml);
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${reqOrigin(req)}/sitemap.xml\n`);
});

app.use(express.static(path.join(__dirname, 'public')));

// Browsers auto-request /favicon.ico — serve the PNG icon for it.
app.get('/favicon.ico', (req, res) => {
  res.type('image/png').sendFile(path.join(__dirname, 'public', 'favicon-32.png'));
});

// Pretty stop links: /s/neermarga -> public/index.html (slug is read from the URL client-side)
app.get('/s/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pretty legal-page links: /privacy -> public/privacy.html (files also reachable directly)
const legalPages = {
  '/privacy': 'privacy.html',
  '/terms': 'terms.html',
  '/cookies': 'cookies.html',
  '/faq': 'faq.html',
  '/contact': 'contact.html',
  '/about': 'about.html',
};
for (const [route, file] of Object.entries(legalPages)) {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Blog: /blog lists posts, /blog/<slug> shows one post (slug read client-side)
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

// Local dev listens here; on Vercel the exported app is served serverlessly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Bus Timings running on http://localhost:${PORT}  (admin: /admin)`);
  });
}
module.exports = app;
