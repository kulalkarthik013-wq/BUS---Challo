// Cookie consent banner for public pages. The site stores only a consent
// flag in localStorage (no tracking cookies); this banner records the
// visitor's choice so we don't ask again.
(function () {
  const KEY = 'bt-consent';
  if (localStorage.getItem(KEY)) return;

  const bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie consent');
  bar.innerHTML = `
    <p>We use cookies and local storage to remember your preferences (like this choice) and keep the site working. No tracking or advertising cookies are used. See our <a href="/cookies">Cookie Policy</a>.</p>
    <div class="acts">
      <button class="btn btn-s btn-sm" data-c="rejected">Reject</button>
      <button class="btn btn-p btn-sm" data-c="accepted">Accept</button>
    </div>`;
  document.body.appendChild(bar);

  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    localStorage.setItem(KEY, b.dataset.c);
    bar.remove();
  });
})();
