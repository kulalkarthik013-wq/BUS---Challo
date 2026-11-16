// Fills missing dictionary keys in public/js/lang.js using the free
// MyMemory translation API (no key required). Usage:
//   node scripts/translate-i18n.js kn
// Safe to re-run: only keys absent from the target dictionary are translated.
const fs = require('fs');
const path = require('path');

const LANG = process.argv[2] || 'kn';
const PAIR = { kn: 'en|kn-IN', hi: 'en|hi-IN' }[LANG];
if (!PAIR) { console.error('Unknown lang:', LANG); process.exit(1); }

const file = path.join(__dirname, '..', 'public', 'js', 'lang.js');
let src = fs.readFileSync(file, 'utf8');

function extractDict(name) {
  const start = src.indexOf('const ' + name + ' = {');
  const end = src.indexOf('\n  };', start);
  return src.slice(start, end + 4);
}
const enBlock = extractDict('en');
const langBlock = extractDict(LANG);
const en = eval('(' + enBlock.slice(enBlock.indexOf('{')) + ')');
const have = eval('(' + langBlock.slice(langBlock.indexOf('{')) + ')');

const missing = Object.keys(en).filter(k => !(k in have));
console.log(LANG + ': ' + Object.keys(have).length + ' keys present, ' + missing.length + ' missing');
if (!missing.length) process.exit(0);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function translate(text) {
  // Protect {placeholder} tokens from the translator.
  const ph = [];
  const guarded = text.replace(/\{[^}]+\}/g, m => { ph.push(m); return ' ZXQ' + (ph.length - 1) + 'ZX '; });
  const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(guarded) + '&langpair=' + PAIR;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      let out = json.responseData.translatedText;
      ph.forEach((p, i) => { out = out.split('ZXQ' + i + 'ZX').join(p).split('ZXQ ' + i + ' ZX').join(p); });
      out = out.replace(/\s+/g, ' ').trim();
      if (out) return out;
    } catch (e) { /* retry */ }
    await sleep(800 * (attempt + 1));
  }
  return null;
}

(async () => {
  const lines = [];
  for (const k of missing) {
    const tr = await translate(en[k]);
    if (!tr) { console.log('  SKIP (no result): ' + k); continue; }
    lines.push('    ' + k + ': ' + JSON.stringify(tr).replace(/"/g, "'") + ',');
    console.log('  ' + k + ' -> ' + tr.slice(0, 60));
    await sleep(250); // be polite to the free API
  }
  if (!lines.length) { console.log('Nothing translated.'); return; }
  const marker = '\n  const ' + (LANG === 'kn' ? 'hi' : 'kn') + ' = {';
  const idx = src.indexOf(marker);
  // insert before the closing of the target dict: find '\n  };' after the dict start
  const dictStart = src.indexOf('const ' + LANG + ' = {');
  const dictEnd = src.indexOf('\n  };', dictStart);
  src = src.slice(0, dictEnd) + '\n' + lines.join('\n') + src.slice(dictEnd);
  fs.writeFileSync(file, src);
  console.log('Wrote ' + lines.length + ' translations to ' + LANG);
})();
