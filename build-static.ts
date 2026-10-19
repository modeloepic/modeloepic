// Recompila el bundle estático desde src/client/ hacia public/assets/app.js.
//
// Requisitos: Bun (https://bun.sh) y las dependencias del cliente instaladas
// junto a esta carpeta (react, react-dom, @tanstack/react-query):
//   bun install react@19 react-dom@19 @tanstack/react-query@5
// Uso:
//   bun build-static.ts
//
// Nota: el CSS (public/assets/site.css) NO se recompila aquí: es el CSS ya
// compilado del diseño aprobado (Tailwind v4 desde src/client/theme.css).
// Si cambian las clases de App.tsx hay que regenerarlo con la cadena de
// Tailwind v4 (CLI de Tailwind con el plugin tailwindcss-safe-area).
const result = await Bun.build({
  entrypoints: ["./src/client/main.tsx"],
  outdir: "./public/assets",
  naming: { entry: "app.js" },
  target: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
for (const out of result.outputs) console.log(out.path, out.size);
