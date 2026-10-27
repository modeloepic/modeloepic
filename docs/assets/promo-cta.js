/* Epic v51 — Del canje a elegir tu deporte, para TODOS los códigos.
 *
 * Regla permanente de Fernando (2026-10-27): cada vez que se cree un
 * código promocional y alguien lo aplique, el flujo debe llevarlo a
 * una página donde escoja QUÉ está cambiando con ESE código. La
 * tarjeta se arma con las condiciones del código aplicado (su
 * alcance y su valor, leídos del estado del bundle en sessionStorage
 * «epic-promo»), nunca con un texto fijo:
 *  - Alcance «total»: vale para los cinco planes mensuales (Fútbol,
 *    NCAAF, NBA, NHL, MLB); la persona decide el deporte.
 *  - Alcance de un deporte: la tarjeta nombra solo ese deporte y el
 *    botón deja ese plan mensual preseleccionado en Planes.
 * El botón navega a Planes (#/planes), activa la pestaña «Mensual»
 * (con reintentos hasta CONFIRMAR que quedó activa — la v49 hacía un
 * solo clic y la pestaña no siempre cambiaba) y, si el código es de
 * un deporte, preselecciona ese plan.
 * Sin código aplicado, este script no muestra nada.
 */
(function () {
  "use strict";

  var APPLIED_KEY = "epic-promo";
  var GOTO_KEY = "epic-promo-goto-monthly";
  var BLOCK_ID = "promo-cta-block";
  var CHECK_MS = 1200;
  var MAX_TRIES = 25;

  var SPORTS = {
    futbol: { es: "Fútbol", en: "Soccer", plan: "Fútbol Epic" },
    ncaaf: { es: "NCAAF", en: "NCAAF", plan: "NCAAF Epic" },
    nba: { es: "NBA", en: "NBA", plan: "NBA Epic" },
    nhl: { es: "NHL", en: "NHL", plan: "NHL Epic" },
    mlb: { es: "MLB", en: "MLB", plan: "MLB Epic" },
  };
  var ALL_KEYS = ["futbol", "ncaaf", "nba", "nhl", "mlb"];

  var TXT = {
    es: {
      title: function (code) {
        return "Tu código " + code + " ya está activo";
      },
      bodyTotal: function (v) {
        return v === 100
          ? "Vale por el primer mes GRATIS (USD 100) de cualquiera de los cinco deportes en plan mensual. Tú decides con cuál lo canjeas:"
          : "Vale por un " +
              v +
              "% de descuento en el primer pago de cualquiera de los cinco deportes en plan mensual. Tú decides con cuál lo canjeas:";
      },
      bodySport: function (v, name) {
        return v === 100
          ? "Vale por el primer mes GRATIS (USD 100) del plan mensual de " +
              name +
              ". Canjéalo aquí:"
          : "Vale por un " +
              v +
              "% de descuento en el primer pago del plan mensual de " +
              name +
              ". Canjéalo aquí:";
      },
      btnTotal: "Elegir mi deporte mensual →",
      btnSport: function (name) {
        return "Elegir mi plan mensual de " + name + " →";
      },
      monthlyTab: "Mensual",
      monthlyTotal: "Total mensual",
    },
    en: {
      title: function (code) {
        return "Your " + code + " code is active";
      },
      bodyTotal: function (v) {
        return v === 100
          ? "It covers the first month FREE (USD 100) of any of the five sports on a monthly plan. You choose which sport to redeem it with:"
          : "It gives " +
              v +
              "% off the first payment of any of the five sports on a monthly plan. You choose which sport to redeem it with:";
      },
      bodySport: function (v, name) {
        return v === 100
          ? "It covers the first month FREE (USD 100) of the " +
              name +
              " monthly plan. Redeem it here:"
          : "It gives " +
              v +
              "% off the first payment of the " +
              name +
              " monthly plan. Redeem it here:";
      },
      btnTotal: "Choose my monthly sport →",
      btnSport: function (name) {
        return "Choose my " + name + " monthly plan →";
      },
      monthlyTab: "Monthly",
      monthlyTotal: "Monthly total",
    },
  };

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  function readApplied() {
    var raw;
    try {
      raw = window.sessionStorage.getItem(APPLIED_KEY);
    } catch (e) {
      return null;
    }
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
    var sc =
      typeof promo.scope_sport === "string" ? promo.scope_sport : "total";
    return SPORTS[sc] ? sc : "total";
  }

  function onAccountRoute() {
    return (window.location.hash || "").indexOf("#/cuenta") === 0;
  }
  function onPlanesRoute() {
    return (window.location.hash || "").indexOf("#/planes") === 0;
  }

  function findRedeemAnchor() {
    var needles = [
      "¿Recibiste un código promocional?",
      "Received a promo code?",
      "Código guardado",
      "Saved code",
    ];
    var all = document.querySelectorAll("h2, h3, h4, p, div, span");
    for (var i = 0; i < all.length; i++) {
      var txt = (all[i].textContent || "").trim();
      for (var j = 0; j < needles.length; j++) {
        if (txt === needles[j] || txt.indexOf(needles[j]) === 0) {
          var node = all[i];
          for (var up = 0; up < 4 && node.parentElement; up++) {
            node = node.parentElement;
            if (node.querySelector && node.querySelector("input, button")) {
              return node;
            }
          }
          return all[i].parentElement || all[i];
        }
      }
    }
    return null;
  }

  function injectCta(promo) {
    var existing = document.getElementById(BLOCK_ID);
    if (existing) {
      if (existing.getAttribute("data-code") === promo.code) return;
      existing.parentElement.removeChild(existing);
    }
    var anchor = findRedeemAnchor();
    if (!anchor || !anchor.parentElement) return;
    var t = TXT[lang()];
    var scope = scopeOf(promo);
    var scopedSport = scope !== "total" ? SPORTS[scope] : null;
    var sportName = scopedSport ? scopedSport[lang()] : null;

    var block = document.createElement("div");
    block.id = BLOCK_ID;
    block.className = "pc-block";
    block.setAttribute("data-code", promo.code);

    var h = document.createElement("p");
    h.className = "pc-title";
    h.textContent = t.title(promo.code);
    block.appendChild(h);

    var p = document.createElement("p");
    p.className = "pc-body";
    p.textContent = scopedSport
      ? t.bodySport(promo.value, sportName)
      : t.bodyTotal(promo.value);
    block.appendChild(p);

    var chips = document.createElement("div");
    chips.className = "pc-chips";
    (scopedSport ? [scope] : ALL_KEYS).forEach(function (key) {
      var chip = document.createElement("span");
      chip.className = "pc-chip";
      chip.textContent = SPORTS[key][lang()];
      chips.appendChild(chip);
    });
    block.appendChild(chips);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pc-btn";
    btn.textContent = scopedSport ? t.btnSport(sportName) : t.btnTotal;
    btn.addEventListener("click", function () {
      try {
        window.sessionStorage.setItem(
          GOTO_KEY,
          JSON.stringify({ sport: scope })
        );
      } catch (e) {}
      tries = 0;
      sportTries = 0;
      window.location.hash = "#/planes";
      setTimeout(maybeActivateMonthly, 350);
    });
    block.appendChild(btn);

    anchor.parentElement.insertBefore(block, anchor.nextSibling);
  }

  /* --- Aterrizaje en Planes: Mensual confirmado + deporte si aplica --- */
  var tries = 0;
  var sportTries = 0;

  function readGoto() {
    try {
      var raw = window.sessionStorage.getItem(GOTO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function clearGoto() {
    try {
      window.sessionStorage.removeItem(GOTO_KEY);
    } catch (e) {}
  }

  /* Las pestañas del bundle son <button role="tab"> cuyo texto
     completo es etiqueta + pista («Mensual» + «Desde $100 / mes»):
     se busca por PREFIJO de la etiqueta, no por igualdad — ese fue
     el fallo de la v49/v50 — y la confirmación es aria-selected. */
  function findMonthlyTab() {
    var t = TXT[lang()];
    var tabs = document.querySelectorAll('[role="tab"]');
    for (var i = 0; i < tabs.length; i++) {
      if ((tabs[i].textContent || "").trim().indexOf(t.monthlyTab) === 0) {
        return tabs[i];
      }
    }
    return null;
  }

  function monthlyConfirmed() {
    var t = TXT[lang()];
    var tab = findMonthlyTab();
    if (tab && tab.getAttribute("aria-selected") === "true") return true;
    return (document.body.textContent || "").indexOf(t.monthlyTotal) !== -1;
  }

  function clickMonthlyTab() {
    var tab = findMonthlyTab();
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  }

  function selectSportPlan(scope) {
    var meta = SPORTS[scope];
    if (!meta) return true;
    /* Confirmación: el resumen ya muestra ese plan. */
    var body = document.body.textContent || "";
    if (body.indexOf(meta.plan) !== -1 && monthlyConfirmed()) {
      /* El nombre del plan aparece también en las tarjetas; basta con
         que el botón de ese plan figure como elegido si existe tal
         marca; si no, se intenta el clic una vez por ciclo. */
    }
    var btns = document.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      var label =
        btns[i].getAttribute("aria-label") || btns[i].textContent || "";
      if (
        label.indexOf(meta.plan) !== -1 &&
        (label.indexOf("Mensual") !== -1 || label.indexOf("Monthly") !== -1)
      ) {
        btns[i].click();
        return true;
      }
    }
    return false;
  }

  function maybeActivateMonthly() {
    var goto = readGoto();
    if (!goto || !onPlanesRoute()) return;
    if (!monthlyConfirmed()) {
      if (tries < MAX_TRIES) {
        tries++;
        clickMonthlyTab();
      } else {
        clearGoto();
      }
      return;
    }
    /* Mensual confirmado. ¿El código es de un deporte? Preseleccionarlo. */
    if (goto.sport && goto.sport !== "total") {
      if (sportTries < 6) {
        sportTries++;
        selectSportPlan(goto.sport);
        return; /* dar unos ciclos y cerrar */
      }
    }
    clearGoto();
  }

  function tick() {
    if (onPlanesRoute()) maybeActivateMonthly();
    if (!onAccountRoute()) return;
    var promo = readApplied();
    if (promo) injectCta(promo);
  }

  window.addEventListener("epic:promo-changed", function () {
    setTimeout(tick, 60);
  });
  window.addEventListener("hashchange", function () {
    tries = 0;
    sportTries = 0;
    setTimeout(tick, 120);
    setTimeout(maybeActivateMonthly, 450);
  });
  setInterval(tick, CHECK_MS);
  tick();
})();
