// Servidor de producción (Hostinger u otro hosting con Node): sirve dist/ con los encabezados correctos.
// Uso: npm run build:pwa && npm start   · puerto: variable PORT (por defecto 3000)
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "dist"), PORT = +process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
// Lo que debe actualizarse apenas hay una versión nueva; los íconos pueden quedar en caché una semana
const FRESH = new Set(["index.html", "sw.js", "manifest.webmanifest"]);

if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.error("Falta dist/: ejecuta primero npm run build:pwa"); process.exit(1); }

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
  let p;
  try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(ROOT, p)), rel = path.relative(ROOT, file);
  // Nada fuera de dist/ ni archivos ocultos (.htaccess)
  if (rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).some(s => s.startsWith(".")) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado");
  }
  const name = rel.split(path.sep).join("/");
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": FRESH.has(name) ? "no-cache" : /^icons\//.test(name) ? "public, max-age=604800" : "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Voz Propia en el puerto ${PORT}`));
