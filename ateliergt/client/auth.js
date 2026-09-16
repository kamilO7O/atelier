(function () {
  const style = document.createElement("style");
  style.textContent = `
    .overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(22,19,15,.55);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .34s ease,visibility 0s linear .34s}
    .overlay.open{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
    .modal{position:relative;width:min(720px,100%);max-height:90vh;overflow:auto;background:#f8f6f0;padding:38px;opacity:0;transform:translate3d(0,16px,0) scale(.985);transition:opacity .34s ease,transform .42s cubic-bezier(.22,.61,.36,1);color:#27231e}
    .overlay.open .modal{opacity:1;transform:translate3d(0,0,0) scale(1)}
    .modal h2{margin:0 0 17px;font-family:"Cormorant Garamond",serif;font-size:42px;font-weight:400}
    .close{position:absolute;right:14px;top:10px;border:0;background:none;color:#7c766c;font-size:25px;cursor:pointer;transition:color .2s ease,transform .35s ease}.close:hover{color:#27231e;transform:rotate(90deg)}
    .form{display:grid;gap:10px}.form input{width:100%;border:1px solid #ded7c9;background:#fffdf8;padding:13px;outline:none;font:12px Manrope,Arial,sans-serif;color:#27231e}.form button{background:#29251f;color:#fff;border:0;padding:14px;text-transform:uppercase;letter-spacing:.1em;font-size:9px;cursor:pointer;transition:background .3s ease}.form button:disabled{opacity:.65}
    .header-account{border:0;border-bottom:1px solid #bda77c;background:none;padding:5px 0;color:#514c44;font-size:9px;letter-spacing:.09em;text-transform:uppercase;cursor:pointer;transition:color .3s ease,border-color .3s ease}
    .header-account:hover{color:#a88e60;border-color:#a88e60}
    .auth-modal{width:min(460px,100%)}
    .auth-switch{margin-top:16px;border:0;background:none;color:#a88e60;font-size:10px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
    .auth-message{min-height:18px;margin:12px 0 0;color:#9a4a42;font-size:10px}
    .account-view p{margin:8px 0;color:#7c766c;font-size:12px}.account-view strong{color:#27231e}
    .form-button{width:100%;margin-top:18px;background:#29251f;color:#fff;border:0;padding:14px;text-transform:uppercase;letter-spacing:.1em;font-size:9px;cursor:pointer}
    @media(max-width:560px){.header-account{font-size:8px}.auth-modal{padding:28px 18px}}
  `;
  document.head.appendChild(style);

  const modal = document.getElementById("authModal") || (() => {
    const el = document.createElement("div");
    el.className = "overlay"; el.id = "authModal"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<div class="modal auth-modal"><button class="close" id="closeAuth" aria-label="Закрыть">×</button><div class="intro-kicker" style="text-align:left">Личный кабинет</div><h2 id="authTitle">Войти</h2><form class="form" id="authForm"><input id="authName" name="name" placeholder="Ваше имя" autocomplete="name" hidden><input required id="authEmail" type="email" name="email" placeholder="E-mail" autocomplete="email"><input required id="authPassword" type="password" name="password" placeholder="Пароль (минимум 8 символов)" minlength="8" autocomplete="current-password"><button type="submit" id="authSubmit">Войти</button></form><button class="auth-switch" id="authSwitch" type="button">Нет аккаунта? Зарегистрироваться</button><p class="auth-message" id="authMessage" role="status"></p><div class="account-view" id="accountView" hidden><p>Вы вошли как <strong id="accountName"></strong></p><p id="accountEmail"></p><button class="form-button" id="logoutButton" type="button">Выйти из аккаунта</button></div></div>`;
    document.body.appendChild(el); return el;
  })();

  const actions = document.querySelector(".real-actions, .header-actions");
  let accountButton = document.getElementById("accountButton");
  if (!accountButton && actions) { accountButton = document.createElement("button"); accountButton.className = "header-account"; accountButton.id = "accountButton"; accountButton.type = "button"; accountButton.textContent = "Войти"; actions.prepend(accountButton); }
  const form = document.getElementById("authForm");
  if (!form) return;
  const title = document.getElementById("authTitle"), submit = document.getElementById("authSubmit"), switcher = document.getElementById("authSwitch");
  const nameInput = document.getElementById("authName"), message = document.getElementById("authMessage"), accountView = document.getElementById("accountView");
  let mode = "login", currentUser = null;
  const setMode = next => { mode = next; const register = mode === "register"; title.textContent = register ? "Регистрация" : "Войти"; submit.textContent = register ? "Создать аккаунт" : "Войти"; switcher.textContent = register ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"; nameInput.hidden = !register; nameInput.required = register; message.textContent = ""; };
  const showVerification = email => { title.textContent = "Проверьте почту"; form.hidden = true; switcher.hidden = true; accountView.hidden = false; accountView.innerHTML = `<div style="width:54px;height:54px;margin:0 auto 18px;border:1px solid #b39a6b;border-radius:50%;display:grid;place-items:center;color:#b39a6b;font-size:25px">@</div><p style="text-align:center;font-size:13px;line-height:1.7;color:#6f695f">Мы отправили письмо на<br><strong style="color:#27231e">${email}</strong></p><p style="text-align:center;font-size:11px;line-height:1.7;color:#9a948b">Нажмите кнопку в письме, чтобы активировать аккаунт. Проверьте папку «Спам», если письма нет.</p>`; };
  const open = () => { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
  const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
  const render = user => { currentUser = user; if (user) { accountButton.textContent = user.name; title.textContent = "Ваш кабинет"; form.hidden = true; switcher.hidden = true; accountView.hidden = false; document.getElementById("accountName").textContent = user.name; document.getElementById("accountEmail").textContent = user.email; } else { accountButton.textContent = "Войти"; form.hidden = false; switcher.hidden = false; accountView.hidden = true; setMode("login"); } };
  accountButton && (accountButton.onclick = () => { if (currentUser) { render(currentUser); open(); } else { setMode("login"); open(); } });
  document.getElementById("closeAuth")?.addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  switcher.addEventListener("click", () => setMode(mode === "login" ? "register" : "login"));
  form.addEventListener("submit", async e => { e.preventDefault(); message.textContent = ""; submit.disabled = true; const data = Object.fromEntries(new FormData(form)); try { const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Не удалось выполнить запрос"); if (mode === "register" && payload.verificationRequired) showVerification(payload.email); else { render(payload.user); message.textContent = "Готово"; } } catch (error) { message.textContent = error.message; } finally { submit.disabled = false; } });
  document.getElementById("logoutButton")?.addEventListener("click", async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); render(null); close(); });
  fetch("/api/auth/me", { credentials: "include" }).then(r => r.json()).then(data => render(data.user)).catch(() => render(null));
})();
