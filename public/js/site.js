const app = document.getElementById('app');
let STOPS = [], BUSES = {}, ROUTES = {}, TRIPS = [];
let homeTab = 'stop', dayTab = 'today', showMore = false, qStop = '', qFrom = '', qTo = '';
let MAINT = null; // { until: ISO string, message: string|null } from site_settings
let CONTACT = null; // { email, whatsapp } from site_settings key 'contact'
let NEXT = {};    // stop_id -> minutes until next arrival (today)
let NEXTD = {};   // stop_id -> { mins, bus, route, stop, to, stopSlug } next arrival detail
let LIVE = [];    // soonest arrivals across all stops
let ALERTS = {};  // route_id -> { kind, message } active service alerts

const P = new URLSearchParams(location.search);
const stopFromPath = (location.pathname.match(/^\/s\/([^/?#]+)/) || [])[1];
const currentSlug = P.get('stop') || (stopFromPath && decodeURIComponent(stopFromPath));
const favOnly = P.get('fav') === '1';

const pinIcon = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const arrowIcon = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const swapIcon = '<svg viewBox="0 0 24 24"><path d="M7 10l-3 3 3 3M4 13h16M17 14l3-3-3-3M20 11H4"/></svg>';
const chevDown = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const chevUp = '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>';
const starIcon = '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></svg>';

// ---- favorites + recent searches (localStorage, per visitor)
const FAV_KEY = 'bt-favs', REC_KEY = 'bt-recent';
const getFavs = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } };
const getRecents = () => { try { return JSON.parse(localStorage.getItem(REC_KEY)) || []; } catch { return []; } };
function saveJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function toggleFav(slug) {
  const f = getFavs(), i = f.indexOf(slug);
  if (i > -1) f.splice(i, 1); else f.push(slug);
  saveJson(FAV_KEY, f);
  refreshFavUI(slug);
}
function pushRecent(slug, name) {
  const r = getRecents().filter(x => x.slug !== slug);
  r.unshift({ slug, name });
  saveJson(REC_KEY, r.slice(0, 6));
}
function refreshFavUI(slug) {
  const on = getFavs().includes(slug);
  document.querySelectorAll(`[data-fav="${slug}"]`).forEach(b => {
    b.classList.toggle('on', on);
    b.title = (on ? 'Remove from' : 'Add to') + ' favorites';
    b.setAttribute('aria-label', b.title);
  });
  const l = document.getElementById('list');
  if (l && document.getElementById('q')) l.innerHTML = stopResultsHtml();
}

// ---------------------------------------------------------------- data load
async function loadData() {
  const [{ data: stops }, { data: buses }, { data: routes }, { data: trips }, { data: settings }, { data: contact }, { data: alerts }] = await Promise.all([
    supabase.from('stops').select('id, slug, name').order('name'),
    supabase.from('buses').select('id, name, reg, photo_url'),
    supabase.from('routes').select('id, code, name'),
    supabase.from('trips').select('id, bus_id, route_id, active_from, active_to, days_of_week, trip_stops(stop_id, sequence, time)'),
    supabase.from('site_settings').select('value').eq('key', 'maintenance').maybeSingle(),
    supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle(),
    supabase.from('service_alerts').select('route_id, kind, message').eq('active', true),
  ]);
  STOPS = stops || [];
  BUSES = Object.fromEntries((buses || []).map(b => [b.id, b]));
  ROUTES = Object.fromEntries((routes || []).map(r => [r.id, r]));
  TRIPS = (trips || []).filter(tripActiveToday).map(t => ({ ...t, trip_stops: [...t.trip_stops].sort((a, b) => a.sequence - b.sequence) }));
  MAINT = (settings && settings.value) || null;
  CONTACT = (contact && contact.value) || null;
  ALERTS = {};
  (alerts || []).forEach(a => { if (!ALERTS[a.route_id]) ALERTS[a.route_id] = a; });
  const n0 = nowMinsIST();
  NEXT = {}; NEXTD = {};
  TRIPS.forEach(t => {
    const last = t.trip_stops[t.trip_stops.length - 1];
    t.trip_stops.forEach(e => {
      const d = toMins(e.time) - n0;
      if (d < -2) return;
      if (NEXT[e.stop_id] === undefined || d < NEXT[e.stop_id]) NEXT[e.stop_id] = d;
      if (!NEXTD[e.stop_id] || d < NEXTD[e.stop_id].mins) {
        const s = STOPS.find(x => x.id === e.stop_id);
        NEXTD[e.stop_id] = { mins: d, bus: BUSES[t.bus_id] || { name: 'Bus', reg: '' }, route: ROUTES[t.route_id], stop: stopName(e.stop_id), to: stopName(last.stop_id), stopSlug: s ? s.slug : '' };
      }
    });
  });
  LIVE = Object.values(NEXTD).sort((a, b) => a.mins - b.mins).slice(0, 6);
}

const stopName = id => (STOPS.find(s => s.id === id) || {}).name || '?';

// ------------------------------------------------------------- arrivals
function arrivalsAt(stopId) {
  const out = [];
  TRIPS.forEach(t => {
    const i = t.trip_stops.findIndex(e => e.stop_id === stopId);
    if (i === -1) return;
    const last = t.trip_stops[t.trip_stops.length - 1];
    out.push({
      mins: toMins(t.trip_stops[i].time),
      bus: BUSES[t.bus_id] || { name: 'Bus', reg: '' },
      route: ROUTES[t.route_id],
      to: i === t.trip_stops.length - 1 ? null : stopName(last.stop_id),
    });
  });
  return out.sort((a, b) => a.mins - b.mins);
}

function journeys(fromId, toId) {
  const out = [];
  TRIPS.forEach(t => {
    const fi = t.trip_stops.findIndex(e => e.stop_id === fromId);
    const ti = t.trip_stops.findIndex(e => e.stop_id === toId);
    if (fi > -1 && ti > -1 && fi < ti) {
      out.push({
        bus: BUSES[t.bus_id] || { name: 'Bus', reg: '' },
        route: ROUTES[t.route_id],
        dep: toMins(t.trip_stops[fi].time),
        arr: toMins(t.trip_stops[ti].time),
        stops: ti - fi + 1,
      });
    }
  });
  return out.sort((a, b) => a.dep - b.dep);
}

// ------------------------------------------------------------------ cards
function busPhoto(bus) {
  return bus.photo_url ? `<img class="buspic img" src="${esc(bus.photo_url)}" alt="${esc(bus.name)}" title="Tap to view photo">` : `<span class="buspic placeholder">${esc((bus.name || '?')[0])}</span>`;
}
// Full-view photo popup (lightbox)
function openLightbox(src, name) {
  const el = document.getElementById('lightbox');
  el.innerHTML = `<div class="box wide"><img src="${esc(src)}" alt="${esc(name || 'Bus')}"><p class="cap">${esc(name || '')}</p><button class="btn btn-s" style="width:100%;margin-top:12px">Close</button></div>`;
  el.querySelector('button').addEventListener('click', closeLightbox);
  el.classList.add('on');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('on'); }
const alertBadge = route => {
  const al = route && ALERTS[route.id];
  if (!al) return '';
  const label = al.kind === 'cancelled' ? 'Cancelled' : al.kind === 'detour' ? 'Detour' : 'Delayed';
  return `<span class="badge al-${esc(al.kind)}" title="${esc(al.message || '')}">⚠ ${label}</span>`;
};
function arrivalCard(a, nowMins, first, eta) {
  const diff = a.mins - nowMins;
  const [ct, ap] = fmtClock(a.mins);
  return `<article class="bus${first ? ' first' : ''}">
    ${busPhoto(a.bus)}
    <div class="tm"><b>${ct}</b><span>${ap}</span></div>
    <div class="info">
      <span class="badge${!eta && diff <= 2 ? ' soon' : ''}">${eta || fmtEta(diff)}</span>${alertBadge(a.route)}
      <div class="nm">${esc(a.bus.name)} ${a.bus.reg ? `<span class="tag">${esc(a.bus.reg)}</span>` : ''} ${a.route ? `<span class="tag route">Route ${esc(a.route.code)}</span>` : ''}</div>
      <div class="to">${a.to ? t('towards') + ' ' + esc(a.to) : t('endsHere')}</div>
    </div></article>`;
}
function journeyCard(j, nowMins, first) {
  const [dt, dap] = fmtClock(j.dep), [at, aap] = fmtClock(j.arr);
  const diff = j.dep - nowMins;
  return `<article class="bus journey${first ? ' first' : ''}">
    ${busPhoto(j.bus)}
    <div class="info">
      <span class="badge${diff <= 2 && diff >= -5 ? ' soon' : ''}">${diff >= -5 ? fmtEta(Math.max(diff, 0)) : t('depart')}</span>${alertBadge(j.route)}
      <div class="nm">${esc(j.bus.name)} ${j.bus.reg ? `<span class="tag">${esc(j.bus.reg)}</span>` : ''} ${j.route ? `<span class="tag route">Route ${esc(j.route.code)}</span>` : ''}</div>
      <div class="to journey-times"><b>${dt} ${dap}</b> ${arrowIcon} <b>${at} ${aap}</b></div>
      <div class="meta">${t('stopCountInRoute', { n: j.stops })} · ${fmtDur(j.arr - j.dep)}</div>
    </div></article>`;
}

// --------------------------------------------------------------- home tab
const etaText = id => NEXT[id] === undefined ? '' : NEXT[id] <= 0 ? 'Now' : fmtEta(NEXT[id]);
const favBtn = s => `<button class="favbtn${getFavs().includes(s.slug) ? ' on' : ''}" data-fav="${esc(s.slug)}" title="${getFavs().includes(s.slug) ? 'Remove from' : 'Add to'} favorites" aria-label="Favorite ${esc(s.name)}">${starIcon}</button>`;
function stopListHtml(list) {
  if (!list.length) return `<div class="empty"><b>No stops found</b><p>Try a different spelling.</p></div>`;
  return `<ul class="list">${list.map(s => `<li class="srow">
    <a class="item" href="/s/${encodeURIComponent(s.slug)}"><span class="pin">${pinIcon}</span><b>${esc(s.name)}</b>${etaText(s.id) ? `<span class="eta">${etaText(s.id)}</span>` : ''}<span class="chev">&rsaquo;</span></a>
    ${favBtn(s)}</li>`).join('')}</ul>`;
}
function filteredStops(q) {
  return STOPS.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
}
function stopSection(title, list) {
  return list.length ? `<h2 class="sec-title">${title}</h2>${stopListHtml(list)}` : '';
}
function stopResultsHtml() {
  const favs = getFavs().map(sl => STOPS.find(s => s.slug === sl)).filter(Boolean);
  if (favOnly) {
    return `<h2 class="sec-title">${t('favsTitle')}</h2>` + (favs.length
      ? stopListHtml(favs)
      : `<div class="empty"><b>${t('noFavs')}</b><p>${t('noFavsSub')}</p></div>`);
  }
  if (qStop.trim()) {
    const list = filteredStops(qStop);
    return `<h2 class="sec-title">${list.length === 1 ? t('resultsCount', { n: list.length }) : t('resultsCountP', { n: list.length })}</h2>` + stopListHtml(list);
  }
  const recents = getRecents().map(r => STOPS.find(s => s.slug === r.slug)).filter(Boolean);
  let h = '';
  if (recents.length) h += `<h2 class="sec-title">${t('recent')}</h2><div class="chips">${recents.map(s => `<a class="chip" href="/s/${encodeURIComponent(s.slug)}">${esc(s.name)}</a>`).join('')}</div>`;
  h += stopSection(t('favStops'), favs);
  h += `<h2 class="sec-title">${STOPS.length} ${t('allStopsWord')}</h2>` + stopListHtml(STOPS);
  return h;
}
function drawAC() {
  let ac = document.getElementById('ac');
  const q = qStop.trim(), box = document.querySelector('.search');
  const m = q.length >= 1 ? filteredStops(qStop).slice(0, 6) : [];
  if (!m.length || !box) { if (ac) ac.remove(); return; }
  if (!ac) { ac = document.createElement('div'); ac.id = 'ac'; ac.className = 'ac'; box.appendChild(ac); }
  ac.innerHTML = m.map(s => `<button type="button" data-ac="${esc(s.slug)}" data-name="${esc(s.name)}"><span class="ac-dot"></span>${esc(s.name)}${etaText(s.id) ? `<span class="eta">${etaText(s.id)}</span>` : ''}</button>`).join('');
}
function liveSection() {
  if (!LIVE.length) return '';
  const n = nowMinsIST();
  return `<h2 class="sec-title" id="live">${t('liveArrivals')}</h2><div class="live-list">${LIVE.map(a => {
    const [t, ap] = fmtClock(a.mins), diff = a.mins - n;
    return `<a class="live-item" href="/s/${encodeURIComponent(a.stopSlug)}">
      ${busPhoto(a.bus)}
      <span class="lt"><b>${t} ${ap}</b><span>${diff <= 0 ? 'Now' : fmtEta(diff)}</span></span>
      <span class="linfo"><b>${esc(a.bus.name)}</b><span>at ${esc(a.stop)} → ${esc(a.to)}</span></span>${alertBadge(a.route)}</a>`;
  }).join('')}</div>`;
}
function routesSection() {
  const rs = Object.values(ROUTES);
  if (!rs.length) return '';
  const counts = {};
  TRIPS.forEach(t => { if (t.route_id) counts[t.route_id] = (counts[t.route_id] || 0) + 1; });
  return `<h2 class="sec-title" id="routes">${t('routes')}</h2><div class="chips">${rs.map(r => `<span class="chip">Route ${esc(r.code)}${r.name ? ' · ' + esc(r.name) : ''} · ${t('tripsCount', { n: counts[r.id] || 0 })}</span>`).join('')}</div>`;
}
function stopSearchView() {
  return `<div class="search sticky"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
    <input id="q" type="search" value="${esc(qStop)}" placeholder="${favOnly ? t('phFavStop') : t('phStop')}" autocomplete="off"></div>
   ${liveSection()}
   ${routesSection()}
   <div id="list">${stopResultsHtml()}</div>`;
}
function fromToView() {
  return `<datalist id="stopdl">${STOPS.map(s => `<option value="${esc(s.name)}">`).join('')}</datalist>
  <div class="ft-row">
    <div class="ft-field"><label>From</label><input id="ftFrom" list="stopdl" class="input" value="${esc(qFrom)}" placeholder="Starting stop" autocomplete="off"></div>
    <button class="btn-swap" id="ftSwap" title="Swap stops" aria-label="Swap from and to">${swapIcon}</button>
    <div class="ft-field"><label>To</label><input id="ftTo" list="stopdl" class="input" value="${esc(qTo)}" placeholder="Destination stop" autocomplete="off"></div>
  </div>
  <button class="btn btn-p ft-go" id="ftGo">${t('findBuses')}</button>
  <div id="ftResults" class="mt2"></div>`;
}
function renderFtResults() {
  const box = document.getElementById('ftResults');
  if (!box) return;
  const from = STOPS.find(s => s.name.toLowerCase() === qFrom.trim().toLowerCase());
  const to = STOPS.find(s => s.name.toLowerCase() === qTo.trim().toLowerCase());
  if (!qFrom && !qTo) { box.innerHTML = ''; return; }
  if (!from || !to) { box.innerHTML = `<div class="empty"><b>${t('pickTwo')}</b><p>${t('pickTwoSub')}</p></div>`; return; }
  if (from.id === to.id) { box.innerHTML = `<div class="empty"><b>${t('pickDiff')}</b></div>`; return; }
  const n = nowMinsIST();
  const js = journeys(from.id, to.id);
  logEvent('search', { from_stop_id: from.id, to_stop_id: to.id });
  if (!js.length) { box.innerHTML = `<div class="empty"><b>${t('noDirect')}</b><p>${t('noDirectSub', { from: esc(from.name), to: esc(to.name) })}</p></div>`; return; }
  const upcoming = js.filter(j => j.dep >= n - 5);
  const list = upcoming.length ? upcoming : js;
  box.innerHTML = `<h2 class="sec-title">${esc(from.name)} &rarr; ${esc(to.name)}</h2>${list.map((j, i) => journeyCard(j, n, i === 0)).join('')}`;
}

function homeView() {
  return `<section class="hero-home">
    <div class="art"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M8 21v-4M16 21v-4M8 14.5h.01M16 14.5h.01M9 7l2 2-2 2M13 7l2 2-2 2"/></svg></div>
    <h1 data-i18n="heroTitle">${t('heroTitle')}</h1>
    <p data-i18n="heroSub">${t('heroSub')}</p>
  </section>
  <div class="seg" role="tablist" aria-label="Search mode">
    <button data-hometab="stop" class="${homeTab === 'stop' ? 'on' : ''}" title="Search by a single stop">${t('byStop')}</button>
    <button data-hometab="route" class="${homeTab === 'route' ? 'on' : ''}" title="Search by starting point and destination">${t('byRoute')}</button>
  </div>
  <div id="homeBody" class="mt2">${homeTab === 'stop' ? stopSearchView() : fromToView()}</div>`;
}

// --------------------------------------------------------------- stop page
function stopPageView(s) {
  const n = nowMinsIST(), all = arrivalsAt(s.id);
  const [nt, ap] = fmtClock(n);
  const head = `<a class="back" href="/">&lsaquo; ${t('allStops')}</a>
  <section class="hero"><small>${t('busStop')}</small><h1>${esc(s.name)}</h1><button class="favbtn hero-fav${getFavs().includes(s.slug) ? ' on' : ''}" data-fav="${esc(s.slug)}" title="${getFavs().includes(s.slug) ? 'Remove from' : 'Add to'} favorites" aria-label="Favorite ${esc(s.name)}">${starIcon}</button><div class="now"><span class="dot"></span>${t('now')} <b>${nt} ${ap}</b></div></section>
  <div class="seg" role="group" aria-label="Day">${[['today', t('today')], ['tomorrow', t('tomorrow')]].map(([k, l]) => `<button data-day="${k}" class="${dayTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;

  if (dayTab === 'tomorrow') {
    return head + `<h2 class="sec-title">${t('tomorrowSched')}</h2>` +
      (all.length
        ? all.map((a, i) => arrivalCard(a, n, i === 0, t('tomorrow'))).join('')
        : `<div class="empty"><b>${t('noBusesTomorrow')}</b><p>${t('noBusesTomorrowSub')}</p></div>`) +
      `<p class="note">${t('schedNote')}</p>`;
  }

  const today = all.filter(a => a.mins >= n - 2);
  const nextHour = today.filter(a => a.mins <= n + 60);
  const soon30 = today.filter(a => a.mins <= n + 30);
  const later = today.filter(a => a.mins > n + 60);
  const cards = list => list.map((a, i) => arrivalCard(a, n, i === 0)).join('');

  return head +
    `<h2 class="sec-title">${t('nextHour')}</h2>` +
    (nextHour.length
      ? cards(nextHour)
      : `<div class="empty"><b>${t('noBusesHour')}</b><p>${later.length ? t('noBusesHourSub') : t('noBusesAtAll')}</p></div>`) +
    `<button class="more-toggle" data-more aria-expanded="${showMore}"><span>${showMore ? t('showLess') : t('showMore')}</span>${showMore ? chevUp : chevDown}</button>` +
    (showMore ? `
      <h2 class="sec-title">${t('next30')}</h2>` +
      (soon30.length
        ? cards(soon30)
        : `<div class="empty"><b>${t('noBusesNow')}</b><p>${t('noBusesNowSub')}</p></div>`) +
      `<h2 class="sec-title">${t('laterToday')}</h2>` +
      (later.length ? cards(later) : `<div class="empty"><b>${t('noMoreToday')}</b><p>${t('noMoreTodaySub')}</p></div>`)
    : '') +
    `<p class="note">${t('schedNote')}</p>
    <div class="row" style="justify-content:center;margin-top:8px"><button class="btn btn-s btn-sm" id="printBtn"><svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg> ${t('printSchedule')}</button></div>`;
}

// ---------------------------------------------------------- print timetable
function printTimetable(s) {
  const all = arrivalsAt(s.id);
  const rows = all.map(a => {
    const [t, ap] = fmtClock(a.mins);
    return `<tr><td>${t} ${ap}</td><td>${esc(a.bus.name)}</td><td>${esc(a.bus.reg || '—')}</td><td>${a.route ? 'Route ' + esc(a.route.code) : '—'}</td><td>${a.to ? 'Towards ' + esc(a.to) : '—'}</td></tr>`;
  }).join('');
  const pa = document.createElement('div');
  pa.className = 'print-area';
  pa.innerHTML = `<h1>${esc(s.name)} — Bus schedule</h1>
    <p class="pmeta">Printed ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} · Scheduled times, subject to traffic.</p>
    <table><thead><tr><th>Time</th><th>Bus</th><th>Reg</th><th>Route</th><th>Towards</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No services scheduled</td></tr>'}</tbody></table>`;
  document.body.appendChild(pa);
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); pa.remove(); };
  window.addEventListener('afterprint', done, { once: true });
  setTimeout(() => window.print(), 60);
}

// ---------------------------------------------------------- maintenance mode
function maintenanceActive() {
  return !!(MAINT && MAINT.until && new Date(MAINT.until).getTime() > Date.now());
}
function maintenanceView() {
  const msg = (MAINT && MAINT.message) || t('maintDefault');
  app.innerHTML = `<div class="maint"><div class="card" style="max-width:420px;margin:48px auto 0;text-align:center">
    <span class="logo" style="margin:0 auto 14px;width:52px;height:52px;border-radius:16px"><svg viewBox="0 0 24 24" style="width:26px;height:26px"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg></span>
    <h1 class="title" style="font-size:24px">${t('backSoon')}</h1>
    <p class="sub mt" style="font-size:15px;line-height:1.55">${esc(msg)}</p>
    <div id="maintCount" class="maint-count"></div>
    <p class="note" style="margin-top:18px">${t('maintNote')}</p>
  </div></div>`;
  tickMaint();
}
function tickMaint() {
  const el = document.getElementById('maintCount');
  if (!el || !MAINT || !MAINT.until) return;
  const ms = new Date(MAINT.until).getTime() - Date.now();
  if (ms <= 0) { MAINT = null; render(); return; }
  const mins = Math.ceil(ms / 60000);
  const txt = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h${mins % 60 ? ' ' + (mins % 60) + ' min' : ''}`;
  el.innerHTML = `${t('maintBackIn')} <b>${txt}</b>`;
}

// ----------------------------------------------------------------- render
function render() {
  if (maintenanceActive()) return maintenanceView();
  if (!STOPS.length && !currentSlug) { /* still render empty state below */ }
  if (currentSlug) {
    const s = STOPS.find(x => x.slug === currentSlug);
    app.innerHTML = s ? stopPageView(s) : `<a class="back" href="/">&lsaquo; ${t('allStops')}</a><div class="empty"><b>${t('stopNotFound')}</b><p>${t('stopNotFoundSub')}</p></div>`;
  } else {
    app.innerHTML = homeView();
  }
}

app.addEventListener('click', e => {
  const pic = e.target.closest('.buspic');
  if (pic && pic.tagName === 'IMG') { openLightbox(pic.getAttribute('src'), pic.getAttribute('alt')); return; }
  if (e.target.id === 'lightbox') { closeLightbox(); return; }
  const fv = e.target.closest('[data-fav]');
  if (fv) { e.preventDefault(); toggleFav(fv.dataset.fav); return; }
  const ac = e.target.closest('[data-ac]');
  if (ac) { location.href = '/s/' + encodeURIComponent(ac.dataset.ac); return; }
  if (e.target.id === 'printBtn') { const s = STOPS.find(x => x.slug === currentSlug); if (s) printTimetable(s); return; }
  const dayBtn = e.target.closest('[data-day]');
  if (dayBtn) { dayTab = dayBtn.dataset.day; showMore = false; render(); return; }
  if (e.target.closest('[data-more]')) { showMore = !showMore; render(); return; }
  const tabBtn = e.target.closest('[data-hometab]');
  if (tabBtn) { homeTab = tabBtn.dataset.hometab; render(); return; }
  if (e.target.id === 'ftSwap') { [qFrom, qTo] = [qTo, qFrom]; render(); setTimeout(renderFtResults, 0); return; }
  if (e.target.id === 'ftGo') { qFrom = document.getElementById('ftFrom').value; qTo = document.getElementById('ftTo').value; renderFtResults(); return; }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

app.addEventListener('mousedown', e => {
  const ac = e.target.closest('[data-ac]');
  if (ac) { e.preventDefault(); location.href = '/s/' + encodeURIComponent(ac.dataset.ac); }
});
app.addEventListener('input', e => {
  if (e.target.id === 'q') { qStop = e.target.value; document.getElementById('list').innerHTML = stopResultsHtml(); drawAC(); }
  // Keep From/To values in sync so the periodic re-render doesn't wipe
  // what the visitor is typing (and the datalist keeps working).
  if (e.target.id === 'ftFrom') qFrom = e.target.value;
  if (e.target.id === 'ftTo') qTo = e.target.value;
});
app.addEventListener('focusin', e => { if (e.target.id === 'q') drawAC(); });
app.addEventListener('focusout', e => { if (e.target.id === 'q') setTimeout(() => { const ac = document.getElementById('ac'); if (ac) ac.remove(); }, 150); });

// ------------------------------------------------------------ announcements
async function loadAnnouncements() {
  const { data } = await supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false });
  if (!data || !data.length) return;
  const banner = data.find(a => a.display_type === 'banner');
  const popup = data.find(a => a.display_type === 'popup');
  if (banner && sessionStorage.getItem('dismissed-banner-' + banner.id) !== '1') {
    const el = document.getElementById('banner');
    el.innerHTML = `<div class="in"><span>${esc(banner.message)}</span><button aria-label="Dismiss announcement">&times;</button></div>`;
    el.querySelector('button').addEventListener('click', () => { el.classList.remove('on'); sessionStorage.setItem('dismissed-banner-' + banner.id, '1'); });
    el.classList.add('on');
  }
  if (popup && sessionStorage.getItem('seen-popup-' + popup.id) !== '1') {
    const el = document.getElementById('popupModal');
    el.innerHTML = `<div class="box"><h3>${t('announcement')}</h3><p>${esc(popup.message)}</p><button class="btn btn-p" style="width:100%">${t('gotIt')}</button></div>`;
    el.querySelector('button').addEventListener('click', () => el.classList.remove('on'));
    el.classList.add('on');
    sessionStorage.setItem('seen-popup-' + popup.id, '1');
  }
}

// ----------------------------------------------------------------- analytics
function logPageView() {
  const stop = STOPS.find(x => x.slug === currentSlug);
  if (stop) {
    logEvent('view', { stop_id: stop.id });
    pushRecent(stop.slug, stop.name);
    if (P.get('src') === 'qr') logEvent('qr_scan', { stop_id: stop.id });
  } else if (!currentSlug) {
    logEvent('view', {});
  }
}

// ------------------------------------------------------- WhatsApp contact
// Floating WhatsApp button — only shown once an admin sets a number in
// Admin → Settings (site_settings key 'contact').
function renderWhatsApp() {
  document.getElementById('waFloat')?.remove();
  const num = CONTACT && CONTACT.whatsapp ? String(CONTACT.whatsapp).replace(/[^\d]/g, '') : '';
  if (!num) return;
  const a = document.createElement('a');
  a.id = 'waFloat';
  a.className = 'wa-float';
  a.href = 'https://wa.me/' + num;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat on WhatsApp');
  a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4.1.2.1.7-.1 1.3z"/></svg>';
  document.body.appendChild(a);
}

// Re-render when the visitor switches language.
document.addEventListener('bt-lang', () => { if (STOPS.length || currentSlug) render(); });

// Live IST clock in the header (HH:MM:SS AM/PM), updates every second.
function tickClock() {
  const el = document.getElementById('istClock');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

// PWA: register the service worker (public site only — admin is excluded in sw.js)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

async function init() {
  app.innerHTML = `<div class="skel" style="height:130px;margin-bottom:12px"></div><div class="skel" style="height:88px;margin-bottom:12px"></div><div class="skel" style="height:88px"></div>`;
  const th = document.getElementById('tabHome'), tf = document.getElementById('tabFav');
  if (th) th.classList.toggle('on', location.pathname === '/' && !favOnly && !location.hash);
  if (tf) tf.classList.toggle('on', favOnly);
  try {
    await loadData();
    render();
    renderWhatsApp();
    logPageView();
    loadAnnouncements();
    // Re-render for fresh ETAs, but never while the visitor is typing in a
    // field — that wiped From/To input and broke the datalist mid-pick.
    setInterval(() => {
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      render();
    }, 20000);
    setInterval(loadData, 60000);
    setInterval(tickMaint, 1000);
    tickClock();
    setInterval(tickClock, 1000);
  } catch (e) {
    app.innerHTML = `<div class="empty" style="margin-top:40px"><b>${t('cannotLoad')}</b><p>${t('cannotLoadSub')}</p></div>`;
  }
}
init();
