// Une los módulos de src/ en index.html (la página que se publica).
// Uso: node build.js          → index.html (versión artefacto, dentro de Claude)
//      node build.js --test   → además dev/test.html, con un Claude simulado (dev/mock.js) para probar sin conexión
//      node build.js --pwa    → dist/: la app instalable (servidor en Supabase + modo sin conexión) que se publica en Hostinger
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "src");
const files = fs.readdirSync(SRC).filter(f => /^\d\d-.*\.(html|js)$/.test(f)).sort();
const read = f => fs.readFileSync(path.join(SRC, f), "utf8").trim();
const htmlFiles = files.filter(f => f.endsWith(".html"));
const html = htmlFiles.map(read).join("\n\n");
const js = files.filter(f => f.endsWith(".js")).map(f => `/* ---- ${f} ---- */\n` + read(f)).join("\n\n");

// Revisión de sintaxis antes de escribir nada
try { new Function(js); } catch (e) { console.error("Error de sintaxis en el JavaScript:", e.message); process.exit(1); }

const page = `${html}\n<script>\n${js}\n</script>\n`;
fs.writeFileSync(path.join(__dirname, "index.html"), page);
console.log(`index.html · ${(page.length / 1024).toFixed(1)} KB · ${files.length} módulos`);

if (process.argv.includes("--test")) {
  const mock = fs.readFileSync(path.join(__dirname, "dev", "mock.js"), "utf8");
  fs.writeFileSync(path.join(__dirname, "dev", "test.html"), `${html}\n<script>\n${mock}\n</script>\n<script>\n${js}\n</script>\n`);
  console.log("dev/test.html listo (Claude simulado)");
}

if (process.argv.includes("--pwa")) {
  const PWA = path.join(__dirname, "pwa"), DIST = path.join(__dirname, "dist");
  // Variables de entorno opcionales (por ejemplo en Hostinger); si no están, se usa pwa/config.json
  const fileCfg = JSON.parse(fs.readFileSync(path.join(PWA, "config.json"), "utf8"));
  const config = { url: process.env.VP_SUPABASE_URL || fileCfg.url, key: process.env.VP_SUPABASE_PUBLISHABLE_KEY || fileCfg.key };
  if (/^sb_secret_|service_role/i.test(config.key)) { console.error("Esa es una clave SECRETA de Supabase: nunca va en el navegador. Usa la publicable (sb_publishable_…)."); process.exit(1); }
  const adapter = fs.readFileSync(path.join(PWA, "adapter.js"), "utf8");
  try { new Function(adapter); } catch (e) { console.error("Error de sintaxis en pwa/adapter.js:", e.message); process.exit(1); }

  // 01-head va dentro de <head>; el resto de los .html es el cuerpo
  const head = read(htmlFiles[0]), body = htmlFiles.slice(1).map(read).join("\n\n");
  const swRegister = `if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("sw", e)));`;
  const app = `${fs.readFileSync(path.join(PWA, "head.html"), "utf8").trim()}
${head}
</head>
<body>
${body}
<script>window.VP_CONFIG = ${JSON.stringify(config)};</script>
<script>
${adapter.trim()}
</script>
<script>
${js}
</script>
<script>${swRegister}</script>
</body>
</html>
`;
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "index.html"), app);
  fs.copyFileSync(path.join(PWA, "manifest.webmanifest"), path.join(DIST, "manifest.webmanifest"));
  fs.copyFileSync(path.join(PWA, ".htaccess"), path.join(DIST, ".htaccess"));
  // El servidor también va dentro de dist/, por si el hosting busca el archivo de entrada en el directorio de salida
  fs.copyFileSync(path.join(__dirname, "server.js"), path.join(DIST, "server.js"));
  fs.writeFileSync(path.join(DIST, "package.json"), JSON.stringify({ name: "voz-propia-dist", private: true, scripts: { start: "node server.js" }, engines: { node: ">=20" } }, null, 2) + "\n");
  const icons = require("./scripts/icons.js")(path.join(DIST, "icons"));
  // La versión del service worker cambia con el contenido: así cada publicación se descarga sola
  const version = require("crypto").createHash("sha256").update(app).digest("hex").slice(0, 12);
  fs.writeFileSync(path.join(DIST, "sw.js"), fs.readFileSync(path.join(PWA, "sw.js"), "utf8").replace("__VERSION__", version));
  console.log(`dist/ listo · index.html ${(app.length / 1024).toFixed(1)} KB · ${icons.length} íconos · versión ${version}`);
}
