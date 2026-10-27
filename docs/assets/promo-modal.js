/* Epic v59 — Ventana de opciones al aplicar un código (Fernando, 2026-10-27).
 *
 * Fernando pidió que al aplicar un código promocional — este y
 * todos los futuros — se abra una VENTANA que le diga a la persona
 * qué está canjeando y cuáles son las opciones disponibles para ESE
 * código («estoy canjeando el código de cien dólares y tengo todas
 * estas opciones»), y que desde ahí escoja su suscripción.
 *
 * Comportamiento:
 *  - Se muestra UNA vez por aplicación, cuando el canje ocurre en
 *    esta sesión. El disparador es la TRANSICIÓN del estado
 *    aplicado («epic-promo») de ausente a presente con un código
 *    nuevo en esta vista de página: el canje manual de «Mi cuenta»
 *    solo escribe ese estado y dispara el evento (su manejador en
 *    el bundle NUNCA escribe «epic-promo-result» — verificado en
 *    el código y en vivo el 2026-10-27; las v53–v57, que miraban
 *    el resultado, no abrían la ventana en ese camino).
 *  - La ventana se arma con las condiciones del código aplicado
 *    (alcance y valor del estado «epic-promo»): alcance total lista
 *    los cinco planes mensuales como opciones tocables; alcance de
 *    un deporte lista solo ese plan.
 *  - Tocar una opción cierra la ventana y va DIRECTO al checkout
 *    de Whop del plan mensual de ese deporte (cambio v55, orden de
 *    Fernando: nada de pasar por Planes primero; el cobro se hace
 *    en Whop). Whop no recibe el código por el enlace — verificado
 *    en v46 — así que la ventana recuerda pegarlo en «Add promo
 *    code» de Whop. El botón secundario sí lleva a Planes en
 *    Mensual sin preselección, y la ✕ cierra sin navegar.
 *  - La tarjeta persistente de «Mi cuenta» (v49+) queda como
 *    recordatorio; esta ventana es el momento del canje.
 */
(function () {
  "use strict";

  var APPLIED_KEY = "epic-promo";
  var GOTO_KEY = "epic-promo-goto-monthly";
  var SHOWN_KEY = "epic-promo-modal-shown";
  var MODAL_ID = "promo-modal-overlay";
  var CHECK_MS = 1200;

  var SPORTS = {
    futbol: { es: "Fútbol", en: "Soccer", plan: "Fútbol Epic" },
    ncaaf: { es: "NCAAF", en: "NCAAF", plan: "NCAAF Epic" },
    nba: { es: "NBA", en: "NBA", plan: "NBA Epic" },
    nhl: { es: "NHL", en: "NHL", plan: "NHL Epic" },
    mlb: { es: "MLB", en: "MLB", plan: "MLB Epic" },
  };
  var ALL_KEYS = ["futbol", "ncaaf", "nba", "nhl", "mlb"];

  /* Planes mensuales de Whop, verificados contra el panel y el
     bundle (auditoría 2026-10-27). El checkout estándar es
     https://whop.com/checkout/<planId> — el mismo destino que usa
     checkout-fix.js desde el modal de pago del sitio. */
  var MONTHLY_PLAN_IDS = {
    futbol: "plan_uBL2Bj5iHnTb3",
    ncaaf: "plan_hOUzr71Mn8IPI",
    nba: "plan_6oQYfDyUdoquf",
    nhl: "plan_bxvO6X36T8quS",
    mlb: "plan_OGB3MQMIsVsHT",
  };

  var TXT = {
    es: {
      title: function (code) {
        return "¡Tu código " + code + " está activo!";
      },
      subTotal: function (v) {
        return v === 100
          ? "Estás canjeando tu código de USD 100: el primer mes de tu suscripción mensual sale GRATIS. Estas son las opciones que tienes para canjearlo — elige tu deporte:"
          : "Estás canjeando tu código de " +
              v +
              "% de descuento en el primer pago mensual. Estas son las opciones que tienes para canjearlo — elige tu deporte:";
      },
      subSport: function (v, name) {
        return v === 100
          ? "Estás canjeando tu código de USD 100: el primer mes de tu suscripción mensual sale GRATIS. Esta es la opción que tienes para canjearlo:"
          : "Estás canjeando tu código de " +
              v +
              "% de descuento en el primer pago mensual. Esta es la opción que tienes para canjearlo:";
      },
      optionNote: function (v) {
        return v === 100
          ? "Plan mensual · USD 100/mes · primer mes GRATIS con tu código"
          : "Plan mensual · primer pago con " + v + "% de descuento";
      },
      directNote: function (code) {
        return (
          "Recuerda: al tocar tu deporte irás directo al checkout de Whop, y para que tu código sea efectivo debes pegarlo en «Add promo code» de Whop y darle «Apply»: " +
          code
        );
      },
      all: "Ver las opciones en Planes →",
      close: "Cerrar",
    },
    en: {
      title: function (code) {
        return "Your " + code + " code is active!";
      },
      subTotal: function (v) {
        return v === 100
          ? "You are redeeming your USD 100 code: the first month of your monthly subscription is FREE. These are the options you can redeem it with — choose your sport:"
          : "You are redeeming your " +
              v +
              "% off code for the first monthly payment. These are the options you can redeem it with — choose your sport:";
      },
      subSport: function (v, name) {
        return v === 100
          ? "You are redeeming your USD 100 code: the first month of your monthly subscription is FREE. This is the option you can redeem it with:"
          : "You are redeeming your " +
              v +
              "% off code for the first monthly payment. This is the option you can redeem it with:";
      },
      optionNote: function (v) {
        return v === 100
          ? "Monthly plan · USD 100/mo · first month FREE with your code"
          : "Monthly plan · first payment " + v + "% off";
      },
      directNote: function (code) {
        return (
          "Remember: tapping your sport takes you straight to the Whop checkout, and for your code to take effect you must paste it under “Add promo code” on Whop and hit “Apply”: " +
          code
        );
      },
      all: "See the options in Plans →",
      close: "Close",
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

  function readApplied() {
    var raw = ssGet(APPLIED_KEY);
    if (!raw) return null;
    try {
      var t = JSON.parse(raw);
      if (t && typeof t.code === "string" && typeof t.value === "number") {
        return t;
      }
    } catch (e) {}
    return null;
  }

  function scopeOf(promo) {
    var sc = typeof promo.scope_sport === "string" ? promo.scope_sport : "total";
    return SPORTS[sc] ? sc : "total";
  }

  function goToPlanes(sportKey) {
    ssSet(GOTO_KEY, JSON.stringify({ sport: sportKey || "total" }));
    window.location.hash = "#/planes";
  }

  function goToWhop(sportKey) {
    var planId = MONTHLY_PLAN_IDS[sportKey];
    if (!planId) {
      goToPlanes(sportKey);
      return;
    }
    window.location.assign("https://whop.com/checkout/" + planId);
  }

  function closeModal() {
    var el = document.getElementById(MODAL_ID);
    if (el && el.parentElement) el.parentElement.removeChild(el);
  }

  function showModal(promo) {
    if (document.getElementById(MODAL_ID)) return;
    var t = TXT[lang()];
    var scope = scopeOf(promo);
    var scoped = scope !== "total";
    var keys = scoped ? [scope] : ALL_KEYS;

    var overlay = document.createElement("div");
    overlay.id = MODAL_ID;
    overlay.className = "pm-overlay";

    var box = document.createElement("div");
    box.className = "pm-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    var x = document.createElement("button");
    x.type = "button";
    x.className = "pm-close";
    x.setAttribute("aria-label", t.close);
    x.textContent = "✕";
    x.addEventListener("click", closeModal);
    box.appendChild(x);

    var h = document.createElement("p");
    h.className = "pm-title";
    h.textContent = t.title(promo.code);
    box.appendChild(h);

    var sub = document.createElement("p");
    sub.className = "pm-sub";
    sub.textContent = scoped
      ? t.subSport(promo.value, SPORTS[scope][lang()])
      : t.subTotal(promo.value);
    box.appendChild(sub);

    var list = document.createElement("div");
    list.className = "pm-list";
    keys.forEach(function (key) {
      var meta = SPORTS[key];
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "pm-option";
      var name = document.createElement("span");
      name.className = "pm-opt-name";
      name.textContent = meta.plan;
      opt.appendChild(name);
      var note = document.createElement("span");
      note.className = "pm-opt-note";
      note.textContent = t.optionNote(promo.value);
      opt.appendChild(note);
      opt.addEventListener("click", function () {
        closeModal();
        goToWhop(key);
      });
      list.appendChild(opt);
    });
    box.appendChild(list);

    var foot = document.createElement("p");
    foot.className = "pm-foot";
    foot.textContent = t.directNote(promo.code);
    box.appendChild(foot);

    if (!scoped) {
      var all = document.createElement("button");
      all.type = "button";
      all.className = "pm-all";
      all.textContent = t.all;
      all.addEventListener("click", function () {
        closeModal();
        goToPlanes("total");
      });
      box.appendChild(all);
    }

    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    ssSet(SHOWN_KEY, promo.code);
  }

  var seenInit = false;
  var lastSeenCode = null;

  function tick() {
    var promo = readApplied();
    if (!seenInit) {
      /* Primera lectura de esta vista: lo que ya esté aplicado se
         toma como visto (p. ej. una recarga a mitad de sesión) y
         no abre la ventana. */
      seenInit = true;
      lastSeenCode = promo ? promo.code : null;
      return;
    }
    if (!promo) {
      lastSeenCode = null;
      return;
    }
    if (promo.code === lastSeenCode) return;
    lastSeenCode = promo.code;
    if (ssGet(SHOWN_KEY) === promo.code) return;
    if (!document.body) return;
    showModal(promo);
  }

  window.addEventListener("epic:promo-changed", function () {
    setTimeout(tick, 80);
  });
  window.addEventListener("hashchange", function () {
    setTimeout(tick, 150);
  });
  setInterval(tick, CHECK_MS);
  tick();
})();
