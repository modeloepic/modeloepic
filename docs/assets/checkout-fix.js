/* Epic v42 — Pago por el checkout estándar de Whop (arreglo 2026-10-27).
 *
 * Problema verificado en vivo: la ruta embebida de Whop devuelve
 * «This checkout is no longer available» para todos los planes de
 * Modelo Epic (el endpoint embebido falla del lado de Whop, también
 * con enlaces nuevos), y 5 de los 10 plan IDs del bundle traían
 * caracteres mal transcritos (corregidos en app.js en esta versión).
 *
 * Arreglo: el loader embebido quedó sustituido por un stub
 * (whop-loader-stub.js), así el modal «Completa tu compra» ya no monta
 * el iframe roto. Este script observa el DOM y, cuando aparece el
 * contenedor del checkout (.co-embed) con su plan ID, inyecta dentro
 * un botón real hacia el checkout estándar de Whop
 * (https://whop.com/checkout/<planId>), que sí funciona, llevando el
 * código promocional si el modal trae uno. Es un enlace normal que
 * toca el usuario: sin riesgo de bloqueo de ventanas emergentes.
 * Aditivo, mismo patrón que renewal-note.js / unlock-rule.js.
 */
(function () {
  "use strict";

  var TXT = {
    es: {
      note: "Tu pago se completa en la página segura de Whop.",
      btn: "Ir al pago seguro en Whop",
    },
    en: {
      note: "Your payment is completed on Whop's secure page.",
      btn: "Continue to secure checkout on Whop",
    },
  };

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  function patch(embed) {
    if (!embed || embed.getAttribute("data-cf-done") === "1") return;
    var planId = embed.getAttribute("data-whop-checkout-plan-id");
    if (!planId) return;
    embed.setAttribute("data-cf-done", "1");

    var promo = embed.getAttribute("data-whop-checkout-promo-code");
    var url = "https://whop.com/checkout/" + planId;
    if (promo) url += "?promo_code=" + encodeURIComponent(promo);

    var t = TXT[lang()];
    var wrap = document.createElement("div");
    wrap.className = "cf-wrap";

    var note = document.createElement("p");
    note.className = "cf-note";
    note.textContent = t.note;
    wrap.appendChild(note);

    var a = document.createElement("a");
    a.className = "cf-btn";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = t.btn + " →";
    wrap.appendChild(a);

    embed.appendChild(wrap);

    /* El modal muestra «Cargando el pago seguro…» hasta ver un iframe;
     * como ya no hay iframe, se oculta ese texto al inyectar el botón. */
    var body = embed.closest ? embed.closest(".co-body") : null;
    if (body) {
      var loading = body.querySelector(".co-loading");
      if (loading) loading.style.display = "none";
    }
  }

  function scan() {
    var nodes = document.querySelectorAll(
      ".co-embed[data-whop-checkout-plan-id]"
    );
    for (var i = 0; i < nodes.length; i++) patch(nodes[i]);
  }

  var observer = new MutationObserver(function () {
    scan();
  });

  function start() {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
