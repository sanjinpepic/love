/* Language, lettering, calendar. Shared by both pages. */
(function () {
  "use strict";
  var LANGS = ["en", "sv", "bs"];
  var page = document.body.dataset.page; // "std" | "wed"

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(q) > -1) return q;
    var saved = store("lang");
    if (LANGS.indexOf(saved) > -1) return saved;
    var nav = (navigator.languages || [navigator.language || "en"]).map(function (l) { return String(l).toLowerCase(); });
    for (var i = 0; i < nav.length; i++) {
      var l = nav[i].slice(0, 2);
      if (l === "sv") return "sv";
      if (l === "bs" || l === "hr" || l === "sr" || l === "sh") return "bs";
      if (l === "en") return "en";
    }
    return "en";
  }

  function t(key, lang) {
    var d = window.I18N[lang] || window.I18N.en;
    return d[key] != null ? d[key] : window.I18N.en[key] || "";
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.title = t(page === "std" ? "meta.std.title" : "meta.wed.title", lang);
    [].forEach.call(document.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.dataset.i18n, lang); });
    [].forEach.call(document.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.dataset.i18nAttr.split(";").forEach(function (pair) {
        var kv = pair.split(":"); el.setAttribute(kv[0].trim(), t(kv[1].trim(), lang));
      });
    });
    [].forEach.call(document.querySelectorAll(".lang button"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    // carry the language across to the other page
    [].forEach.call(document.querySelectorAll("a[data-keep-lang]"), function (a) {
      var u = new URL(a.getAttribute("href"), location.href); u.searchParams.set("lang", lang);
      a.href = u.pathname.split("/").pop() + u.search + u.hash;
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  window.Site = { t: function (k) { return t(k, document.documentElement.lang); }, lang: function () { return document.documentElement.lang; } };

  var lang = initialLang();
  apply(lang);
  [].forEach.call(document.querySelectorAll(".lang button"), function (b) {
    b.addEventListener("click", function () { lang = b.dataset.lang; store("lang", lang); apply(lang); });
  });

  // Words settle once the paper has folded up (or straight away without motion).
  var settles = [].slice.call(document.querySelectorAll(".settle"));
  var settled = false;
  function settleAll() { if (settled) return; settled = true; settles.forEach(function (el, i) { el.style.setProperty("--d", (i * 0.12) + "s"); el.classList.add("is-in"); }); }
  var stage = document.querySelector("[data-stage]");
  requestAnimationFrame(function () { setTimeout(settleAll, 120); });

  // Sections rise gently into view.
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add("is-in"); });
})();
