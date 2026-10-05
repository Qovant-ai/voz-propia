# Voz Propia

App personal para practicar inglés (B1–C2) y francés (A1–B2): plan diario, repaso espaciado, lecturas en primera persona, corrección de lo que dices y práctica de conjugación.

Funciona de dos formas con el mismo código:

- **App instalable** (computador, tablet, teléfono): se publica en GitHub Pages. Usa Supabase para la cuenta y los datos, y una función del servidor para Claude. Funciona sin conexión con lo ya guardado.
- **Artefacto de Claude**: `index.html` dentro de Claude, con la base de datos del artefacto.

## Estructura

- `src/` — la app en módulos, en orden: diseño (`01-head.html`), estructura (`02-body.html`), núcleo (`10-core.js`), datos (`20`–`24`), repaso espaciado (`30`), Hoy (`40`), Leer (`50`), Hablar (`60`), Practicar (`70`), Biblioteca (`80`) y navegación (`90`).
- `pwa/` — lo propio de la app instalable: `adapter.js` (conecta la app con Supabase y trae la pantalla de entrada), `sw.js` (modo sin conexión), `manifest.webmanifest`, `head.html` y `config.json` (URL del proyecto y clave pública).
- `scripts/icons.js` — genera los íconos desde el logo del ascensor en `src/02-body.html`.
- `supabase/` — la migración de la base de datos y la función `claude` (llama a Claude con la clave guardada como secreto).
- `build.js` — une todo. `dev/mock.js` — un Claude simulado para probar sin gastar uso. `dev/serve.js` — sirve `dist/` en local.

## Cómo trabajar

```bash
npm ci
npm run build:pwa      # genera dist/ (app instalable)
node dev/serve.js      # la abre en http://localhost:5180
npm test               # genera dev/test.html con el Claude simulado
npm run build          # genera index.html (versión artefacto)
```

Cada push a `main` publica la app en GitHub Pages con `.github/workflows/deploy.yml`.

## Seguridad y datos

- Los datos personales (perfil, temas, lecturas, tarjetas y progreso) viven en Supabase, protegidos por RLS: cada cuenta solo ve los suyos. No están en este repositorio.
- La clave de Anthropic vive solo como secreto de la función (`ANTHROPIC_API_KEY`). La función exige sesión iniciada y que el correo esté en `public.allowed_users`.
- `pwa/config.json` contiene solo la clave **publicable** de Supabase, que está hecha para ir en el navegador.

## Puesta en marcha (una sola vez)

1. Supabase → Edge Functions → Secrets: agregar `ANTHROPIC_API_KEY`.
2. Supabase → Authentication → URL Configuration: Site URL `https://qovant-ai.github.io/voz-propia/`.
3. GitHub → Settings → Pages → Source: **GitHub Actions**.
4. Abrir la app, «Crear cuenta» con un correo autorizado y confirmar desde el correo. Los datos iniciales se copian solos.
