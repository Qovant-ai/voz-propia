// Servidor de producción (Hostinger u otro hosting con Node). Puerto: variable PORT (por defecto 3000).
// Funciona desde la raíz del repositorio (sirve dist/) y también copiado dentro de dist/ (sirve su propia carpeta),
// porque algunos hostings buscan el archivo de entrada dentro del directorio de salida.
const http = require("http"), fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const PORT = +process.env.PORT || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
const FRESH = new Set(["index.html", "sw.js", "manifest.webmanifest"]);
const HIDDEN = new Set(["server.js", "package.json"]);

function findRoot() {
  const inDist = path.join(__dirname, "dist");
  if (fs.existsSync(path.join(inDist, "index.html"))) return inDist;
  if (fs.existsSync(path.join(__dirname, "index.html")) && fs.existsSync(path.join(__dirname, "sw.js"))) return __dirname;
  return null;
}
let ROOT = findRoot();
// Si el hosting arrancó sin compilar, se compila aquí mismo
if (!ROOT && fs.existsSync(path.join(__dirname, "build.js"))) {
  try { execFileSync(process.execPath, [path.join(__dirname, "build.js"), "--pwa"], { stdio: "inherit", cwd: __dirname }); } catch (e) { console.error("No se pudo compilar:", e.message); }
  ROOT = findRoot();
}
if (!ROOT) console.error("No encuentro la app compilada (dist/index.html). Revisa el comando de build: npm run build:pwa");

http.createServer((req, res) => {
  if (!ROOT) { res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Voz Propia: falta compilar la app (npm run build:pwa)."); }
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
  let p;
  try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(ROOT, p)), rel = path.relative(ROOT, file), name = rel.split(path.sep).join("/");
  // Nada fuera de la carpeta, ni archivos ocultos (.htaccess), ni el propio servidor
  if (rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).some(s => s.startsWith(".")) || HIDDEN.has(name) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado");
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": FRESH.has(name) || !/^icons\//.test(name) ? "no-cache" : "public, max-age=604800",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Voz Propia en el puerto ${PORT}${ROOT ? " · sirviendo " + ROOT : ""}`));
