/* Epic v63 — Regreso del pago: cierre automático de la ventana de pago.
 *
 * Flujo: checkout-fix.js marca sessionStorage["epic-awaiting-payment"]
 * cuando el cliente toca «Ir al pago seguro en Whop» (el checkout se
 * abre en otra pestaña). Cuando el cliente vuelve a esta pestaña
 * (focus / visibilitychange), este script relee SUS suscripciones con
 * su propio token de sesión (la misma lectura que hace la página). Si
 * ya existe una suscripción activa — el webhook de Whop la escribió
 * segundos después del pago — muestra el aviso de confirmación, cierra
 * la ventana de pago recargando la página ya con el acceso activo y,
 * tras la recarga, enseña el aviso «Tu suscripción ya está activa».
 * Si el pago aún no se refleja, reintenta unos segundos y desiste en
 * silencio: nunca bloquea ni rompe la navegación normal.
 */
(function () {
  "use strict";

  var SB_URL = "https://rhrkmcfbcdnwjjhtupqx.supabase.co";
  var ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocmttY2ZiY2Rud2pqaHR1cHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTQyNjAsImV4cCI6MjEwODA3MDI2MH0.3oEIBUxPdOEj9swiIReTYNMkcepxCB8oiiIz_ks-ckA";
  var MARK_KEY = "epic-awaiting-payment";
  var DONE_KEY = "epic-just-activated";
  var MAX_AGE_MS = 45 * 60 * 1000;
  var MAX_TRIES = 12;
  var RETRY_MS = 5000;

  var TXT = {
    es: {
      confirming: "¡Pago confirmado! Tu suscripción ya está activa. Actualizando tu cuenta…",
      toast: "¡Tu suscripción ya está activa! Ya tienes acceso a tu deporte.",
    },
    en: {
      confirming: "Payment confirmed! Your subscription is now active. Refreshing your account…",
      toast: "Your subscription is now active! You have access to your sport.",
    },
  };

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }
  function ssGet(k) {
    try {
      return window.sessionStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function ssSet(k, v) {
    try {
      window.sessionStorage.setItem(k, v);
    } catch (e) {}
  }
  function ssDel(k) {
    try {
      window.sessionStorage.removeItem(k);
    } catch (e) {}
  }

  function readSession() {
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (!k || k.indexOf("sb-") !== 0 || k.indexOf("-auth-token") < 0) {
          continue;
        }
        var raw = window.localStorage.getItem(k);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        var sess = Array.isArray(parsed) ? parsed[0] : parsed;
        if (sess && sess.access_token && sess.user && sess.user.id) {
          return sess;
        }
      }
    } catch (e) {}
    return null;
  }

  function banner(text) {
    var el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:20000;padding:.85rem 1rem;" +
      "background:#c9a227;color:#101013;font-family:Archivo,sans-serif;" +
      "font-size:1rem;font-weight:800;text-align:center;" +
      "box-shadow:0 4px 24px rgba(0,0,0,.35)";
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  }

  function checkOnce(done) {
    var sess = readSession();
    if (!sess) {
      done(false);
      return;
    }
    var url =
      SB_URL +
      "/rest/v1/subscriptions?user_id=eq." +
      encodeURIComponent(sess.user.id) +
      "&status=eq.active&select=sport,ends_at";
    fetch(url, {
      headers: {
        apikey: ANON_KEY,
        Authorization: "Bearer " + sess.access_token,
      },
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(function (rows) {
        var now = Date.now();
        var active = (rows || []).some(function (row) {
          return !row.ends_at || new Date(row.ends_at).getTime() > now;
        });
        done(active);
      })
      .catch(function () {
        done(false);
      });
  }

  var polling = false;
  function maybeConfirm() {
    var mark = ssGet(MARK_KEY);
    if (!mark) return;
    var age = Date.now() - Number(mark);
    if (!isFinite(age) || age < 0 || age > MAX_AGE_MS) {
      ssDel(MARK_KEY);
      return;
    }
    if (polling) return;
    polling = true;
    var tries = 0;
    (function attempt() {
      tries++;
      checkOnce(function (active) {
        if (active) {
          ssDel(MARK_KEY);
          ssSet(DONE_KEY, "1");
          banner(TXT[lang()].confirming);
          setTimeout(function () {
            window.location.reload();
          }, 1400);
          return;
        }
        if (tries < MAX_TRIES && ssGet(MARK_KEY)) {
          setTimeout(attempt, RETRY_MS);
        } else {
          polling = false;
        }
      });
    })();
  }

  function showToastIfJustActivated() {
    if (!ssGet(DONE_KEY)) return;
    ssDel(DONE_KEY);
    var el = banner(TXT[lang()].toast);
    setTimeout(function () {
      if (el.parentElement) el.parentElement.removeChild(el);
    }, 9000);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) maybeConfirm();
  });
  window.addEventListener("focus", maybeConfirm);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showToastIfJustActivated);
  } else {
    showToastIfJustActivated();
  }
})();
