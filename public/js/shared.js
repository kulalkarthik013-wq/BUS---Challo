// Shared across index.html and admin.html.
// window.ENV is injected by the server at /env.js (see server.js).
const supabase = window.supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const slugify = n => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid();

const toMins = hms => { const [h, m] = hms.split(':'); return (+h) * 60 + (+m); };
const nowMinsIST = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  return (+parts.find(p => p.type === 'hour').value % 24) * 60 + (+parts.find(p => p.type === 'minute').value);
};
const fmtClock = mins => {
  const h = Math.floor(mins / 60) % 24;
  return [`${h % 12 || 12}:${String(mins % 60).padStart(2, '0')}`, h < 12 ? 'AM' : 'PM'];
};
const fmtEta = diff => diff <= 0 ? 'Arriving now' : diff < 60 ? `in ${diff} min` : `in ${Math.floor(diff / 60)} h${diff % 60 ? ' ' + (diff % 60) + ' min' : ''}`;
const fmtDur = m => m < 60 ? m + ' min' : Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '');

// ---- dark/light theme (manual override beats prefers-color-scheme)
const THEME_ICONS = {
  light: '<svg viewBox="0 0 24 24"><path d="M20 13A8 8 0 1 1 11 4a6.5 6.5 0 0 0 9 9z"/></svg>',
  dark: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
};
function effectiveTheme() {
  return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function toggleTheme() {
  const t = effectiveTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('bt-theme', t);
  document.documentElement.dataset.theme = t;
  document.querySelectorAll('#themeBtn').forEach(b => { b.innerHTML = THEME_ICONS[t]; });
}
document.querySelectorAll('#themeBtn').forEach(b => { b.innerHTML = THEME_ICONS[effectiveTheme()]; });
// Delegated click handler — inline onclick is blocked by CSP on public pages.
document.addEventListener('click', e => { if (e.target.closest('#themeBtn')) toggleTheme(); });

// ---- IST date helpers for special/holiday schedules
const IST_DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function istToday() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date());
  return { date, dow: IST_DAYS[weekday] };
}
function tripActiveToday(t) {
  const d = istToday();
  if (t.active_from && t.active_from > d.date) return false;
  if (t.active_to && t.active_to < d.date) return false;
  if (Array.isArray(t.days_of_week) && t.days_of_week.length && !t.days_of_week.includes(d.dow)) return false;
  return true;
}

// Fire-and-forget analytics logging — never blocks or breaks the UI if it fails.
function logEvent(eventType, fields = {}) {
  supabase.from('analytics_events').insert({ event_type: eventType, ...fields }).then(() => {}, () => {});
}
