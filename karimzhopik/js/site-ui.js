(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanPath = location.pathname.replace(/\/index\.html$/i, "/").replace(/\/catalog\.html$/i, "/catalog");
  if (cleanPath !== location.pathname) history.replaceState(history.state, "", cleanPath + location.search + location.hash);
  const veil = document.createElement("div"); veil.className = "page-transition"; veil.setAttribute("aria-hidden", "true"); document.body.appendChild(veil);
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !["http:", "https:"].includes(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    event.preventDefault();
    if (reduceMotion) { location.href = url.href; return; }
    veil.classList.add("is-leaving"); setTimeout(() => { location.href = url.href; }, 260);
  });
  const revealNodes = [...document.querySelectorAll("main > section, .site > section, .info-section, .product, .catalog-intro, .filters, footer")];
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready"); revealNodes.forEach(node => node.classList.add("atelier-reveal"));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { rootMargin:"0px 0px -8%", threshold:.08 });
    revealNodes.forEach(node => observer.observe(node));
  }
  const STORAGE_KEY = "atelier_cookie_consent_v1";
  const banner = document.createElement("section"); banner.className = "cookie-banner"; banner.setAttribute("aria-label", "Настройки cookie");
  banner.innerHTML = `<div class="cookie-copy"><strong>Немного о cookie</strong>Используем необходимые cookie для работы сайта. Дополнительные — только с вашего согласия. <a href="/cookies/">Подробнее</a></div><div class="cookie-actions"><button class="cookie-btn" type="button" data-cookie-essential>Только необходимые</button><button class="cookie-btn" type="button" data-cookie-settings>Настроить</button><button class="cookie-btn primary" type="button" data-cookie-accept>Принять</button></div>`; document.body.appendChild(banner);
  const dialog = document.createElement("div"); dialog.className = "cookie-dialog-backdrop"; dialog.setAttribute("aria-hidden", "true");
  dialog.innerHTML = `<div class="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookieTitle"><h2 id="cookieTitle">Настройки cookie</h2><p>Вы можете изменить выбор в любой момент по ссылке внизу сайта.</p><label class="cookie-option"><span><strong>Необходимые</strong><small>Авторизация, корзина и базовые функции сайта.</small></span><input type="checkbox" checked disabled></label><label class="cookie-option"><span><strong>Аналитика</strong><small>Помогает понять, какие страницы удобны посетителям.</small></span><input id="cookieAnalytics" type="checkbox"></label><label class="cookie-option"><span><strong>Маркетинг</strong><small>Используется только если позже будут подключены рекламные сервисы.</small></span><input id="cookieMarketing" type="checkbox"></label><div class="cookie-dialog-actions"><button class="cookie-btn" type="button" data-cookie-close>Отмена</button><button class="cookie-btn primary" type="button" data-cookie-save>Сохранить</button></div></div>`; document.body.appendChild(dialog);
  const readConsent = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } };
  const saveConsent = value => { localStorage.setItem(STORAGE_KEY, JSON.stringify({...value,necessary:true,updatedAt:new Date().toISOString()})); banner.classList.remove("is-open"); dialog.classList.remove("is-open"); dialog.setAttribute("aria-hidden","true"); window.dispatchEvent(new CustomEvent("atelier:consent",{detail:value})); };
  const openSettings = () => { const current=readConsent()||{}; dialog.querySelector("#cookieAnalytics").checked=!!current.analytics; dialog.querySelector("#cookieMarketing").checked=!!current.marketing; dialog.classList.add("is-open"); dialog.setAttribute("aria-hidden","false"); };
  const closeSettings = () => { dialog.classList.remove("is-open"); dialog.setAttribute("aria-hidden","true"); };
  document.addEventListener("click", event => {
    if (event.target.closest("[data-cookie-accept]")) saveConsent({analytics:true,marketing:true});
    if (event.target.closest("[data-cookie-essential]")) saveConsent({analytics:false,marketing:false});
    if (event.target.closest("[data-cookie-settings]")) { event.preventDefault(); openSettings(); }
    if (event.target.closest("[data-cookie-close]")) closeSettings();
    if (event.target.closest("[data-cookie-save]")) saveConsent({analytics:dialog.querySelector("#cookieAnalytics").checked,marketing:dialog.querySelector("#cookieMarketing").checked});
  });
  dialog.addEventListener("click", event => { if (event.target === dialog) closeSettings(); });
  if (!readConsent()) requestAnimationFrame(() => setTimeout(() => banner.classList.add("is-open"), 550));
})();
