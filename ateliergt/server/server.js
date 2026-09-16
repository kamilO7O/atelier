const path = require("path");
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");

const app = express();
const port = process.env.PORT || 3000;
const clientDir = path.join(__dirname, "..", "client");
const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const sessions = new Map();
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]", "utf8");
const readUsers = () => JSON.parse(fs.readFileSync(usersFile, "utf8"));
const writeUsers = users => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
const hashPassword = password => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16).toString("hex");
  crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString("hex")}`));
});
const verifyPassword = (password, stored) => new Promise(resolve => {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return resolve(false);
  crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) return resolve(false);
    const actual = Buffer.from(key.toString("hex"), "hex");
    const expected = Buffer.from(hash, "hex");
    resolve(actual.length === expected.length && crypto.timingSafeEqual(actual, expected));
  });
});
const parseCookies = header => Object.fromEntries(String(header || "").split(";").map(part => part.trim().split("=")).filter(pair => pair.length === 2));
const tokenHash = token => crypto.createHash("sha256").update(token).digest("hex");
const sendVerificationEmail = (email, name, verifyUrl) => new Promise((resolve, reject) => {
  if (!process.env.RESEND_API_KEY) { console.log(`[email preview] ${email}: ${verifyUrl}`); return resolve(); }
  const html = `<div style="background:#f1eee7;padding:36px 16px;font-family:Arial;color:#29251f"><div style="max-width:560px;margin:auto;background:#f8f6f0;padding:42px 34px;text-align:center;border:1px solid #ded7c9"><div style="font:34px Georgia,serif">Atelier</div><div style="margin-top:8px;color:#b39a6b;font-size:11px;letter-spacing:.18em;text-transform:uppercase">soft furniture</div><h1 style="font:400 30px Georgia,serif;margin:34px 0 14px">Подтвердите вашу почту</h1><p style="font-size:14px;line-height:1.7;color:#6f695f">Здравствуйте, ${name}! Нажмите кнопку ниже, чтобы завершить регистрацию.</p><p style="margin:28px 0"><a href="${verifyUrl}" style="display:inline-block;padding:15px 26px;background:#29251f;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase">Подтвердить email</a></p><p style="font-size:11px;color:#9a948b">Ссылка действует 24 часа и используется один раз.</p></div></div>`;
  const payload = JSON.stringify({ from: process.env.MAIL_FROM || "Atelier <onboarding@resend.dev>", to: [email], subject: "Подтвердите почту в Atelier", html });
  const request = https.request({ hostname: "api.resend.com", path: "/emails", method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, response => { let body = ""; response.on("data", chunk => body += chunk); response.on("end", () => response.statusCode >= 200 && response.statusCode < 300 ? resolve() : reject(new Error(body || `Email provider error ${response.statusCode}`))); });
  request.on("error", reject); request.write(payload); request.end();
});

app.use(express.json());
app.use(express.static(clientDir));

app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const name = String(req.body.name || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Введите корректный email" });
  if (password.length < 8) return res.status(400).json({ error: "Пароль должен быть не короче 8 символов" });
  const users = readUsers();
  if (users.some(user => user.email === email)) return res.status(409).json({ error: "Этот email уже зарегистрирован" });
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = { id: crypto.randomUUID(), email, name: name || email.split("@")[0], passwordHash: await hashPassword(password), emailVerified: false, verificationTokenHash: tokenHash(verificationToken), verificationExpiresAt: Date.now() + 86400000, createdAt: new Date().toISOString() };
  users.push(user); writeUsers(users);
  const verifyUrl = `${process.env.APP_URL || `http://localhost:${port}`}/verify-email?email=${encodeURIComponent(email)}&token=${verificationToken}`;
  try { await sendVerificationEmail(email, user.name, verifyUrl); } catch (error) { console.error("Email sending failed:", error.message); return res.status(503).json({ error: "Не удалось отправить письмо. Проверьте настройки почты." }); }
  res.status(201).json({ verificationRequired: true, email });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = readUsers().find(item => item.email === email);
  if (user && !user.emailVerified) return res.status(403).json({ error: "Сначала подтвердите email по ссылке из письма" });
  if (!user || !(await verifyPassword(String(req.body.password || ""), user.passwordHash))) return res.status(401).json({ error: "Неверный email или пароль" });
  const token = crypto.randomBytes(32).toString("hex"); sessions.set(token, user.id);
  res.setHeader("Set-Cookie", `atelier_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.get(["/api/auth/verify", "/verify-email"], (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  const token = String(req.query.token || "");
  const users = readUsers();
  const user = users.find(item => item.email === email);
  const valid = user && !user.emailVerified && user.verificationExpiresAt > Date.now() && user.verificationTokenHash === tokenHash(token);
  if (valid) { user.emailVerified = true; delete user.verificationTokenHash; delete user.verificationExpiresAt; writeUsers(users); }
  res.type("html").send(`<!doctype html><meta charset="utf-8"><title>${valid ? "Почта подтверждена" : "Ссылка недействительна"}</title><style>body{margin:0;background:#f1eee7;color:#29251f;font:16px Arial;display:grid;place-items:center;min-height:100vh;text-align:center}.box{background:#f8f6f0;padding:42px 28px;max-width:440px;border:1px solid #ded7c9}h1{font:400 32px Georgia,serif}a{display:inline-block;margin-top:18px;padding:14px 22px;background:#29251f;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase}</style><div class="box"><h1>${valid ? "Почта подтверждена" : "Ссылка недействительна"}</h1><p>${valid ? "Теперь можно войти в личный кабинет Atelier." : "Ссылка уже использована или срок действия истёк."}</p><a href="/">Вернуться на сайт</a></div>`);
});

app.post("/api/auth/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie).atelier_session;
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "atelier_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = parseCookies(req.headers.cookie).atelier_session;
  const userId = token && sessions.get(token);
  const user = userId && readUsers().find(item => item.id === userId);
  res.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "atelier-server" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Atelier is running at http://localhost:${port}`);
});
