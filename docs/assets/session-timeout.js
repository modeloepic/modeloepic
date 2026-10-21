/* Epic v35 — Cierre automático de sesión por inactividad (10 minutos).
 *
 * Orden de Fernando (2026-10-21): si un usuario con sesión iniciada deja
 * la página abierta sin actividad durante 10 minutos, la sesión se cierra
 * sola. La actividad se comparte entre pestañas (marca en localStorage),
 * así que basta con que UNA pestaña esté activa para no cerrar.
 *
 * Script aditivo e independiente (mismo patrón que parlay-public.js):
 * no toca el bundle compilado ni el DOM; su único efecto visible es la
 * recarga final, ya sin sesión. Un visitante anónimo nunca se ve
 * afectado: sin sesión en localStorage, este script no hace nada.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://rhrkmcfbcdnwjjhtupqx.supabase.co";
  var ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocmttY2ZiY2Rud2pqaHR1cHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTQyNjAsImV4cCI6MjEwODA3MDI2MH0.3oEIBUxPdOEj9swiIReTYNMkcepxCB8oiiIz_ks-ckA";

  /* Clave de sesión de supabase-js, confirmada en el bundle:
     `sb-${hostname.split(".")[0]}-auth-token` → proyecto
     rhrkmcfbcdnwjjhtupqx → la clave de abajo. */
  var SESSION_KEY = "sb-rhrkmcfbcdnwjjhtupqx-auth-token";
  var ACTIVITY_KEY = "epic-last-activity";

  var TIMEOUT_MS = 10 * 60 * 1000; /* 10 minutos de inactividad */
  var CHECK_MS = 15 * 1000; /* vigilancia cada 15 s */
  var WRITE_EVERY_MS = 5 * 1000; /* escritura a localStorage estrangulada */

  var lastActivity = Date.now(); /* la marca arranca al cargar el script */
  var lastWrite = 0;
  var closed = false; /* el cierre se ejecuta una sola vez */

  function readStoredActivity() {
    try {
      var v = parseInt(window.localStorage.getItem(ACTIVITY_KEY), 10);
      return isFinite(v) ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeStoredActivity(t) {
    lastWrite = t;
    try {
      window.localStorage.setItem(ACTIVITY_KEY, String(t));
    } catch (e) {
      /* almacenamiento no disponible: manda la marca en memoria */
    }
  }

  /* La actividad «real» es la más reciente entre esta pestaña (memoria)
     y cualquier otra (localStorage compartido). */
  function effectiveActivity() {
    var stored = readStoredActivity();
    return stored > lastActivity ? stored : lastActivity;
  }

  function markActivity() {
    var t = Date.now();
    lastActivity = t;
    if (t - lastWrite >= WRITE_EVERY_MS) writeStoredActivity(t);
  }

  /* Sesión vigente según supabase-js: JSON en SESSION_KEY con
     access_token (a veces anidado en currentSession en formatos
     antiguos). Sin access_token no hay sesión que cerrar. */
  function getSession() {
    var raw;
    try {
      raw = window.localStorage.getItem(SESSION_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    var sess =
      data && data.currentSession && typeof data.currentSession === "object"
        ? data.currentSession
        : data;
    if (sess && typeof sess.access_token === "string" && sess.access_token) {
      return sess;
    }
    return null;
  }

  function clearSessionKeys() {
    try {
      var doomed = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf("sb-") === 0 && /-auth-token$/.test(k)) {
          doomed.push(k);
        }
      }
      if (doomed.indexOf(SESSION_KEY) === -1) doomed.push(SESSION_KEY);
      doomed.forEach(function (k) {
        window.localStorage.removeItem(k);
      });
    } catch (e) {
      /* pase lo que pase, se intenta la clave principal */
      try {
        window.localStorage.removeItem(SESSION_KEY);
      } catch (e2) {}
    }
  }

  function signOut() {
    if (closed) return;
    var sess = getSession();
    if (!sess) return;
    closed = true;
    function finish() {
      clearSessionKeys();
      window.location.reload();
    }
    try {
      var p = fetch(SUPABASE_URL + "/auth/v1/logout", {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: "Bearer " + sess.access_token,
        },
      });
      if (p && typeof p.then === "function") {
        /* La red puede fallar: el cierre local se hace igual. */
        p.then(finish, finish);
      } else {
        finish();
      }
    } catch (e) {
      finish();
    }
  }

  function check() {
    if (closed) return;
    if (!getSession()) return; /* sin sesión: no hacer absolutamente nada */
    if (Date.now() - effectiveActivity() >= TIMEOUT_MS) signOut();
  }

  var EVENTS = [
    "pointerdown",
    "mousedown",
    "keydown",
    "touchstart",
    "click",
    "scroll",
  ];
  EVENTS.forEach(function (name) {
    window.addEventListener(name, markActivity, { passive: true });
  });

  /* Los temporizadores en segundo plano se estrangulan: al volver a la
     pestaña se reevalúa al instante con el reloj real. */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) check();
  });
  window.addEventListener("focus", check);

  writeStoredActivity(lastActivity); /* arranque: marca = momento de carga */
  setInterval(check, CHECK_MS);
})();
