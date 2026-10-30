/* RSVP: validate in the guest's language, post to the couple's server, letter a thank-you. */
(function () {
  "use strict";
  var form = document.getElementById("rsvp-form");
  if (!form) return;
  var pane = document.getElementById("rsvp-pane");
  var original = pane.innerHTML;
  var t = function (k) { return window.Site.t(k); };

  function setError(id, key) {
    var el = document.getElementById("e-" + id);
    var input = id === "attending" ? null : form.elements[id];
    el.textContent = key ? t(key) : "";
    el.dataset.key = key || "";
    if (input) input.setAttribute("aria-invalid", key ? "true" : "false");
  }

  function validate() {
    var ok = true, first = null;
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var att = form.querySelector("input[name=attending]:checked");
    setError("name", name ? null : "err.name");
    if (!name) { ok = false; first = first || form.elements.name; }
    var emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setError("email", emailOk ? null : "err.email");
    if (!emailOk) { ok = false; first = first || form.elements.email; }
    setError("attending", att ? null : "err.attending");
    if (!att) { ok = false; first = first || form.querySelector("input[name=attending]"); }
    if (first) first.focus();
    return ok;
  }

  function wire(f) {
    form = f;
    var extra = form.querySelector(".if-attending");
    [].forEach.call(form.querySelectorAll("input[name=attending]"), function (r) {
      r.addEventListener("change", function () { extra.hidden = r.value !== "yes" || !r.checked; setError("attending", null); });
    });
    form.elements.name.addEventListener("input", function () { if (this.value.trim()) setError("name", null); });
    form.addEventListener("submit", submit);
  }

  function submit(e) {
    e.preventDefault();
    var status = form.querySelector(".form-status");
    status.textContent = ""; status.classList.remove("is-error"); delete status.dataset.key;
    if (!validate()) return;
    var att = form.querySelector("input[name=attending]:checked").value;
    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      attending: att,
      party_size: att === "yes" ? Number(form.elements.party_size.value) : 0,
      guest_names: att === "yes" ? form.elements.guest_names.value.trim() : "",
      dietary: att === "yes" ? form.elements.dietary.value.trim() : "",
      message: form.elements.message.value.trim(),
      website: form.elements.website.value,
      lang: window.Site.lang()
    };
    var btn = form.querySelector("button[type=submit]"), label = btn.querySelector("span");
    btn.disabled = true; label.textContent = t("f.sending"); label.dataset.i18n = "f.sending";

    fetch(window.WEDDING.rsvpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function () {
      thanks(data.name, att);
    }).catch(function () {
      btn.disabled = false; label.dataset.i18n = "f.submit"; label.textContent = t("f.submit");
      status.dataset.key = "err.send"; status.textContent = t("err.send"); status.classList.add("is-error");
    });
  }

  function thanks(name, att) {
    var first = name.split(/\s+/)[0];
    pane.innerHTML =
      '<div class="thanks" tabindex="-1">' +
        '<p class="thanks-letter gilt settle" data-i18n="thanks.word"></p>' +
        '<p class="settle" data-thanks></p>' +
        '<p class="settle"><button type="button" class="again" data-again data-i18n="thanks.again"></button></p>' +
      '</div>';
    var box = pane.querySelector(".thanks");
    var render = function () {
      box.querySelector("[data-i18n='thanks.word']").textContent = t("thanks.word");
      box.querySelector("[data-thanks]").textContent = t(att === "yes" ? "thanks.yes" : "thanks.no").replace("{name}", first);
      box.querySelector("[data-again]").textContent = t("thanks.again");
    };
    render();
    document.addEventListener("langchange", render);
    box.focus();
    [].forEach.call(box.querySelectorAll(".settle"), function (el, i) {
      el.style.setProperty("--d", (i * 0.15) + "s");
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("is-in"); }); });
    });
    box.querySelector("[data-again]").addEventListener("click", function () {
      document.removeEventListener("langchange", render);
      pane.innerHTML = original;
      [].forEach.call(pane.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.dataset.i18n); });
      wire(document.getElementById("rsvp-form"));
      document.getElementById("rsvp-form").elements.name.focus();
    });
  }

  // Keep visible error text in step with the language switch.
  document.addEventListener("langchange", function () {
    [].forEach.call(document.querySelectorAll(".error, .form-status"), function (el) {
      if (el.dataset.key) el.textContent = t(el.dataset.key);
    });
  });

  wire(form);
})();
