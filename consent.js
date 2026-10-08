/*!
 * Consentimento de cookies — Marcela Souza (despertareterapia.com.br)
 *
 * COMO FUNCIONA
 * - Na primeira visita mostra um banner com "Aceitar", "Recusar" e "Preferências".
 * - A escolha fica salva no navegador (localStorage, chave "ms_cookie_consent";
 *   se o localStorage estiver bloqueado, usa um cookie próprio de mesmo nome por 12 meses).
 *   Esse registro é estritamente necessário: serve só para lembrar a escolha.
 * - A escolha vale por 12 meses. Ao mudar CONSENT_VERSION, o banner volta a aparecer para todos.
 *
 * COMO INSTALAR UMA FERRAMENTA QUE DEPENDE DE CONSENTIMENTO (ex.: Google Analytics, Meta Pixel)
 * Coloque o script com type="text/plain" e data-consent="analytics" ou data-consent="marketing".
 * Ele só é executado depois que o visitante autorizar aquela categoria:
 *   <script type="text/plain" data-consent="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
 *   <script type="text/plain" data-consent="analytics"> ...código de configuração... </script>
 * Lembre de atualizar a Política de Cookies e a Política de Privacidade ao instalar qualquer ferramenta.
 *
 * API: window.msConsent.get() → escolha atual | window.msConsent.open() → abre as preferências
 * Evento: document dispara "ms:consent" (detail = escolha) sempre que a escolha é salva.
 */
(function () {
  'use strict';
  var KEY = 'ms_cookie_consent';
  var CONSENT_VERSION = 1;
  var MAX_AGE_DAYS = 365;
  var POLICY_URL = 'cookies-policy.html';
  var d = document;

  /* ---------- armazenamento ---------- */
  function read() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) {}
    if (!raw) {
      var m = d.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
      if (m) { try { raw = decodeURIComponent(m[1]); } catch (e) {} }
    }
    if (!raw) return null;
    try {
      var c = JSON.parse(raw);
      if (!c || c.v !== CONSENT_VERSION) return null;
      if (Date.now() - new Date(c.date).getTime() > MAX_AGE_DAYS * 864e5) return null;
      return c;
    } catch (e) { return null; }
  }
  function write(analytics, marketing) {
    var c = { v: CONSENT_VERSION, necessary: true, analytics: !!analytics, marketing: !!marketing, date: new Date().toISOString() };
    var raw = JSON.stringify(c), saved = false;
    try { window.localStorage.setItem(KEY, raw); saved = true; } catch (e) {}
    if (!saved) {
      try { d.cookie = KEY + '=' + encodeURIComponent(raw) + '; max-age=' + (MAX_AGE_DAYS * 86400) + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) {}
    }
    return c;
  }

  /* ---------- ativa scripts bloqueados ---------- */
  function activate(c) {
    if (!c) return;
    d.querySelectorAll('script[type="text/plain"][data-consent]').forEach(function (old) {
      var cat = old.getAttribute('data-consent');
      if (!c[cat] || old.hasAttribute('data-consent-done')) return;
      var s = d.createElement('script');
      for (var i = 0; i < old.attributes.length; i++) {
        var a = old.attributes[i];
        if (a.name !== 'type' && a.name !== 'data-consent') s.setAttribute(a.name, a.value);
      }
      if (!old.src) s.text = old.text;
      old.setAttribute('data-consent-done', '');
      old.parentNode.insertBefore(s, old.nextSibling);
    });
  }
  function apply(c, reloadIfRevoked) {
    var prev = read();
    var saved = write(c.analytics, c.marketing);
    try { d.dispatchEvent(new CustomEvent('ms:consent', { detail: saved })); } catch (e) {}
    /* se uma permissão foi retirada depois de ativada, recarrega para descarregar a ferramenta */
    if (reloadIfRevoked && prev && ((prev.analytics && !saved.analytics) || (prev.marketing && !saved.marketing)) &&
        d.querySelector('script[data-consent-done]')) { location.reload(); return; }
    activate(saved);
  }

  /* ---------- estilos (mesma identidade da página) ---------- */
  var css = '' +
    '.mscc{position:fixed;z-index:9999;left:50%;bottom:max(16px,env(safe-area-inset-bottom,0px));transform:translate(-50%,16px);width:min(760px,calc(100% - 32px));' +
      'background:#5C3E1F;color:#F5EFE5;border-radius:6px;box-shadow:0 18px 50px -18px rgba(61,40,22,.55);' +
      'font-family:"Montserrat","MS Arial","MS DejaVu",system-ui,sans-serif;font-size:14px;line-height:1.6;' +
      'padding:18px 22px;display:flex;align-items:center;gap:14px 26px;opacity:0;transition:opacity .45s cubic-bezier(.22,.61,.36,1),transform .45s cubic-bezier(.22,.61,.36,1)}' +
    '.mscc.is-in{opacity:1;transform:translate(-50%,0)}' +
    '.mscc p{margin:0;flex:1;min-width:0;color:rgba(245,239,229,.86)}' +
    '.mscc a{color:#F5EFE5;text-decoration:underline;text-decoration-color:#C19A5C;text-underline-offset:3px}' +
    '.mscc a:hover{color:#C19A5C}' +
    '.mscc-actions{display:flex;align-items:center;gap:10px;flex:none}' +
    '.mscc-btn{font:inherit;font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:999px;' +
      'min-height:42px;padding:10px 20px;border:1px solid rgba(245,239,229,.45);background:transparent;color:#F5EFE5;white-space:nowrap;' +
      'transition:background-color .3s,color .3s,border-color .3s}' +
    '.mscc-btn:hover{border-color:#F5EFE5}' +
    '.mscc-btn.is-primary{background:#C19A5C;border-color:#C19A5C;color:#3D2816}' +
    '.mscc-btn.is-primary:hover{background:#F5EFE5;border-color:#F5EFE5}' +
    '.mscc-btn.is-link{border-color:transparent;padding-inline:6px;text-decoration:underline;text-decoration-color:#C19A5C;text-underline-offset:4px}' +
    '.mscc-btn:focus-visible,.mscc a:focus-visible,.mscp button:focus-visible,.mscp input:focus-visible+span{outline:2px solid #C19A5C;outline-offset:3px}' +
    '@media (max-width:720px){.mscc{flex-direction:column;align-items:stretch;gap:12px;padding:14px 16px;font-size:12.5px;line-height:1.55;bottom:max(10px,env(safe-area-inset-bottom,0px));width:calc(100% - 20px)}' +
      '.mscc-actions{display:grid;grid-template-columns:auto 1fr 1fr;gap:8px}.mscc-btn{min-height:40px;padding:8px 12px;font-size:11px;letter-spacing:.12em}.mscc-btn.is-link{padding-inline:2px}}' +
    /* painel de preferências */
    '.mscp{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(61,40,22,.45);opacity:0;transition:opacity .3s}' +
    '.mscp.is-in{opacity:1}' +
    '.mscp-box{background:#F5EFE5;color:#3D2816;width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:6px;padding:28px 28px 24px;' +
      'font-family:"Montserrat","MS Arial","MS DejaVu",system-ui,sans-serif;font-size:14px;line-height:1.6;box-shadow:0 24px 60px -20px rgba(61,40,22,.6)}' +
    '.mscp h2{font-family:"Playfair Display","PF Times","PF DejaVu",Georgia,serif;font-weight:500;font-size:26px;line-height:1.2;color:#5C3E1F;margin:0 0 10px}' +
    '.mscp p{margin:0 0 6px;color:#6B5039}' +
    '.mscp a{color:#5C3E1F;text-decoration:underline;text-decoration-color:#C19A5C;text-underline-offset:3px}' +
    '.mscp-cat{border-top:1px solid rgba(92,62,31,.2);padding:16px 0}' +
    '.mscp-row{display:flex;align-items:center;justify-content:space-between;gap:16px}' +
    '.mscp-row strong{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5C3E1F}' +
    '.mscp-cat p{font-size:13px;margin:6px 0 0}' +
    '.mscp-fixed{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#C19A5C;white-space:nowrap}' +
    '.mscp label{position:relative;display:inline-block;width:46px;height:26px;flex:none;cursor:pointer}' +
    '.mscp label input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}' +
    '.mscp label span{position:absolute;inset:0;border-radius:999px;background:rgba(92,62,31,.25);transition:background-color .25s}' +
    '.mscp label span::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#F5EFE5;transition:transform .25s}' +
    '.mscp input:checked+span{background:#5C3E1F}.mscp input:checked+span::after{transform:translateX(20px)}' +
    '.mscp-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;border-top:1px solid rgba(92,62,31,.2);padding-top:18px}' +
    '.mscp-actions button{font:inherit;font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:999px;min-height:44px;padding:10px 22px;' +
      'border:1px solid #5C3E1F;background:transparent;color:#5C3E1F;transition:background-color .3s,color .3s}' +
    '.mscp-actions button:hover{background:#EFE4D2}' +
    '.mscp-actions .is-primary{background:#5C3E1F;color:#F5EFE5}.mscp-actions .is-primary:hover{background:#3D2816}' +
    '@media (max-width:480px){.mscp-box{padding:22px 20px 20px}.mscp-actions button{flex:1 1 100%}}' +
    '@media (prefers-reduced-motion:reduce){.mscc,.mscp,.mscp label span,.mscp label span::after{transition:none}}';

  function injectCSS() {
    if (d.getElementById('mscc-css')) return;
    var st = d.createElement('style'); st.id = 'mscc-css'; st.textContent = css; d.head.appendChild(st);
  }

  /* ---------- banner ---------- */
  var banner = null;
  function closeBanner() {
    if (!banner) return;
    var b = banner; banner = null;
    b.classList.remove('is-in');
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 450);
  }
  function showBanner() {
    if (banner) return;
    injectCSS();
    banner = d.createElement('div');
    banner.className = 'mscc';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML =
      '<p>Usamos apenas recursos essenciais ao funcionamento da página. Ferramentas de estatística ou marketing só são ativadas com a sua autorização. <a href="' + POLICY_URL + '">Política de Cookies</a></p>' +
      '<div class="mscc-actions">' +
        '<button type="button" class="mscc-btn is-link" data-act="prefs">Preferências</button>' +
        '<button type="button" class="mscc-btn" data-act="reject">Recusar</button>' +
        '<button type="button" class="mscc-btn is-primary" data-act="accept">Aceitar</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute('data-act');
      if (act === 'accept') { apply({ analytics: true, marketing: true }); closeBanner(); }
      else if (act === 'reject') { apply({ analytics: false, marketing: false }); closeBanner(); }
      else if (act === 'prefs') { openPrefs(); }
    });
    d.body.appendChild(banner);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (banner) banner.classList.add('is-in'); }); });
  }

  /* ---------- preferências ---------- */
  var panel = null, lastFocus = null;
  function cat(id, title, text, checked) {
    return '<div class="mscp-cat"><div class="mscp-row"><strong id="mscp-' + id + '-t">' + title + '</strong>' +
      '<label><input type="checkbox" id="mscp-' + id + '" aria-labelledby="mscp-' + id + '-t"' + (checked ? ' checked' : '') + '><span></span></label></div>' +
      '<p>' + text + '</p></div>';
  }
  function closePrefs() {
    if (!panel) return;
    var p = panel; panel = null;
    p.classList.remove('is-in');
    d.removeEventListener('keydown', onKey);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 300);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function onKey(e) {
    if (!panel) return;
    if (e.key === 'Escape') { closePrefs(); return; }
    if (e.key === 'Tab') {
      var f = panel.querySelectorAll('button, input, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function openPrefs() {
    if (panel) return;
    injectCSS();
    lastFocus = d.activeElement;
    var c = read() || { analytics: false, marketing: false };
    panel = d.createElement('div');
    panel.className = 'mscp';
    panel.innerHTML =
      '<div class="mscp-box" role="dialog" aria-modal="true" aria-labelledby="mscp-title">' +
        '<h2 id="mscp-title">Preferências de cookies</h2>' +
        '<p>Escolha quais categorias você autoriza. Você pode mudar isso quando quiser na <a href="' + POLICY_URL + '">Política de Cookies</a>.</p>' +
        '<div class="mscp-cat"><div class="mscp-row"><strong>Estritamente necessários</strong><span class="mscp-fixed">Sempre ativos</span></div>' +
          '<p>Garantem o funcionamento da página e guardam a sua escolha sobre cookies. Não podem ser desativados.</p></div>' +
        cat('analytics', 'Estatísticas', 'Ajudariam a entender, de forma agregada, como a página é usada. No momento, esta página não utiliza ferramentas desta categoria.', c.analytics) +
        cat('marketing', 'Marketing', 'Permitiriam medir campanhas e exibir anúncios relevantes. No momento, esta página não utiliza ferramentas desta categoria.', c.marketing) +
        '<div class="mscp-actions">' +
          '<button type="button" data-act="save">Salvar preferências</button>' +
          '<button type="button" class="is-primary" data-act="all">Aceitar todos</button>' +
        '</div>' +
      '</div>';
    panel.addEventListener('click', function (e) {
      if (e.target === panel) { closePrefs(); return; }
      var act = e.target && e.target.getAttribute('data-act');
      if (act === 'save') {
        apply({ analytics: panel.querySelector('#mscp-analytics').checked, marketing: panel.querySelector('#mscp-marketing').checked }, true);
        closePrefs(); closeBanner();
      } else if (act === 'all') {
        apply({ analytics: true, marketing: true }, true);
        closePrefs(); closeBanner();
      }
    });
    d.body.appendChild(panel);
    d.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { if (panel) { panel.classList.add('is-in'); var b = panel.querySelector('input'); if (b) b.focus(); } });
  }

  /* ---------- início ---------- */
  window.msConsent = { get: read, open: openPrefs };
  function init() {
    var c = read();
    if (c) activate(c); else showBanner();
    d.querySelectorAll('[data-cookie-prefs]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openPrefs(); });
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
