// Public blog — lists published posts (/blog) and renders a single post
// (/blog/<slug>, slug read from the path by the server route).
const app = document.getElementById('app');
const slugFromPath = (location.pathname.match(/^\/blog\/([^/?#]+)/) || [])[1];

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });

function postCard(p) {
  return `<a class="post-card" href="/blog/${encodeURIComponent(p.slug)}">
    ${p.cover_url ? `<img class="post-cover" src="${esc(p.cover_url)}" alt="" loading="lazy">` : ''}
    <div class="post-body">
      <div class="post-date">${fmtDate(p.created_at)}</div>
      <h2>${esc(p.title)}</h2>
      ${p.excerpt ? `<p class="post-ex">${esc(p.excerpt)}</p>` : ''}
      <span class="post-more">${t('readMore')} &rsaquo;</span>
    </div></a>`;
}

async function listView() {
  app.innerHTML = `<h1 class="title">${t('blogTitle')}</h1><p class="sub mt">${t('blogSub')}</p><div id="posts" class="mt2"><div class="skel" style="height:120px;margin-bottom:12px"></div></div>`;
  const { data, error } = await supabase.from('blog_posts').select('id, title, slug, excerpt, cover_url, created_at')
    .eq('published', true).order('created_at', { ascending: false });
  const box = document.getElementById('posts');
  if (error) { box.innerHTML = `<div class="empty"><b>Could not load posts</b><p>${esc(error.message)}</p></div>`; return; }
  box.innerHTML = data && data.length
    ? data.map(postCard).join('')
    : `<div class="empty"><b>${t('noPosts')}</b><p>${t('noPostsSub')}</p></div>`;
}

async function postView(slug) {
  app.innerHTML = `<div class="skel" style="height:40px;margin-bottom:12px"></div><div class="skel" style="height:200px"></div>`;
  const { data: p, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  if (error || !p) {
    app.innerHTML = `<a class="back" href="/blog">&lsaquo; ${t('backToBlog')}</a>
      <div class="empty" style="margin-top:30px"><b>${t('postNotFound')}</b><p>${t('postNotFoundSub')}</p></div>`;
    return;
  }
  document.title = `${p.title} · Bus Timings`;
  let canon = document.querySelector('link[rel="canonical"]');
  if (canon) canon.href = location.origin + '/blog/' + encodeURIComponent(p.slug);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = p.title;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = p.excerpt || p.title;
  if (p.cover_url) {
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.content = p.cover_url;
  }
  // Body is plain text — escape everything, then preserve line breaks.
  const bodyHtml = esc(p.body).replace(/\n/g, '<br>');
  app.innerHTML = `<a class="back" href="/blog">&lsaquo; ${t('backToBlog')}</a>
    <article class="post">
      ${p.cover_url ? `<img class="post-cover single" src="${esc(p.cover_url)}" alt="">` : ''}
      <h1 class="title" style="font-size:30px;margin-top:10px">${esc(p.title)}</h1>
      <div class="post-date">${t('publishedOn')} ${fmtDate(p.created_at)}</div>
      ${p.excerpt ? `<p class="sub" style="margin-top:10px;font-size:16px">${esc(p.excerpt)}</p>` : ''}
      <div class="post-full">${bodyHtml}</div>
    </article>`;
}

if (slugFromPath) postView(decodeURIComponent(slugFromPath)); else listView();
