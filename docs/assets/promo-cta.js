/* Epic v49 — Del canje a elegir tu deporte (orden de Fernando, 2026-10-27).
 *
 * Fernando pidió que al aplicar un código, la persona no quede
 * suelta en la página: un enlace debe llevarla directo a las
 * suscripciones que puede canjear con ese código — los cinco planes
 * MENSUALES (Fútbol, NCAAF, NBA, NHL, MLB) — para que ella decida
 * con cuál deporte cambia su código de USD 100.
 *
 * Este script aditivo observa el estado aplicado del bundle
 * (sessionStorage «epic-promo», que escriben el canje manual de
 * «Mi cuenta» y el puente v48) y, cuando hay un código activo:
 *  1. En «Mi cuenta» (#/cuenta), junto al área del código, inyecta
 *     la tarjeta «Tu código ya está activo» con los cinco deportes
 *     mensuales y el botón dorado «Elegir mi deporte mensual».
 *  2. Ese botón navega a Planes (#/planes) y deja la pestaña
 *     «Mensual» activa (clic nativo sobre la pestaña), para que la
 *     persona escoja el deporte con su código ya reflejado en el
 *     resumen («Código promocional: … (−100%)», texto nativo).
 * Sin código aplicado no muestra nada.
 */
(function () {
  "use strict";

  var APPLIED_KEY = "epic-promo";
  var GOTO_KEY = "epic-promo-goto-monthly";
  var BLOCK_ID = "promo-cta-block";
  var CHECK_MS = 1200;

  var TXT = {
    es: {
      title: function (code) {
        return "Tu código " + code + " ya está activo";
      },
      body: "Vale por el primer mes GRATIS (USD 100) de cualquiera de los cinco deportes en plan mensual. Tú decides con cuál lo canjeas:",
      sports: ["Fútbol", "NCAAF", "NBA", "NHL", "MLB"],
      btn: "Elegir mi deporte mensual →",
      monthlyTab: "Mensual",
    },
    en: {
      title: function (code) {
        return "Your " + code + " code is active";
      },
      body: "It covers the first month FREE (USD 100) of any of the five sports on a monthly plan. You choose which sport to redeem it with:",
      sports: ["Soccer", "NCAAF", "NBA", "NHL", "MLB"],
      btn: "Choose my monthly sport →",
      monthlyTab: "Monthly",
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

  function onAccountRoute() {
    return (window.location.hash || "").indexOf("#/cuenta") === 0;
  }
  function onPlanesRoute() {
    return (window.location.hash || "").indexOf("#/planes") === 0;
  }

  function findRedeemAnchor() {
    /* El bloque se inserta tras el contenedor del canje: se busca el
       elemento de texto del título del canje o de «Código guardado»
       y se sube a su tarjeta/sección inmediata. */
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
    if (document.getElementById(BLOCK_ID)) return;
    var anchor = findRedeemAnchor();
    if (!anchor || !anchor.parentElement) return;
    var t = TXT[lang()];

    var block = document.createElement("div");
    block.id = BLOCK_ID;
    block.className = "pc-block";

    var h = document.createElement("p");
    h.className = "pc-title";
    h.textContent = t.title(promo.code);
    block.appendChild(h);

    var p = document.createElement("p");
    p.className = "pc-body";
    p.textContent = t.body;
    block.appendChild(p);

    var chips = document.createElement("div");
    chips.className = "pc-chips";
    t.sports.forEach(function (name) {
      var chip = document.createElement("span");
      chip.className = "pc-chip";
      chip.textContent = name;
      chips.appendChild(chip);
    });
    block.appendChild(chips);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pc-btn";
    btn.textContent = t.btn;
    btn.addEventListener("click", function () {
      try {
        window.sessionStorage.setItem(GOTO_KEY, "1");
      } catch (e) {}
      window.location.hash = "#/planes";
      /* Por si ya estamos en Planes (hash sin cambio): actuar ya. */
      setTimeout(maybeActivateMonthly, 350);
    });
    block.appendChild(btn);

    anchor.parentElement.insertBefore(block, anchor.nextSibling);
  }

  function maybeActivateMonthly() {
    var flag;
    try {
      flag = window.sessionStorage.getItem(GOTO_KEY);
    } catch (e) {
      flag = null;
    }
    if (!flag || !onPlanesRoute()) return;
    var t = TXT[lang()];
    var tabs = document.querySelectorAll("button");
    for (var i = 0; i < tabs.length; i++) {
      if ((tabs[i].textContent || "").trim() === t.monthlyTab) {
        try {
          window.sessionStorage.removeItem(GOTO_KEY);
        } catch (e) {}
        tabs[i].click();
        return;
      }
    }
    /* La pestaña aún no renderiza: el intervalo reintenta. */
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
    setTimeout(tick, 120);
    setTimeout(maybeActivateMonthly, 450);
  });
  setInterval(tick, CHECK_MS);
  tick();
})();
