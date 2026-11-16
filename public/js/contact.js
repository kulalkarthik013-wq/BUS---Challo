// Contact page — pulls email/WhatsApp from site_settings key 'contact'
// (set in Admin → Settings) and fills them in. Falls back to the defaults
// hardcoded in contact.html when nothing is configured.
(function () {
  supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle()
    .then(({ data }) => {
      const c = (data && data.value) || {};
      const emailEl = document.getElementById('contactEmail');
      if (emailEl && c.email) {
        emailEl.href = 'mailto:' + c.email;
        emailEl.textContent = c.email;
      }
      const wa = document.getElementById('contactWa');
      if (wa && c.whatsapp) {
        const num = String(c.whatsapp).replace(/[^\d]/g, '');
        wa.innerHTML = `WhatsApp: <a href="https://wa.me/${num}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a>`;
        wa.classList.remove('hide');
      }
    }, () => {});
})();
