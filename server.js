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
const PORT = process.env.PORT || 3000;
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// Security headers on every response.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(),microphone=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net",
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

app.use(express.static(path.join(__dirname, 'public')));

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
};
for (const [route, file] of Object.entries(legalPages)) {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.listen(PORT, () => {
  console.log(`Bus Timings running on http://localhost:${PORT}  (admin: /admin)`);
});
