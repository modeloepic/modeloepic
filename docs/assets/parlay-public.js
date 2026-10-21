/* Epic v30 — Parlay Epic público y gratis.
 *
 * Lee por REST (clave anónima, la misma del bundle) las filas kind='parlay'
 * de hoy de la tabla premium_content y las pinta en una sección pública
 * (#parlay-publico) justo ANTES de la sección de planes (#planes), sin
 * cuenta ni suscripción. La lectura pública de kind='parlay' la permite
 * la política RLS de la base; los estudios (kind='estudio') siguen
 * protegidos por suscripción.
 *
 * Es aditivo a propósito: no toca el bundle compilado. Si React re-renderiza
 * y se lleva la sección, el MutationObserver la vuelve a insertar.
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
      sub: "El Parlay Epic del día, público y gratis para todos: múltiples selecciones con cuota de +400 a +500, elegido por el equipo Epic.",
      oddsLabel: "Cuota total",
      probLabel: "Prob. del modelo",
      loading: "Cargando el Parlay Epic de hoy…",
      notYet:
        "El Parlay Epic de hoy aún no se publica. Vuelve en un rato: aparecerá aquí mismo, gratis para todos.",
    },
    en: {
      title: "Epic Parlay",
      badge: "FREE",
      sub: "The day's Epic Parlay, public and free for everyone: multiple selections at +400 to +500 odds, picked by the Epic team.",
      oddsLabel: "Total odds",
      probLabel: "Model prob.",
      loading: "Loading today's Epic Parlay…",
      notYet:
        "Today's Epic Parlay isn't published yet. Check back shortly: it will appear right here, free for everyone.",
    },
  };

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
     cuota_combinada / combined_odds y la cuota por selección. */
  function normalize(body) {
    var out = { picks: [], total: null, nota: null, garantia: null };
    if (!body || typeof body !== "object") return out;
    var arr = body.selecciones || body.selections || body.legs || body.picks;
    if (Array.isArray(arr)) {
      arr.forEach(function (p) {
        if (!p || typeof p !== "object") return;
        out.picks.push({
          deporte: str(p.deporte, p.sport),
          juego: str(p.juego, p.game, p.partido, p.matchup),
          linea: str(p.linea, p.line, p.pick, p.seleccion, p.mercado),
          cuota: str(p.cuota, p.odds),
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
    out.garantia = str(body.garantia, body.guarantee);
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
        if (p.cuota) li.appendChild(el("span", "pp-cuota", p.cuota));
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
    if (n.garantia) card.appendChild(el("p", "pp-note", n.garantia));
    return card;
  }

  var state = { rows: null, error: false, fetchedFor: "" };

  function renderSection() {
    var sec = document.getElementById("parlay-publico");
    if (!sec) return;
    var L = TXT[lang()];
    sec.setAttribute("aria-label", L.title);
    sec.innerHTML = "";
    var head = el("div", "pp-head");
    head.appendChild(el("h2", "pp-title", L.title));
    var badge = el("span", "pp-badge gold-fill", L.badge);
    head.appendChild(badge);
    sec.appendChild(head);
    sec.appendChild(el("p", "pp-sub", L.sub));
    if (state.rows === null) {
      sec.appendChild(el("p", "pp-empty", L.loading));
      return;
    }
    if (!state.rows.length) {
      sec.appendChild(el("p", "pp-empty", L.notYet));
      return;
    }
    state.rows.forEach(function (row) {
      sec.appendChild(renderCard(row, L));
    });
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
      "&published=eq.true&order=created_at.asc";
    fetch(q, {
      headers: { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY },
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(function (rows) {
        state.rows = Array.isArray(rows) ? rows : [];
        renderSection();
      })
      .catch(function () {
        state.rows = [];
        renderSection();
      });
  }

  function ensureInserted() {
    var planes = document.querySelector("section#planes");
    if (!planes) return;
    var sec = document.getElementById("parlay-publico");
    if (!sec) {
      sec = document.createElement("section");
      sec.id = "parlay-publico";
      sec.className = "pp-section";
      planes.parentNode.insertBefore(sec, planes);
      renderSection();
      fetchRows();
    } else if (sec.nextElementSibling !== planes) {
      planes.parentNode.insertBefore(sec, planes);
    }
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      ensureInserted();
    }, 120);
  }

  function start() {
    ensureInserted();
    var mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["lang"],
    });
    var lastLang = lang();
    setInterval(function () {
      if (lang() !== lastLang) {
        lastLang = lang();
        state.fetchedFor = "";
        renderSection();
        fetchRows();
      }
    }, 800);
    window.addEventListener("hashchange", schedule);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
