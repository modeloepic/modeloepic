/* Epic v40 — Regla comercial «PAGA 2 DEPORTES, DESBLOQUEA TODO».
 *
 * Orden de Fernando (2026-10-26): se elimina el Paquete Total de la
 * oferta (las temporadas no coinciden; no se puede prometer los 5
 * deportes siempre) y se sustituye por la regla de desbloqueo: con dos
 * suscripciones pagadas de deportes distintos, la cuenta accede a TODAS
 * las secciones. Este script es la pieza publicitaria de esa regla
 * (banner pegado a la zona de compra de Planes) + la letra pequeña
 * presentable con TODAS las reglas finas al pie de la sección.
 *
 * Es aditivo a propósito (mismo patrón que renewal-note.js v36): no
 * toca el bundle compilado. Si React re-renderiza y se lleva las
 * piezas o las mueve, el MutationObserver las vuelve a colocar (una
 * sola copia de cada una, jamás duplicadas). Bilingüe como el sitio:
 * lee localStorage["epic-lang"] y re-renderiza al cambiar.
 */
(function () {
  "use strict";

  var TXT = {
    es: {
      label: "OFERTA EPIC",
      title: "Paga 2 deportes y desbloquea TODO",
      body: "Elige tus dos deportes y accede a todas las secciones de Epic sin pagar más: los estudios y parlays de cada deporte en temporada, mientras mantengas tus dos suscripciones activas.",
      fineTitle: "Cómo funciona tu acceso completo",
      fine: [
        "El desbloqueo total se activa al mantener activas dos suscripciones pagadas de deportes distintos. Cuentan la modalidad semanal y la mensual, y se pueden combinar.",
        "Mientras ambas suscripciones estén activas, tu cuenta accede a todas las secciones deportivas de Epic sin costo adicional.",
        "Si una de las dos suscripciones vence o se cancela, al terminar su período ya pagado el acceso vuelve al deporte que permanezca activo.",
        "Cada deporte publica estudios y parlays a diario únicamente durante su temporada; fuera de temporada no se genera contenido nuevo de ese deporte.",
        "EPICGRATIS: 100% de descuento en el primer pago de tu segundo deporte en plan mensual. Tope de 100 redenciones y un uso por usuario.",
        "El Paquete Total ya no se ofrece como producto separado.",
      ],
    },
    en: {
      label: "EPIC OFFER",
      title: "Pay for 2 sports, unlock EVERYTHING",
      body: "Pick your two sports and access every Epic section at no extra cost: the studies and parlays of each sport in season, while both of your subscriptions stay active.",
      fineTitle: "How your full access works",
      fine: [
        "The all-sports unlock activates when you keep two paid subscriptions to different sports active. Weekly and monthly plans both count and can be combined.",
        "While both subscriptions are active, your account accesses every Epic sports section at no additional cost.",
        "If one of the two subscriptions expires or is cancelled, once its paid period ends your access returns to the sport that remains active.",
        "Each sport publishes studies and parlays daily only during its season; out of season, no new content is produced for that sport.",
        "EPICGRATIS: 100% off the first payment of your second sport on a monthly plan. Capped at 100 redemptions, one use per user.",
        "The Total Package is no longer offered as a separate product.",
      ],
    },
  };

  /* Candado abierto en trazo; el color lo pone CSS (currentColor). */
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="4" y="11" width="16" height="10" rx="2"></rect>' +
    '<path d="M8 11V7a4 4 0 0 1 7.5-2"></path>' +
    '<circle cx="12" cy="16" r="1.4"></circle>' +
    "</svg>";

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderBanner(banner) {
    var L = TXT[lang()];
    banner.setAttribute("aria-label", L.title);
    banner.innerHTML = "";
    var icon = el("span", "ur-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICON;
    banner.appendChild(icon);
    var text = el("div", "ur-text");
    text.appendChild(el("p", "ur-label", L.label));
    text.appendChild(el("p", "ur-title", L.title));
    text.appendChild(el("p", "ur-body", L.body));
    banner.appendChild(text);
    banner.setAttribute("data-ur-lang", lang());
  }

  function renderFine(fine) {
    var L = TXT[lang()];
    fine.setAttribute("aria-label", L.fineTitle);
    fine.innerHTML = "";
    fine.appendChild(el("h4", "ur-fine-title", L.fineTitle));
    for (var i = 0; i < L.fine.length; i++) {
      fine.appendChild(el("p", null, L.fine[i]));
    }
    fine.setAttribute("data-ur-lang", lang());
  }

  /* El nodo ANTES del cual va el banner (null = al final de la sección):
     primero la nota de renovación si está dentro de la sección (el
     banner es la publicidad y va antes), si no el selector de pago. */
  function findBannerNext(section) {
    var note = section.querySelector("#renovacion-automatica");
    if (note) return note;
    var tab = section.querySelector('[role="tablist"]');
    if (tab) return tab;
    var asides = section.querySelectorAll("aside");
    for (var i = 0; i < asides.length; i++) {
      return asides[i].parentElement;
    }
    return null;
  }

  function dedupe(id) {
    var copies = document.querySelectorAll("#" + id);
    for (var i = 1; i < copies.length; i++) {
      if (copies[i].parentNode) copies[i].parentNode.removeChild(copies[i]);
    }
    return copies.length ? copies[0] : null;
  }

  function update() {
    var section = document.querySelector("section#planes");
    var banner = dedupe("desbloqueo-banner");
    var fine = dedupe("desbloqueo-reglas");
    if (!section) {
      /* Sin sección de Planes en esta vista: las piezas no quedan. */
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      if (fine && fine.parentNode) fine.parentNode.removeChild(fine);
      return;
    }
    if (!banner) {
      banner = document.createElement("aside");
      banner.id = "desbloqueo-banner";
      banner.className = "ur-banner";
      renderBanner(banner);
    } else if (banner.getAttribute("data-ur-lang") !== lang()) {
      renderBanner(banner);
    }
    if (!fine) {
      fine = document.createElement("div");
      fine.id = "desbloqueo-reglas";
      fine.className = "ur-fine";
      renderFine(fine);
    } else if (fine.getAttribute("data-ur-lang") !== lang()) {
      renderFine(fine);
    }
    /* Banner: dentro de la sección, antes de su ancla. */
    var next = findBannerNext(section);
    var placed =
      banner.parentNode === section &&
      (next ? banner.nextElementSibling === next : banner === section.lastElementChild);
    if (!placed) {
      if (next) section.insertBefore(banner, next);
      else section.appendChild(banner);
    }
    /* Letra pequeña: último hijo de la sección. */
    if (fine.parentNode !== section || fine !== section.lastElementChild) {
      section.appendChild(fine);
    }
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      update();
    }, 120);
  }

  function start() {
    update();
    var mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(update, 800);
    window.addEventListener("hashchange", schedule);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
