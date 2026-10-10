# Voz Propia

App personal para practicar inglés (B1–C2) y francés (A1–B2): plan diario, repaso espaciado, lecturas en primera persona, corrección de lo que dices y práctica de conjugación.

Funciona de dos formas con el mismo código:

- **App instalable** (celular, tablet): se publica en Hostinger. Sus datos y Claude pasan por la función `vp` de Supabase. Funciona sin conexión con lo ya guardado.
- **Artefacto de Claude**: `index.html` dentro de Claude, con la base de datos del artefacto.

## Estructura

- `src/` — la app en módulos, en orden: diseño (`01-head.html`), estructura (`02-body.html`), núcleo (`10-core.js`), datos (`20`–`24`), repaso espaciado (`30`), Hoy (`40`), Leer (`50`), Hablar (`60`), Practicar (`70`), Biblioteca (`80`) y navegación (`90`).
- `pwa/` — lo propio de la app instalable: `adapter.js` (conecta la app con la función `vp` y pide la llave del dispositivo), `sw.js` (modo sin conexión), `manifest.webmanifest`, `head.html` y `config.json` (URL del proyecto y clave pública).
- `scripts/icons.js` — genera los íconos desde el logo del ascensor en `src/02-body.html`.
- `supabase/` — las migraciones y la función `vp`: revisa la llave del dispositivo, guarda los datos y llama a Claude con la clave guardada como secreto.
- `build.js` — une todo. `dev/mock.js` — un Claude simulado para probar sin gastar uso. `dev/serve.js` — sirve `dist/` en local.

## Cómo trabajar

```bash
npm ci
npm run build:pwa      # genera dist/ (app instalable)
node dev/serve.js      # la abre en http://localhost:5180
npm test               # genera dev/test.html con el Claude simulado
npm run build          # genera index.html (versión artefacto)
```

Cada push a `main` compila la app y la deja en la rama `hostinger` (`.github/workflows/deploy.yml`). Hostinger copia esa rama a `public_html`.

## Seguridad y datos

- App personal, sin cuentas. Cada dispositivo entra una vez con el enlace personal `https://DOMINIO/#k=LLAVE`, y la llave queda guardada en ese dispositivo. En la base solo se guarda su huella SHA-256 (`public.app_keys`); la llave nunca está en este repositorio.
- Los datos (perfil, temas, lecturas, tarjetas y progreso) están en `public.vp_docs`, sin acceso público: solo la función `vp` los lee y escribe.
- La clave de Anthropic vive solo como secreto de la función (`ANTHROPIC_API_KEY`).
- `pwa/config.json` contiene solo la URL del proyecto y la clave **publicable** de Supabase.
- Para cambiar la llave: crear una nueva, guardar su huella en `public.app_keys` y marcar la anterior con `revoked_at = now()`.
