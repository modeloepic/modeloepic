/* Epic v32 — Parlay Epic: tarjeta pública del día, EL GANCHO de la página.
 *
 * v43 (2026-10-27, Luna): SIN CUOTA POR LEG (regla de Pedro) — la tarjeta
 * pública ya NO pinta la cuota individual de cada selección; cada leg se
 * muestra solo con juego y línea, y la única cuota visible es la TOTAL.
 * El body conserva la cuota por leg como dato (no se toca la base).
 *
 * Lee por REST (clave anónima, la misma del bundle) las filas kind='parlay'
 * de hoy de la tabla premium_content y las pinta en una sección pública
 * (#parlay-publico) colocada JUSTO ARRIBA de la sección de marcadores
 * («Juegos de hoy»), sin cuenta ni suscripción. La lectura pública de
 * kind='parlay' la permite la política RLS de la base; los estudios
 * (kind='estudio') siguen protegidos por suscripción.
 *
 * Ancla (verificada en el bundle, componente de marcadores): la sección
 * de marcadores es un <section aria-label="Marcadores en vivo" |
 * "Live scores"> (sin id) cuyo h2 alterna «Juegos de hoy» /
 * «Today's games» y «Marcadores en vivo» / «Live scores» si hay juegos
 * en vivo. Orden de búsqueda del ancla:
 *   1. section[aria-label] de marcadores (atributo estable).
 *   2. La <section> que contenga un encabezado con ese texto.
 *   (La v36 — orden de Pedro, 2026-10-21 — ELIMINÓ el ancla de reserva
 *   section#planes de la v30: con ella, esta sección «Parlay Epic ·
 *   GRATIS» se insertaba también en la página de Planes. Desde la v36
 *   la sección vive SOLO en Inicio: sin sección de marcadores no hay
 *   inserción, y update() además se corta en cualquier ruta que no sea
 *   la principal.)
 *
 * Sin parlay publicado hoy NO se inserta nada: ni caja vacía ni texto.
 * La sección solo existe cuando hay fila de hoy.
 *
 * Es aditivo a propósito: no toca el bundle compilado. Si React
 * re-renderiza y se lleva la sección o la mueve, el MutationObserver la
 * vuelve a colocar en su posición.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://rhrkmcfbcdnwjjhtupqx.supabase.co";
  var ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocmttY2ZiY2Rud2pqaHR1cHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTQyNjAsImV4cCI6MjEwODA3MDI2MH0.3oEIBUxPdOEj9swiIReTYNMkcepxCB8oiiIz_ks-ckA";

  var TXT = {
    es: {
      title: "Parlay Epic",
      badge: "GRATIS",
      oddsLabel: "Cuota total",
      probLabel: "Prob. del modelo",
    },
    en: {
      title: "Epic Parlay",
      badge: "FREE",
      oddsLabel: "Total odds",
      probLabel: "Model prob.",
    },
  };

  /* Textos (aria-label y títulos) de la sección de marcadores en el
     bundle: scoresAria / scoresTitleToday / scoresTitleLive. */
  var SCORES_ARIA = ["Marcadores en vivo", "Live scores"];
  var SCORES_TITLES = [
    "Juegos de hoy",
    "Today's games",
    "Marcadores en vivo",
    "Live scores",
  ];

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  /* Igual que k_() en el bundle: la fecha de hoy en America/New_York. */
  function todayET() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function str() {
    for (var i = 0; i < arguments.length; i++) {
      var v = arguments[i];
      if (typeof v === "string" && v.trim() !== "") return v;
      if (typeof v === "number" && isFinite(v)) return String(v);
    }
    return null;
  }

  function prob(v) {
    if (typeof v === "number" && isFinite(v))
      return Math.round(v > 0 && v <= 1 ? v * 100 : v);
    if (typeof v === "string") {
      var n = parseFloat(v.replace("%", ""));
      if (isFinite(n)) return Math.round(n);
    }
    return null;
  }

  /* Normaliza el body igual que a1() en el bundle, aceptando además
     cuota_combinada / combined_odds. La cuota por selección ya NO se
     lee ni se pinta (regla sin cuota por leg, v43). */
  function normalize(body) {
    var out = { picks: [], total: null, nota: null };
    if (!body || typeof body !== "object") return out;
    var arr = body.selecciones || body.selections || body.legs || body.picks;
    if (Array.isArray(arr)) {
      arr.forEach(function (p) {
        if (!p || typeof p !== "object") return;
        out.picks.push({
          deporte: str(p.deporte, p.sport),
          juego: str(p.juego, p.game, p.partido, p.matchup),
          linea: str(p.linea, p.line, p.pick, p.seleccion, p.mercado),
          probabilidad: prob(
            p.probabilidad != null
              ? p.probabilidad
              : p.prob != null
                ? p.prob
                : p.probability != null
                  ? p.probability
                  : p.prob_modelo,
          ),
        });
      });
    }
    var t = str(
      body.cuota_combinada,
      body.combined_odds,
      body.cuota_total,
      body.cuota,
      body.odds,
      body.total_odds,
      body.momio_total,
    );
    if (t === null) {
      var r = body.cuota_total != null ? body.cuota_total : body.cuota;
      if (typeof r === "number" && isFinite(r)) t = r > 0 ? "+" + r : String(r);
    }
    out.total = t;
    out.nota = str(body.nota, body.note);
    return out;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderCard(row, L) {
    var body = lang() === "en" && row.body_en ? row.body_en : row.body;
    var n = normalize(body);
    var card = el("article", "pp-card");
    var head = el("div", "pp-card-head");
    head.appendChild(el("h3", "pp-card-title", row.title || L.title));
    if (n.total) {
      var odds = el("p", "pp-odds");
      odds.appendChild(el("span", "pp-odds-lab", L.oddsLabel));
      var val = el("span", "pp-odds-val gold-text", n.total);
      odds.appendChild(val);
      head.appendChild(odds);
    }
    card.appendChild(head);
    if (n.picks.length) {
      var ul = el("ul", "pp-list");
      n.picks.forEach(function (p) {
        var li = el("li", "pp-row");
        if (p.deporte) li.appendChild(el("span", "pp-sport", p.deporte));
        var pick = el("span", "pp-pick");
        if (p.juego) pick.appendChild(el("span", "pp-game", p.juego));
        if (p.linea) pick.appendChild(el("span", "pp-line", p.linea));
        li.appendChild(pick);
        if (p.probabilidad !== null) {
          var pr = el("span", "pp-prob");
          pr.appendChild(el("span", "pp-prob-val", p.probabilidad + "%"));
          pr.appendChild(el("span", "pp-prob-lab", L.probLabel));
          li.appendChild(pr);
        }
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
    if (n.nota) card.appendChild(el("p", "pp-note", n.nota));
    return card;
  }

  var state = { rows: null, fetchedFor: "" };

  /* --- Ancla: la sección de marcadores ("Juegos de hoy") ------------- */
  function findScoresSection() {
    var byAria = document.querySelector(
      'section[aria-label="Marcadores en vivo"], section[aria-label="Live scores"]',
    );
    if (byAria) return byAria;
    var heads = document.querySelectorAll("section h1, section h2, section h3");
    for (var i = 0; i < heads.length; i++) {
      var txt = (heads[i].textContent || "").trim();
      if (SCORES_TITLES.indexOf(txt) !== -1) {
        var sec = heads[i].closest ? heads[i].closest("section") : null;
        if (sec) return sec;
      }
    }
    return null;
  }

  function findAnchor() {
    /* v36: SOLO la sección de marcadores (existe únicamente en Inicio).
       Sin el fallback a section#planes, la tarjeta pública ya no puede
       aparecer en la página de Planes. */
    return findScoresSection();
  }

  /* v36: la sección pública del Parlay Epic vive SOLO en Inicio. En
     cualquier otra ruta (#/planes, #/estudios, #/entrar, #/cuenta) no
     se inserta y, si venía insertada de Inicio, se retira. */
  function onHomeRoute() {
    var h = window.location.hash || "";
    return h === "" || h === "#" || h === "#/";
  }

  function contentKey() {
    if (!state.rows) return "";
    return (
      lang() +
      "|" +
      state.rows
        .map(function (r) {
          return r.id || r.title || "";
        })
        .join(",")
    );
  }

  function renderSection(sec) {
    var L = TXT[lang()];
    sec.setAttribute("aria-label", L.title);
    sec.innerHTML = "";
    var head = el("div", "pp-head");
    head.appendChild(el("h2", "pp-title", L.title));
    head.appendChild(el("span", "pp-badge gold-fill", L.badge));
    sec.appendChild(head);
    state.rows.forEach(function (row) {
      sec.appendChild(renderCard(row, L));
    });
    sec.setAttribute("data-pp-key", contentKey());
  }

  /* Inserta/mueve la sección justo antes del ancla. Sin filas de hoy (o
     con error de red) la sección NO existe en el DOM. */
  function update() {
    var sec = document.getElementById("parlay-publico");
    if (!onHomeRoute()) {
      if (sec && sec.parentNode) sec.parentNode.removeChild(sec);
      return;
    }
    var has = !!(state.rows && state.rows.length);
    if (!has) {
      if (sec && sec.parentNode) sec.parentNode.removeChild(sec);
      return;
    }
    var anchor = findAnchor();
    if (!anchor || !anchor.parentNode) {
      /* La vista aún no renderiza marcadores ni planes: el observador
         (y el chequeo periódico) reintentan cuando aparezcan. */
      if (sec && sec.parentNode) sec.parentNode.removeChild(sec);
      return;
    }
    if (!sec) {
      sec = document.createElement("section");
      sec.id = "parlay-publico";
      sec.className = "pp-section";
    }
    if (sec.nextElementSibling !== anchor || sec.parentNode !== anchor.parentNode) {
      anchor.parentNode.insertBefore(sec, anchor);
    }
    if (sec.getAttribute("data-pp-key") !== contentKey()) renderSection(sec);
  }

  function fetchRows() {
    var day = todayET();
    if (state.fetchedFor === day && state.rows !== null) return;
    state.fetchedFor = day;
    var q =
      SUPABASE_URL +
      "/rest/v1/premium_content?select=id,kind,sport,date,title,body,body_en,published" +
      "&kind=eq.parlay&date=eq." +
      day +
      "&published=eq.true&sport=eq.epic&order=created_at.asc";
    fetch(q, {
      headers: { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY },
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(function (rows) {
        state.rows = Array.isArray(rows) ? rows : [];
        update();
      })
      .catch(function () {
        state.rows = [];
        update();
      });
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
    fetchRows();
    update();
    var mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    var lastLang = lang();
    setInterval(function () {
      if (lang() !== lastLang) {
        lastLang = lang();
        state.fetchedFor = "";
        fetchRows();
      }
      update();
    }, 800);
    window.addEventListener("hashchange", schedule);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
