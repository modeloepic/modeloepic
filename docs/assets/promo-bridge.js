/* Epic v48 — Puente del código promocional del registro.
 *
 * Diagnóstico (2026-10-27, verificado contra el servidor): el código
 * que el visitante escribe al registrarse se guarda como pendiente
 * (localStorage «epic-pending-promo»), pero el canje automático al
 * iniciar sesión NUNCA se ejecuta en el servidor — la cuenta nace sin
 * código aplicado y el modal de pago no lo muestra (caso real:
 * Filiberto; reproducido con cuentas de prueba). Además, el estado
 * del canje del bundle vive en sessionStorage («epic-promo») y se
 * pierde al cerrar la pestaña.
 *
 * Este script aditivo repara el flujo sin tocar el bundle:
 *  1. Respalda el código pendiente en una clave propia durable
 *     (el flujo nativo borra el pendiente antes de su canje fallido).
 *  2. Cuando hay sesión y un código pendiente, hace el canje real
 *     contra redeem_promo con el token de la sesión y escribe el
 *     estado aplicado EXACTAMENTE como lo escribe el bundle
 *     (sessionStorage «epic-promo» {code, value, scope_sport} +
 *     sessionStorage «epic-promo-result» + evento
 *     «epic:promo-changed»), para que el modal de pago lo tome.
 *  3. Guarda copia durable del canje ligada al id del usuario y la
 *     restaura en sesiones futuras (el canje ya no se pierde al
 *     cerrar la pestaña).
 * Sin sesión no hace nada. Si el servidor declara el código inválido
 * (not_found, inactive, expired, exhausted, not_started), limpia el
 * pendiente y no reintenta.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://rhrkmcfbcdnwjjhtupqx.supabase.co";
  var ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocmttY2ZiY2Rud2pqaHR1cHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTQyNjAsImV4cCI6MjEwODA3MDI2MH0.3oEIBUxPdOEj9swiIReTYNMkcepxCB8oiiIz_ks-ckA";

  var SESSION_KEY = "sb-rhrkmcfbcdnwjjhtupqx-auth-token";
  var PENDING_KEY = "epic-pending-promo"; /* del bundle */
  var APPLIED_KEY = "epic-promo"; /* sessionStorage, del bundle */
  var RESULT_KEY = "epic-promo-result"; /* sessionStorage, del bundle */
  var BACKUP_KEY = "epic-promo-pending-backup"; /* propia */
  var SAVED_KEY = "epic-promo-saved"; /* propia, durable */
  var CHANGED_EVENT = "epic:promo-changed";
  var CHECK_MS = 1500;
  var MAX_ATTEMPTS = 10;

  var attempts = 0;
  var inFlight = false;
  var done = false;

  function lsGet(k) {
    try {
      return window.localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function lsSet(k, v) {
    try {
      window.localStorage.setItem(k, v);
    } catch (e) {}
  }
  function lsDel(k) {
    try {
      window.localStorage.removeItem(k);
    } catch (e) {}
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

  function getSession() {
    var raw = lsGet(SESSION_KEY);
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
    if (!sess || typeof sess.access_token !== "string" || !sess.access_token) {
      return null;
    }
    var uid = null;
    var user = sess.user || (data && data.user);
    if (user && typeof user.id === "string") uid = user.id;
    return { token: sess.access_token, uid: uid };
  }

  function readApplied() {
    var raw = ssGet(APPLIED_KEY);
    if (!raw) return null;
    try {
      var t = JSON.parse(raw);
      if (t && typeof t.code === "string" && typeof t.value === "number") {
        return {
          code: t.code,
          value: t.value,
          scope_sport: typeof t.scope_sport === "string" ? t.scope_sport : "total",
        };
      }
    } catch (e) {}
    return null;
  }

  function readSaved() {
    var raw = lsGet(SAVED_KEY);
    if (!raw) return null;
    try {
      var t = JSON.parse(raw);
      if (t && typeof t.code === "string" && typeof t.value === "number") return t;
    } catch (e) {}
    return null;
  }

  function fireChanged() {
    try {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    } catch (e) {}
  }

  function writeApplied(promo, uid) {
    ssSet(
      APPLIED_KEY,
      JSON.stringify({
        code: promo.code,
        value: promo.value,
        scope_sport: promo.scope_sport || "total",
      })
    );
    lsSet(
      SAVED_KEY,
      JSON.stringify({
        code: promo.code,
        value: promo.value,
        scope_sport: promo.scope_sport || "total",
        uid: uid || null,
      })
    );
    fireChanged();
  }

  function writeResult(promo) {
    ssSet(
      RESULT_KEY,
      JSON.stringify({
        ok: true,
        kind: "percent",
        value: promo.value,
        scope_sport: promo.scope_sport || "total",
        reason: null,
        extended: false,
        code: promo.code,
      })
    );
    fireChanged();
  }

  function redeem(code, session) {
    inFlight = true;
    attempts++;
    fetch(SUPABASE_URL + "/rest/v1/rpc/redeem_promo", {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_code: code }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        inFlight = false;
        var row = Array.isArray(data) ? data[0] : data;
        if (
          row &&
          row.ok === true &&
          row.kind === "percent" &&
          typeof row.value === "number"
        ) {
          var promo = {
            code: code,
            value: row.value,
            scope_sport:
              typeof row.scope_sport === "string" ? row.scope_sport : "total",
          };
          writeApplied(promo, session.uid);
          writeResult(promo);
          lsDel(PENDING_KEY);
          lsDel(BACKUP_KEY);
          done = true;
          return;
        }
        var reason = row && typeof row.reason === "string" ? row.reason : null;
        if (
          reason === "not_found" ||
          reason === "inactive" ||
          reason === "expired" ||
          reason === "exhausted" ||
          reason === "not_started"
        ) {
          /* Código definitivamente inválido: no reintentar. */
          lsDel(PENDING_KEY);
          lsDel(BACKUP_KEY);
          done = true;
        }
        /* Cualquier otro resultado (p. ej. sesión aún no lista):
           se reintenta en el siguiente ciclo hasta MAX_ATTEMPTS. */
      })
      .catch(function () {
        inFlight = false;
        /* Red caída: se reintenta en el siguiente ciclo. */
      });
  }

  function tick() {
    if (done || inFlight) return;

    /* 1) Respaldar el pendiente en cuanto aparezca. */
    var pending = lsGet(PENDING_KEY);
    if (pending && pending !== lsGet(BACKUP_KEY)) lsSet(BACKUP_KEY, pending);

    var session = getSession();
    if (!session) return;

    /* 1b) Higiene entre cuentas en el mismo navegador: si el estado
       aplicado visible es la copia durable de OTRO usuario (otro
       uid), se retira de sessionStorage para no mostrar el código
       de una cuenta en otra (detectado en pruebas con cuentas
       consecutivas en el mismo navegador, 2026-10-27). */
    var appliedStale = readApplied();
    var savedStale = readSaved();
    if (
      appliedStale &&
      savedStale &&
      savedStale.uid &&
      session.uid &&
      savedStale.uid !== session.uid &&
      appliedStale.code === savedStale.code
    ) {
      try {
        window.sessionStorage.removeItem(APPLIED_KEY);
        window.sessionStorage.removeItem(RESULT_KEY);
      } catch (e) {}
    }

    /* 2) Si el bundle ya aplicó un canje, sincronizar la copia durable. */
    var applied = readApplied();
    if (applied) {
      var saved = readSaved();
      if (!saved || saved.code !== applied.code || saved.uid !== session.uid) {
        writeApplied(applied, session.uid);
      }
      done = true;
      return;
    }

    /* 3) Restaurar la copia durable de ESTE usuario. */
    var mine = readSaved();
    if (mine && mine.uid && session.uid && mine.uid === session.uid) {
      writeApplied(mine, session.uid);
      done = true;
      return;
    }

    /* 4) Canjear el código pendiente (del registro o respaldado). */
    var code = pending || lsGet(BACKUP_KEY);
    if (code && attempts < MAX_ATTEMPTS) {
      redeem(String(code).trim().toUpperCase(), session);
    } else if (!code) {
      /* Sin nada que hacer por ahora; seguir vigilando por si el
         usuario escribe un código en esta misma visita. */
    } else {
      done = true;
    }
  }

  window.addEventListener("storage", tick);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });
  setInterval(tick, CHECK_MS);
  tick();
})();
