/* Epic v42/v46/v63 — Pago por el checkout estándar de Whop.
 *
 * Problema verificado en vivo (2026-10-27): la ruta embebida de Whop
 * devuelve «This checkout is no longer available» para todos los
 * planes de Modelo Epic (el endpoint embebido falla del lado de Whop,
 * también con enlaces nuevos), así que el loader embebido quedó
 * sustituido por un stub (whop-loader-stub.js) y este script inyecta
 * en el modal «Completa tu compra» el botón hacia el checkout
 * estándar de Whop (https://whop.com/checkout/<planId>), que sí
 * funciona. Es un enlace normal que toca el usuario: sin riesgo de
 * bloqueo de ventanas emergentes.
 *
 * v46 (2026-10-27): verificado en vivo que Whop NO aplica el código
 * promocional desde el enlace (ni con ?promo_code= ni con ?promo=):
 * el checkout llega con el campo «Add promo code» vacío. Por eso,
 * cuando el modal trae un código canjeado en el sitio, este script lo
 * muestra en grande dentro del modal, con botón de copiar y la
 * instrucción de pegarlo en Whop; y si no trae código, deja la pista
 * de dónde se ingresa en Whop. El texto del bundle que decía que el
 * código «va aplicado en la ventana de pago» se corrigió en app.js
 * en esta misma versión.
 *
 * Aditivo, mismo patrón que renewal-note.js / unlock-rule.js.
 */
(function () {
  "use strict";

  var TXT = {
    es: {
      note: "Tu pago se completa en la página segura de Whop.",
      btn: "Ir al pago seguro en Whop",
      codeLabel: "Tu código de descuento",
      copy: "Copiar",
      copied: "¡Copiado!",
      step: "En la página de Whop, toca «Add promo code», pega este código y dale «Apply» para activar tu descuento.",
      hint: "¿Tienes un código de descuento? En la página de Whop lo ingresas en «Add promo code».",
      emailTitle: "⚠ MUY IMPORTANTE: usa el mismo correo",
      emailBody: "Paga en Whop con el MISMO correo de tu cuenta Epic, este con el que iniciaste sesión aquí. Tu suscripción se activa automáticamente con ese correo apenas completes el pago. Si pagas con otro correo, tu acceso no se activará solo.",
    },
    en: {
      note: "Your payment is completed on Whop's secure page.",
      btn: "Continue to secure checkout on Whop",
      codeLabel: "Your discount code",
      copy: "Copy",
      copied: "Copied!",
      step: "On the Whop page, tap “Add promo code”, paste this code and hit “Apply” to activate your discount.",
      hint: "Have a discount code? On the Whop page, enter it under “Add promo code”.",
      emailTitle: "⚠ VERY IMPORTANT: use the same email",
      emailBody: "Pay on Whop with the SAME email as your Epic account, the one you signed in with here. Your subscription activates automatically with that email as soon as you pay. If you pay with a different email, your access will not activate on its own.",
    },
  };

  function lang() {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";
    }
  }

  function copyText(text, btn, t) {
    function done() {
      btn.textContent = t.copied;
      setTimeout(function () {
        btn.textContent = t.copy;
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallback();
      });
    } else {
      fallback();
    }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch (e) {
        /* Sin portapapeles: el código queda visible para teclearlo. */
      }
    }
  }

  function patch(embed) {
    if (!embed || embed.getAttribute("data-cf-done") === "1") return;
    var planId = embed.getAttribute("data-whop-checkout-plan-id");
    if (!planId) return;
    embed.setAttribute("data-cf-done", "1");

    var promo = embed.getAttribute("data-whop-checkout-promo-code");
    var url = "https://whop.com/checkout/" + planId;

    var t = TXT[lang()];
    var wrap = document.createElement("div");
    wrap.className = "cf-wrap";

    var note = document.createElement("p");
    note.className = "cf-note";
    note.textContent = t.note;
    wrap.appendChild(note);

    var emailBox = document.createElement("div");
    emailBox.className = "cf-emailbox";
    var emailTitle = document.createElement("p");
    emailTitle.className = "cf-emailtitle";
    emailTitle.textContent = t.emailTitle;
    emailBox.appendChild(emailTitle);
    var emailBody = document.createElement("p");
    emailBody.className = "cf-emailbody";
    emailBody.textContent = t.emailBody;
    emailBox.appendChild(emailBody);
    wrap.appendChild(emailBox);

    if (promo) {
      var box = document.createElement("div");
      box.className = "cf-codebox";

      var label = document.createElement("span");
      label.className = "cf-codelabel";
      label.textContent = t.codeLabel;
      box.appendChild(label);

      var row = document.createElement("div");
      row.className = "cf-coderow";

      var code = document.createElement("code");
      code.className = "cf-code";
      code.textContent = promo;
      row.appendChild(code);

      var btnCopy = document.createElement("button");
      btnCopy.type = "button";
      btnCopy.className = "cf-copy";
      btnCopy.textContent = t.copy;
      btnCopy.addEventListener("click", function () {
        copyText(promo, btnCopy, t);
      });
      row.appendChild(btnCopy);
      box.appendChild(row);

      var step = document.createElement("p");
      step.className = "cf-step";
      step.textContent = t.step;
      box.appendChild(step);

      wrap.appendChild(box);
    }

    var a = document.createElement("a");
    a.className = "cf-btn";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = t.btn + " →";
    a.addEventListener("click", function () {
      try {
        window.sessionStorage.setItem(
          "epic-awaiting-payment",
          String(Date.now())
        );
      } catch (e) {}
    });
    wrap.appendChild(a);

    if (!promo) {
      var hint = document.createElement("p");
      hint.className = "cf-hint";
      hint.textContent = t.hint;
      wrap.appendChild(hint);
    }

    embed.appendChild(wrap);

    /* El modal muestra «Cargando el pago seguro…» hasta ver un iframe;
     * como ya no hay iframe, se oculta ese texto al inyectar el botón. */
    var body = embed.closest ? embed.closest(".co-body") : null;
    if (body) {
      var loading = body.querySelector(".co-loading");
      if (loading) loading.style.display = "none";
    }
  }

  function scan() {
    var nodes = document.querySelectorAll(
      ".co-embed[data-whop-checkout-plan-id]"
    );
    for (var i = 0; i < nodes.length; i++) patch(nodes[i]);
  }

  var observer = new MutationObserver(function () {
    scan();
  });

  function start() {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
