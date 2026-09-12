const path = require("path");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;
const clientDir = path.join(__dirname, "..", "client");

app.use(express.json());
app.use(express.static(clientDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "atelier-server" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Atelier is running at http://localhost:${port}`);
});
