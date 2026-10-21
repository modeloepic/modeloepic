/* Epic v36 — Nota elegante de renovación automática en Planes.
 *
 * Orden de Fernando (2026-10-21): en la sección de Planes debe ir una
 * nota de que TODAS las suscripciones se renuevan automáticamente,
 * presentada como una pieza diseñada («chévere, decente y elegante»),
 * no como letra pequeña.
 *
 * La nota (#renovacion-automatica, <aside class="rn-note">, estilos
 * .rn-* en site.css) se inserta dentro de section#planes JUSTO DESPUÉS
 * del bloque de encabezado/intro («Planes y precios») y ANTES del
 * selector de forma de pago (el div role="tablist" del componente K_).
 * Anclas, en orden:
 *   1. Antes del [role="tablist"] de la sección.
 *   2. Antes del bloque en cuadrícula que contiene el resumen
 *      («Tu orden», el <aside> del resumen dentro de la cuadrícula).
 *   3. Como último hijo de la sección.
 *
 * Es aditivo a propósito: no toca el bundle compilado. Si React
 * re-renderiza y se lleva la nota o la mueve, el MutationObserver la
 * vuelve a colocar (una sola, jamás duplicada). Bilingüe como el
 * sitio: lee localStorage["epic-lang"] y re-renderiza al cambiar.
 */
(function () {
  "use strict";

  var TXT = {
    es: {
      label: "RENOVACIÓN AUTOMÁTICA",
      body: "Todas las suscripciones se renuevan automáticamente al final de cada periodo, para que nunca te quedes sin acceso. Sin permanencia: cancela cuando quieras.",
    },
    en: {
      label: "AUTOMATIC RENEWAL",
      body: "All subscriptions renew automatically at the end of each period, so you never lose access. No lock-in: cancel anytime.",
    },
  };

  /* Ícono de renovación: dos flechas circulares en trazo (estilo
     refresh-ccw), en línea; el color lo pone CSS (currentColor). */
  var ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<polyline points="23 4 23 10 17 10"></polyline>' +
    '<polyline points="1 20 1 14 7 14"></polyline>' +
    '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>' +
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

  function renderNote(note) {
    var L = TXT[lang()];
    note.setAttribute("aria-label", L.label);
    note.innerHTML = "";
    var icon = el("span", "rn-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICON;
    note.appendChild(icon);
    var text = el("div", "rn-text");
    text.appendChild(el("p", "rn-label", L.label));
    text.appendChild(el("p", "rn-body", L.body));
    note.appendChild(text);
    note.setAttribute("data-rn-lang", lang());
  }

  /* Bloque en cuadrícula (tarjetas + resumen) que contiene el <aside>
     del resumen «Tu orden»: ancla de reserva si falta el selector. */
  function findSummaryGrid(section) {
    var asides = section.querySelectorAll("aside");
    for (var i = 0; i < asides.length; i++) {
      if (asides[i].id !== "renovacion-automatica") {
        return asides[i].parentElement;
      }
    }
    return null;
  }

  /* El nodo ANTES del cual va la nota (null = al final de la sección). */
  function findNextSibling(section) {
    var tab = section.querySelector('[role="tablist"]');
    if (tab) return tab;
    return findSummaryGrid(section);
  }

  function isPlaced(note, section) {
    if (!note || note.parentNode !== section) return false;
    var next = findNextSibling(section);
    if (next) return note.nextElementSibling === next;
    return note === section.lastElementChild;
  }

  function update() {
    var section = document.querySelector("section#planes");
    var note = document.getElementById("renovacion-automatica");
    if (!section) {
      /* Sin sección de Planes en esta vista: la nota no debe quedar. */
      if (note && note.parentNode) note.parentNode.removeChild(note);
      return;
    }
    /* Jamás duplicada: si hubiera copias extra, se retiran. */
    var copies = document.querySelectorAll("#renovacion-automatica");
    for (var i = 1; i < copies.length; i++) {
      if (copies[i].parentNode) copies[i].parentNode.removeChild(copies[i]);
    }
    if (!note) {
      note = document.createElement("aside");
      note.id = "renovacion-automatica";
      note.className = "rn-note";
      renderNote(note);
    } else if (note.getAttribute("data-rn-lang") !== lang()) {
      renderNote(note);
    }
    if (!isPlaced(note, section)) {
      var next = findNextSibling(section);
      if (next) section.insertBefore(note, next);
      else section.appendChild(note);
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
