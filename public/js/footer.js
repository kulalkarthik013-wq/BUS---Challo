// Injects the site footer on public pages (index.html, blog, legal pages).
// Not loaded by admin.html.
(function () {
  // Self-referencing canonical + absolute og:url, correct on any domain.
  const canon = location.origin + location.pathname;
  let c = document.querySelector('link[rel="canonical"]');
  if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
  c.href = canon;
  const og = document.querySelector('meta[property="og:url"]');
  if (og) og.content = canon;

  const links = [
    ['/', 'home', 'Home'],
    ['/blog', 'blog', 'Blog'],
    ['/about', 'about', 'About'],
    ['/privacy', 'privacy', 'Privacy Policy'],
    ['/terms', 'terms', 'Terms of Service'],
    ['/cookies', 'cookiesPolicy', 'Cookie Policy'],
    ['/faq', 'faq', 'FAQ'],
    ['/contact', 'contact', 'Contact Us'],
  ];
  const year = new Date().getFullYear();
  const el = document.createElement('footer');
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="in">
      <div class="fbrand">
        <a class="brand" href="/">
          <span class="logo"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-4M16 21v-4M8 14h.01M16 14h.01"/></svg></span>
          Mangaluru Bus Timings
        </a>
        <p class="sub" data-i18n="footerTag">Live bus arrival times for your daily commute.</p>
      </div>
      <nav class="flinks" aria-label="Footer">
        ${links.map(([h, k, l]) => `<a href="${h}" data-i18n="${k}">${l}</a>`).join('')}
      </nav>
    </div>
    <div class="base">
      <span>&copy; ${year} Mangaluru Bus Timings. <span data-i18n="rights">All rights reserved.</span></span>
      <span data-i18n="indicative">Schedules are indicative — always confirm on the platform.</span>
    </div>`;
  document.body.appendChild(el);
})();
