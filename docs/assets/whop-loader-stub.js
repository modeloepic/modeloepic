/* Epic v42 — Stub deliberado del loader de checkout embebido de Whop.
 *
 * El 2026-10-27 se verificó en vivo que la ruta embebida de Whop
 * (whop.com/embedded/checkout/<planId>/) devuelve «This checkout is no
 * longer available» para TODOS los enlaces de este negocio — viejos,
 * gratis y hasta uno recién creado y Visible — mientras el checkout
 * estándar (whop.com/checkout/<planId>) funciona perfecto. El panel de
 * Whop no ofrece ningún ajuste de embebido/dominios que lo corrija.
 *
 * Por eso app.js apunta aquí en vez de a js.whop.com: el modal de pago
 * ya no monta el iframe roto, y checkout-fix.js inyecta en su lugar el
 * botón hacia el checkout estándar de Whop. Si Whop repara su ruta
 * embebida, basta revertir la URL del loader en app.js y retirar
 * checkout-fix.js.
 */
(function () {
  "use strict";
  /* Sin operaciones a propósito. */
})();
