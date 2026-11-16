// Generates supabase/routes-seed.sql from the route list below.
// Run: node scripts/gen-routes-seed.js  -> writes supabase/routes-seed.sql
// Then run that file in Supabase Dashboard -> SQL Editor.
// Safe to re-run: stops/routes use ON CONFLICT, route_stops too.
const fs = require('fs');
const path = require('path');

const ROUTES = [
['1',['Car Street','Mannagudda','Ladyhill','Chilimbi','Urwa Store','Kavoor','MCF colony','Kunjathbail']],
['1A',['State Bank','Lalbagh','Urwa Store','Kuloor','Tannirbhavi Beach']],
['1B',['State Bank','Car Street','Mannagudda','Ladyhill','Chilimbi','Urwa Store','Kodikal']],
['1C',['State Bank','Hampankatta','Shedigudde','Lalbagh','Ladyhill','Kodikal Cross','Kodikal']],
['2',['State Bank','Lalbagh','Ashoknagar','Baikampady','Surathkal','Mukka']],
['2A',['State Bank','Lalbagh','Ashoknagar','Baikampady','Surathkal','Mukka','Sasihitlu']],
['2B',['Bengare','Tannirbhavi Beach','Kuloor','Panambur','Jokatta','Kaana','Port Temple','Bajpe']],
['2C',['State Bank','Lalbagh','Ashoknagar','Baikampady','Baikampady Industrial Estate','Jokatte']],
['2D',['State Bank','Lalbagh','Ashoknagar','Baikampady','Baikampady Industrial Estate','Jokatte','Parkodi']],
['2E',['Kankanady','Jyothi','Lalbagh','Ashoknagar','Baikampady','Baikampady Industrial Estate','Jokatte','Kalavar','Bajpe']],
['2F',['Kankanady','Jyothi','Lalbagh','Ashoknagar','Baikampady','Baikampady Industrial Estate','Jokatte','Kalavar','Bajpe']],
['3',['State Bank','Falnir','Bendoorwell','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kudupu','Vamanjoor','Moodushedde']],
['3A',['State Bank','Jyothi','Bendoorwell','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kudupu','Vamanjoor','Moodushedde']],
['3B',['Mangaladevi','Kankanady','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kudupu','Vamanjoor','Moodushedde']],
['3C',['Mangaladevi','Valencia','Nanthoor','Kudpu Temple','Mangala Jyoti','Moodushedde']],
['3D',['State Bank','Jyothi','Bunts Hostel','Kadri','Vamanjoor','Ulaibettu']],
['4',['State Bank','Falnir','Kankanady','Bendoorwell','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kulshekar Chowki']],
['4A',['State Bank','Falnir','Kankanady','Bendoorwell','Mallikatte','Kadri','Nanthoor','Kulshekar','Kaikamba','Neermarga','Merlapadavu']],
['4C',['State Bank','Falnir','Kankanady','Bendoorwell','Mallikatte','Kadri','Nanthoor','Kulshekar','Kaikamba','Neermarga']],
['5',['State Bank','Jyothi','Bendoorwell','Kankanady','Nandi Gudda','Marnamikatta','Morgans Gate Rd']],
['6A',['State Bank','Jyothi','Bendoorwell','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Shaktinagar']],
['6B',['State Bank','Falnir','Kankanady','Bendoorwell','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Shaktinagar']],
['6C',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Shaktinagar']],
['7',['State Bank','Car Street','Alake','Mannagudda','Ladyhill','Chilimbi','Urwa Store']],
['9',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Nagori','Padil','Karmar','Bajal Jalligudde Cross','Bajal Church']],
['9A',['State Bank','Pandeshwar','Jeppu','Morgans Gate Rd','Jeppupatna','Ekkur','Mugeru','Bajal Jalligudde Cross','Bajal Pakkaladka','J.M. Road']],
['9B',['State Bank','Jyothi','Pumpwell','Ekkur','Mugeru','Bajal Jalligudde Cross','Bajal Pakkaladka','J.M. Road']],
['10A',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Nagori','Padil','Kannurbettu','Adyar']],
['10B',['State Bank','Jyothi','Balmatta','Kankanady','Pumpwell','Nagori','Padil','Kannurbettu','Adyar']],
['11A',['State Bank','Falnir','Kankanady','Nagori','Garodi','Padil','Kannurbettu']],
['11B',['State Bank','Falnir','Kankanady','Nagori','Garodi','Padil','Jalligudde']],
['11C',['Mangaladevi','Morgans Gate Rd','Nandi Gudda','Kankanady','Nagori','Garodi','Padil','Bajal Jalligudde Cross','Jalligudde']],
['12A',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kudupu','Vamanjoor','Gurupura','Kaikamba','Addoor','Polali']],
['12B',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Kadri','Bikkarnakatta','Kulshekar','Kudupu','Vamanjoor','Gurupura','Kaikamba','Addoor','Polali','Kolthamajal']],
['13',['State Bank','Car Street','Mannagudda','Ladyhill','Chilimbi','Urwa Store']],
['13A',['State Bank','Car Street','Mannagudda','Ladyhill','Chilimbi','Urwa Store','Kottara']],
['13C',['State Bank','K.S. Rao Road','Lalbagh','Ladyhill','Kuloor','Kudremukh Housing Colony','Hudco Colony','Govt. Womens polytechnic','Govt. Quarters','Kavoor','Bondel']],
['13D',['State Bank','K.S. Rao Road','Lalbagh','Ladyhill','Kuloor','Kudremukh Housing Colony','Hudco Colony','Govt. Womens polytechnic','Govt. Quarters','Kavoor','Bondel','Padangady','Pacchanady Beggari Colony']],
['13E',['Mangaladevi','Bendoorwell','Jyothi','Lalbagh','Ladyhill','Kuloor','Kudremukh Housing Colony','Hudco Colony','Govt. Womens polytechnic','Govt. Quarters','Kavoor','Bondel']],
['14A',['State Bank','Jyothi','Bendoorwell','Mallikatte','Kadri','Nanthoor','Akashavani','KPT','Yeyyadi','Konchadi','Padangady','Bondel']],
['14B',['State Bank','Falnir','Bendoorwell','Mallikatte','Kadri','Nanthoor','Akashavani','KPT','Yeyyadi','Konchadi','Padangady','Bondel']],
['14C',['Mangaladevi','Morgans Gate Rd','Attavar','Yemmekere','Nandi Gudda','Kankanady','Mallikatte','Kadri','Nanthoor','Akashavani','KPT','Yeyyadi','Konchadi','Padangady','Bondel']],
['15',['Mangaladevi','Morgans Gate Rd','Nandi Gudda','Kankanady','Mallikatte','Kadri Market','Nanthoor','Akashavani','Bejai','KSRTC Bus Stand','Bharat Mall','Lalbagh','Ladyhill','Kuloor','Baikampady','Surathkal']],
['15A',['Mangaladevi','Morgans Gate Rd','Nandi Gudda','Kankanady','Mallikatte','Kadri Market','Nanthoor','Akashavani','Bejai','KSRTC Bus Stand','Bharat Mall','Lalbagh','Ladyhill','Kuloor','Baikampady','Surathkal','Krishnapur','Katipalla']],
['15B',['Mangaladevi','Morgans Gate Rd','Nandi Gudda','Kankanady','Mallikatte','Kadri Market','Nanthoor','Akashavani','Bejai','KSRTC Bus Stand','Bharat Mall','Lalbagh','Ladyhill','Kuloor','Baikampady','Surathkal','Krishnapur','Katipalla','Chelairpadavu']],
['16',['State Bank','Mission Street','Azizzudin Road','Kandathpalli','Mandi','Gokarnath Temple','Kudroli','Bokkapatna','Boloor','Sulthan Battery']],
['16A',['State Bank','Car Street','Alake','Kudroli','Bokkapatna','Boloor','Sulthan Battery']],
['17',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Konchadi','Mullakadu','Kavoor','Maravoor','Kunjathbail']],
['17A',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Konchadi','Mullakadu','Kavoor','Maravoor','Kunjathbail']],
['17B',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Konchadi','Mullakadu','Kavoor','Maravoor','Kunjathbail']],
['18',['State Bank','Pandeshwar','Hoige Bazar','Bolar','Jeppu Market','Morgans Gate Rd']],
['19',['State Bank','Hampankatta','Jyothi','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Bejai','KPT','Yeyyadi','Konchadi','Padavinangadi','Bondel','Pacchanady']],
['21',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Kadri','Nanthoor','Bikkarnakatta','Kulshekar','Kaikamba','Neermarga']],
['22',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Nanthoor','Bikkarnakatta','Kulshekar','Vamanjoor','Gurupura','Kaikamba','Bajpe']],
['22A',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Nanthoor','Bikkarnakatta','Kulshekar','Vamanjoor','Gurupura','Kaikamba','Bajpe','Bajpe Aerodrome']],
['23',['State Bank','Jyothi','Balmatta','Kankanady','Pumpwell','Nagori','Garodi','Padil','Faisalnagar']],
['27',['State Bank','Attavar','Nandi Gudda','Marnamikatta','Mangaladevi']],
['27A',['State Bank','Attavar','Nandi Gudda','Marnamikatta','Mangaladevi','Mulihitlu']],
['29',['State Bank','Pandeshwar','Yemmekere','Bolar','Jeppu Market','Morgans Gate Rd']],
['30',['State Bank','Jyothi','Balmatta','Kankanady','Mallikatte','Kadri','Nanthoor','Bikkarnakatta','Maroli','Padil']],
['30A',['State Bank','Jyothi','Balmatta','Kankanady','Mallikatte','Kadri','Nanthoor','Bikkarnakatta','Maroli','Padil','Kannurbettu','Adyar']],
['30B',['State Bank','Jyothi','Balmatta','Kankanady','Mallikatte','Kadri','Nanthoor','Bikkarnakatta','Maroli','Padil','Kannurbettu','Adyar','Adyar Launch Jetty']],
['31',['State Bank','PVS','Canara College','Empire Mall','Ballalbagh','Mannagudda','Urwa Market','Shediguri']],
['31A',['State Bank','K.S. Rao Road','PVS','Canara College','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Urwa Market','Ashoknagar']],
['31B',['State Bank','Car Street','Mannagudda','Urwa Market','Ashoknagar','Dombel']],
['33',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Derebail','Konchadi','Akashbhavan']],
['37',['State Bank','Jyothi','Balmatta','Kankanady','Mallikatte','Kadri','Nanthoor','Bikkarnakatta','Maroli','Padil']],
['41A',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Kuloor','Baikampady','Surathkal','Krishnapur','Katipalla','Chelairpadavu']],
['42',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Kotekar','Beeri','Talapady']],
['43',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Kotekar','Beeri','Talapady','Kinya']],
['44A',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Ullal','Someshwar']],
['44B',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Kotekar','Eliyar Padavu']],
['44C',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Ullal','Ullal Launch Jetty']],
['44D',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Ullal','Kotepura']],
['45',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla']],
['45A',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Chokkabettu']],
['45B',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Chokkabettu']],
['45C',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Mangalpete','Kaikamba']],
['45D',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Mangalpete','MRPL','Kuthethur']],
['45E',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Mangalpete','MRPL','Kaithakurneri']],
['45F',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Kaikamba']],
['45G',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Mason Road','Janatha Colony']],
['45H',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Madhyapadavu']],
['47',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Kavoor','Maravoor','Bajpe']],
['47A',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Kavoor','Maravoor','Bajpe']],
['47B',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Kavoor','Maravoor','Bajpe','Bajpe Aerodrome']],
['47C',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Kapikad','Balebail','Kottara Cross','Kuntikana','Kavoor','Maravoor','Bajpe','Bajpe Aerodrome','Bhatrakere','Kattalsara']],
['48',['State Bank','Jyothi','Bunts Hostel','Mallikatte','Kadri','Nanthoor','KPT','Yeyyadi','Konchadi','Bondel','Kavoor','Maravoor','Bajpe']],
['48A',['State Bank','Hampankatta','Jyothi','PVS','Empire Mall','Ballalbagh','Lalbagh','Saibeen Complex','Bharat Mall','KSRTC Bus Stand','Bejai','Bejai Church','Yeyyadi','Konchadi','Bondel','Kavoor','Maravoor','Bajpe']],
['51',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Deralakatte','Mangalore University','Konaje']],
['51A',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Deralakatte','Mangalore University','Konaje','Inoli']],
['53',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Chilimbi','Urwa Store','Kottara Chowki','Kuloor','Panambur','Surathkal','Kana','Krishnapur','Katipalla','Soorinje','Tibar']],
['53A',['Kankanady','Pumpwell','Nanthoor','Kadri','Kuloor','Surathkal','Chokkabettu','Katipalla','Soorinje','Tibar']],
['54',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Beeri','Maddur','Natekal','Manjanady','Thaudugoli']],
['54A',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Deralakatte','Natekal','Manjanady','Thaudugoli']],
['55',['State Bank','Balmatta','Jyothi','Kankanady','Pumpwell','Thokkottu','Kuthar','Deralakatte','Natekal','Konaje','Fajir','Harekal','Pavoor']],
['59',['State Bank','K.S. Rao Road','PVS','Empire Mall','Ballalbagh','Lalbagh','Ladyhill','Kuloor','Baikampady','Chitrapur','Hosabettu','Surathkal']],
['60',['Anandanagar','Nandanapura','Ladyhill','Bejai Museum','Kadri Temple','Mangalore Junction','Valencia','Gorigudde']],
['61',['Kodikal','Kodikal Cross','Ladyhill','Bejai Museum','Kadri Temple','Pumpwell','Padil','Mangalore Junction']],
['62A',['Padil Railway Station','KPT','Bondel','Kavoor','Kuloor','Kaikamba','K.VK atipalla'.replace('K.VK atipalla','Katipalla')]],
];

const slugify = n => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const q = s => "'" + s.replace(/'/g, "''") + "'";

// Collect unique stops preserving first-seen order.
const stops = [];
const seen = new Set();
for (const [, list] of ROUTES) for (const name of list) {
  const slug = slugify(name);
  if (!slug || seen.has(slug)) continue;
  seen.add(slug); stops.push({ slug, name });
}

const out = [];
out.push('-- Auto-generated by scripts/gen-routes-seed.sql — ' + ROUTES.length + ' routes, ' + stops.length + ' stops');
out.push('-- Run in Supabase Dashboard -> SQL Editor. Safe to re-run (ON CONFLICT DO NOTHING).');
out.push('');
out.push('-- 1) Stops (skips any that already exist)');
const CH = 200;
for (let i = 0; i < stops.length; i += CH) {
  out.push('insert into stops (slug, name) values');
  out.push(stops.slice(i, i + CH).map(s => `  (${q(s.slug)}, ${q(s.name)})`).join(',\n') + '\non conflict (slug) do nothing;');
}
out.push('');
out.push('-- 2) Routes');
for (let i = 0; i < ROUTES.length; i += CH) {
  out.push('insert into routes (code, name) values');
  out.push(ROUTES.slice(i, i + CH).map(([c]) => `  (${q(c)}, ${q('Route ' + c)})`).join(',\n') + '\non conflict do nothing;');
}
out.push('');
out.push('-- 3) Route stops (ordered)');
for (const [code, list] of ROUTES) {
  const vals = list.map((name, i) => `    (${q(code)}, ${q(slugify(name))}, ${i + 1})`).join(',\n');
  out.push(`insert into route_stops (route_id, stop_id, sequence)
select r.id, s.id, v.seq
from routes r
join (values
${vals}
) as v(rc, slug, seq) on v.rc = r.code
join stops s on s.slug = v.slug
on conflict do nothing;`);
}
out.push('');
out.push(`-- Done: ${ROUTES.length} routes, ${stops.length} stops.`);

const file = path.join(__dirname, '..', 'supabase', 'routes-seed.sql');
fs.writeFileSync(file, out.join('\n'));
console.log('Wrote', file, '-', ROUTES.length, 'routes,', stops.length, 'stops');
