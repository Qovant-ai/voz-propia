// Sirve dist/ en http://localhost:5180 para probar la app instalable (node build.js --pwa primero).
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "dist"), PORT = +process.env.PORT || 5180;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("No encontrado"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`Voz Propia (dist) en http://localhost:${PORT}`));
