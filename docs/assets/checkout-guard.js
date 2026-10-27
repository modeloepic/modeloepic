/* Epic v47 — Pago solo con cuenta (orden de Fernando, 2026-10-27).
 *
 * Fernando ordenó que para pagar por los servicios haya que estar
 * registrado en la página, para asegurar que el dinero quede ligado
 * a la cuenta que está pagando. Hasta la v46, un visitante sin sesión
 * podía abrir el modal de pago y pagar en Whop sin tener cuenta.
 *
 * Este script aditivo (mismo patrón que session-timeout.js, cuya
 * detección de sesión reutiliza exacta: la clave de supabase-js en
 * localStorage) actúa solo cuando NO hay sesión:
 *  1. Intercepta en fase de captura los clics en los botones de
 *     suscripción de Planes (aria-label «Continuar al pago de … en
 *     Whop» / «Continue to Whop checkout for …») y los frena antes
 *     de que React abra el modal de pago.
 *  2. Red de seguridad: si el modal de pago (.co-overlay) aparece
 *     sin sesión por cualquier otra vía, lo cierra al instante.
 *  3. Muestra el aviso de por qué y lleva al usuario a crear su
 *     cuenta o iniciar sesión (clic programático en el botón de
 *     acceso del encabezado).
 * Con sesión iniciada no hace absolutamente nada: el flujo de pago
 * queda intacto.
 */
(function () {
  "use strict";

  var SESSION_KEY = "sb-rhrkmcfbcdnwjjhtupqx-auth-token";

  var TXT = {
    es: {
      msg: "Para suscribirte, primero crea tu cuenta o inicia sesión: así tu pago queda ligado a tu cuenta.",
      btn: "Crear cuenta / Iniciar sesión",
    },
    en: {
      msg: "To subscribe, first create your account or log in: that way your payment is linked to your account.",
      btn: "Create account / Log in",
    },
  };

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  /* Misma lectura de sesión que session-timeout.js (v35). */
  function hasSession() {
    var raw;
    try {
      raw = window.localStorage.getItem(SESSION_KEY);
    } catch (e) {
      return false;
    }
    if (!raw) return false;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return false;
    }
    var sess =
      data && data.currentSession && typeof data.currentSession === "object"
        ? data.currentSession
        : data;
    return !!(sess && typeof sess.access_token === "string" && sess.access_token);
  }

  function isSubscribeCta(el) {
    var btn = el && el.closest ? el.closest("button") : null;
    if (!btn) return false;
    var label = btn.getAttribute("aria-label") || "";
    return (
      label.indexOf("Continuar al pago de ") === 0 ||
      label.indexOf("Continue to Whop checkout for ") === 0
    );
  }

  function openAuth() {
    var candidates = document.querySelectorAll("button, a");
    var fallback = null;
    for (var i = 0; i < candidates.length; i++) {
      var txt = (candidates[i].textContent || "").trim();
      if (txt === "Crear cuenta" || txt === "Create account") {
        candidates[i].click();
        return;
      }
      if (!fallback && (txt === "Iniciar sesión" || txt === "Log in")) {
        fallback = candidates[i];
      }
    }
    if (fallback) fallback.click();
  }

  var toastEl = null;
  function showNotice() {
    var t = TXT[lang()];
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cg-toast";
      toastEl.setAttribute("role", "alertdialog");
      toastEl.setAttribute("aria-live", "polite");

      var p = document.createElement("p");
      p.className = "cg-msg";
      toastEl.appendChild(p);

      var b = document.createElement("button");
      b.type = "button";
      b.className = "cg-btn";
      b.addEventListener("click", function () {
        hideNotice();
        openAuth();
      });
      toastEl.appendChild(b);

      var x = document.createElement("button");
      x.type = "button";
      x.className = "cg-close";
      x.setAttribute("aria-label", "Cerrar / Close");
      x.textContent = "✕";
      x.addEventListener("click", hideNotice);
      toastEl.appendChild(x);

      document.body.appendChild(toastEl);
    }
    toastEl.querySelector(".cg-msg").textContent = t.msg;
    toastEl.querySelector(".cg-btn").textContent = t.btn;
    toastEl.classList.add("cg-show");
  }

  function hideNotice() {
    if (toastEl) toastEl.classList.remove("cg-show");
  }

  /* 1) Puerta en los botones de suscripción (fase de captura: corre
   *    antes que el listener raíz de React). */
  document.addEventListener(
    "click",
    function (e) {
      if (hasSession()) return;
      if (isSubscribeCta(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        showNotice();
      }
    },
    true
  );

  /* 2) Red de seguridad sobre el modal de pago, venga de donde venga. */
  var observer = new MutationObserver(function () {
    if (hasSession()) return;
    var overlay = document.querySelector(".co-overlay");
    if (overlay) {
      var close = overlay.querySelector(".co-close");
      if (close) close.click();
      showNotice();
    }
  });

  function start() {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
