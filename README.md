# Página Epic — versión estática para hosting propio

Esta carpeta es la página de suscripciones Epic (diseño aprobado por Pedro:
logo héroe, carbón `#0c0c0e–#16161a`, oro `#c9a227/#e6c65c`, Cinzel) lista
para subir a un repositorio de GitHub y publicarse en hosting estático
(Netlify o Vercel) bajo el dominio modeloepic.com.

## Estructura

- `public/` — lo que sirve el hosting. `index.html` + `assets/`
  (`app.js` compilado, `site.css`, `logo-epic.webp`).
- `src/client/` — código fuente del cliente (React + TypeScript).
- `src/server-reference/` — el backend original del artefacto de Muse,
  **solo como referencia**; no se despliega ni hace falta.
- `build-static.ts` — recompila `public/assets/app.js` desde la fuente con Bun.
- `netlify.toml` / `vercel.json` — configuración lista para ambos hostings
  (directorio de publicación: `public/`).

## Qué dependía del servidor (y cómo quedó)

El artefacto original era *fullstack* dentro de Muse. Su servidor tenía
**una sola función real**:

| Pieza | Original (fullstack) | En esta versión estática |
|---|---|---|
| Marcadores ESPN | Acción de servidor `getScores` que hacía fetch a ESPN y normalizaba | `src/client/espn.ts`: el navegador pide los mismos feeds públicos de ESPN y normaliza igual |
| Base de datos (`app.db`) | Tabla `entries` de plantilla | **Sin uso real**: la app nunca la leía ni escribía; no hay nada que migrar |
| Registro de picks | Solo texto en la página («alto porcentaje») | Igual: contenido fijo, sin persistencia |
| Resumen de orden / botón de pago | Estado local del navegador; botón sin acción («activación en curso») | Igual: el cobro sigue pendiente de conectar Stripe |

Nada más toca servidor: ni login, ni formularios, ni almacenamiento.

### Por qué el fetch directo a ESPN funciona sin proxy

Los endpoints `https://site.api.espn.com/apis/site/v2/sports/.../scoreboard`
responden con `Access-Control-Allow-Origin: *` (verificado el 2026-10-19),
así que el navegador del visitante puede leerlos directamente. La lógica de
`espn.ts` es un porte fiel de la acción original: mismos 13 feeds (fútbol
limitado a las 9 ligas Epic: Champions, Premier, La Liga, Serie A,
Bundesliga, Ligue 1, Eredivisie, Süper Lig, Primeira; NCAAF con
`groups=80`), misma fecha «de hoy» en America/New_York, mismo orden
(en vivo → próximos → finales) y refresco cada 60 s desde React Query.

La lógica se verificó contra respuestas reales de ESPN del 2026-10-19
(fútbol: 5 ligas con juegos, 6 partidos; NHL: 4; MLB: 1).

**Plan B si ESPN restringe CORS algún día:** montar la acción original
(`src/server-reference/actions.ts`) como función serverless (Netlify/Vercel
Functions) y apuntar `api.ts` de vuelta al endpoint `./actions`.

## Diferencias deliberadas frente al artefacto

1. `client/src/api.ts`: ya no es un cliente RPC; `getScores` se resuelve en
   el navegador. La interfaz (`api.getScores`, tipo `ApiResponse`) es la
   misma para que `App.tsx` no cambie.
2. `App.tsx`: solo dos líneas distintas — `SafeAreaTopScrim` sale de un shim
   local (`shims.tsx`) y el logo se referencia como asset estático
   (`./assets/logo-epic.webp`) en vez de importarse.
3. `main.tsx`: el `QueryClient` compartido del SDK se sustituye por uno
   local estándar.
4. `public/assets/site.css`: es el CSS **ya compilado** del diseño aprobado
   (Tailwind v4 desde `src/client/theme.css`). Si se cambian clases en
   `App.tsx`, hay que regenerarlo con la cadena de Tailwind v4.
5. `public/index.html`: mismo cascarón del build aprobado, con `lang="es"`,
   meta descripción y enlaces a `site.css`/`app.js`.

## Publicar

1. Subir esta carpeta a GitHub (repositorio compartido `modeloepic`).
2. Netlify: «New site from Git» → sin build command, publish directory
   `public` (ya está en `netlify.toml`). Vercel: importar el repo
   (`vercel.json` ya fija `public` como salida).
3. Conectar el dominio modeloepic.com en el panel del hosting y crear en
   Porkbun los registros DNS que el hosting indique.

## Pendientes (no son de esta carpeta)

- **Stripe**: el botón de compra no cobra todavía; el texto de la página ya
  avisa «activación en curso». Requiere la cuenta de Stripe de Pedro.
- **Promoción aprobada (2026-10-19)**: «primeros 3 días de suscripción
  GRATIS» — aprobada por Pedro e incorporada al texto de planes (semanal,
  mensual, Paquete Total y nota del resumen de orden) en `src/client/App.tsx`
  y en el bundle compilado.
- **Segunda Oportunidad**: la página lleva la versión «una sola vez por
  parlay suelto comprado»; el Documento Central lleva la versión con cadena
  de reemplazos. Falta la decisión de Pedro para igualar ambos textos.
