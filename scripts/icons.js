// Genera los íconos de la app instalable a partir del logo (el ascensor) que está en src/02-body.html.
const fs = require("fs"), path = require("path");

// Paleta clara de Valparaíso (las mismas variables de src/01-head.html)
const PALETTE = { bg: "#E8E9E5", ink: "#1F2933", en: "#2D5876", fr: "#963E34", c2: "#C4943A", c5: "#8B7AA0", c6: "#7FA3BA", c7: "#C98468" };

function logoSvg() {
  const body = fs.readFileSync(path.join(__dirname, "..", "src", "02-body.html"), "utf8");
  const m = body.match(/<svg class="brand"[^>]*>([\s\S]*?)<\/svg>/);
  if (!m) throw new Error("No encontré el logo en src/02-body.html");
  return m[1].replace(/<title>[\s\S]*?<\/title>/, "").replace(/var\(--(\w+)\)/g, (_, k) => {
    if (!PALETTE[k]) throw new Error("Color sin definir para el ícono: --" + k);
    return PALETTE[k];
  });
}

// scale: cuánto ocupa el logo del cuadro (los íconos "maskable" necesitan margen para el recorte)
function iconSvg(scale, rounded) {
  const s = scale.toFixed(3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<rect width="120" height="120" ${rounded ? 'rx="26"' : ""} fill="${PALETTE.bg}"/>
<g transform="translate(60 60) scale(${s}) translate(-60 -73)">${logoSvg()}</g>
</svg>`;
}

module.exports = function makeIcons(outDir) {
  const { Resvg } = require("@resvg/resvg-js");
  fs.mkdirSync(outDir, { recursive: true });
  const png = (svg, size, file) => fs.writeFileSync(path.join(outDir, file), new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng());
  fs.writeFileSync(path.join(outDir, "icon.svg"), iconSvg(1.05, true));
  png(iconSvg(1.05, false), 192, "icon-192.png");
  png(iconSvg(1.05, false), 512, "icon-512.png");
  png(iconSvg(0.78, false), 512, "maskable-512.png");
  png(iconSvg(0.9, false), 180, "apple-touch-icon.png");
  return ["icon.svg", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png"];
};
