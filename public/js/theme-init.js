// Pre-paint theme bootstrap — must stay a tiny external file (CSP blocks
// inline scripts). Restores the visitor's saved light/dark choice before
// first render to avoid a flash of the wrong theme.
try {
  var t = localStorage.getItem('bt-theme');
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
