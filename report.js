// "Report a bug", on every page: a link at the end of the footer opens a short form in an overlay (owner, 6 Nov 2026).
// Where it happened, what was being converted, and up to 1,000 characters of description go to The House of Koco's inbox.
// The page address and browser details go along only when the visitor ticks the box asking for them (owner, 6 Nov).
// REPORT_ENDPOINT is the Google Apps Script web app in source/bug-report/ (it emails mike@houseofkoco.com from his own
// Google account, so no other company handles the reports). Until that address is set, or if sending fails, the form
// opens the visitor's email app with the same report already written.
(function () {
  var REPORT_ENDPOINT = "";
  var TO = "mike@houseofkoco.com";
  var MAX = 1000;
  var SURFACES = ["iPhone app", "iPad app", "Mac app", "Framer plugin", "ChatGPT", "Claude", "Another assistant", "This website"];
  var CONVERSIONS = ["Animated WebP", "GIF", "APNG", "MOV", "MP4 or WebM", "Frames (folder or .zip)", "A .glim", "Not converting"];

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var pills = function (name, list) {
    return list.map(function (v, i) {
      return '<label class="report-pill"><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (i ? "" : " required") + "><span>" + esc(v) + "</span></label>";
    }).join("");
  };

  function build() {
    var d = document.createElement("dialog");
    d.className = "report";
    d.setAttribute("aria-labelledby", "report-title");
    d.innerHTML =
      '<form class="report-form" novalidate>' +
        '<div class="report-head"><h2 id="report-title">Report a bug</h2>' +
        '<button type="button" class="report-close" aria-label="Close">&times;</button></div>' +
        '<p class="report-lede">It goes straight to The House of Koco, where we will process the bug and fix it as soon as possible.</p>' +
        '<fieldset><legend>Where did it happen?</legend><div class="report-pills">' + pills("surface", SURFACES) + "</div></fieldset>" +
        '<fieldset><legend>What were you converting?</legend><div class="report-pills">' + pills("conversion", CONVERSIONS) + "</div></fieldset>" +
        '<label class="report-field"><span class="report-label">What happened?</span>' +
          '<textarea name="description" rows="5" maxlength="' + MAX + '" required placeholder="What you did, what you expected, and what happened instead."></textarea>' +
          '<span class="report-count" aria-live="polite">0 / ' + MAX + "</span></label>" +
        '<label class="report-field"><span class="report-label">Your email <span class="report-optional">if you would like a reply</span></span>' +
          '<input type="email" name="email" autocomplete="email" maxlength="200"></label>' +
        '<label class="report-trap" aria-hidden="true">Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label>' +
        '<label class="report-share"><input type="checkbox" name="share"><span>Include this page’s address and my browser and system, to help us reproduce the bug</span></label>' +
        '<p class="report-error" role="alert" hidden></p>' +
        '<div class="report-actions"><button type="submit" class="button">Send report</button>' +
        '<button type="button" class="report-cancel">Cancel</button></div>' +
      "</form>" +
      '<div class="report-done" hidden><h2>Thank you.</h2><p class="report-done-text"></p>' +
        '<button type="button" class="button report-close-done">Close</button></div>';
    document.body.appendChild(d);
    return d;
  }

  var dialog;
  function open(event) {
    if (event) event.preventDefault();
    if (!dialog) wire(dialog = build());
    var form = dialog.querySelector(".report-form");
    form.hidden = false; dialog.querySelector(".report-done").hidden = true;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    var first = form.querySelector('input[name="surface"]');
    if (first) first.focus();
  }

  function wire(d) {
    var form = d.querySelector(".report-form"), text = form.elements.description, count = d.querySelector(".report-count");
    var error = d.querySelector(".report-error"), send = form.querySelector('button[type="submit"]');
    var close = function () { if (d.close) d.close(); else d.removeAttribute("open"); };
    [".report-close", ".report-cancel", ".report-close-done"].forEach(function (s) { d.querySelector(s).addEventListener("click", close); });
    // A click on the dimmed backdrop (outside the panel) closes it too.
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    text.addEventListener("input", function () { count.textContent = text.value.length + " / " + MAX; });
    // An error stays only until the visitor changes something.
    form.addEventListener("input", function () { error.hidden = true; });
    form.addEventListener("change", function () { error.hidden = true; });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      error.hidden = true;
      var surface = form.elements.surface.value, conversion = form.elements.conversion.value, description = text.value.trim();
      var missing = !surface ? "where it happened" : !conversion ? "what you were converting" : !description ? "what happened" : "";
      if (missing) { error.textContent = "Please choose or fill in " + missing + "."; error.hidden = false; return; }
      var email = form.elements.email.value.trim();
      if (email && !form.elements.email.checkValidity()) { error.textContent = "That email address doesn't look right."; error.hidden = false; return; }
      var report = {
        surface: surface, conversion: conversion, description: description.slice(0, MAX), email: email,
        sentAt: new Date().toISOString(),
        website: form.elements.website.value
      };
      if (form.elements.share.checked) { report.page = location.href.split("#")[0]; report.browser = navigator.userAgent; }
      if (report.website) { done(false); return; } // a bot filled the hidden field: pretend it went
      if (!REPORT_ENDPOINT) { mail(report); return; }
      send.disabled = true; send.textContent = "Sending…";
      // text/plain keeps this a simple request (no preflight), which Apps Script web apps need.
      fetch(REPORT_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(report) })
        .then(function (r) { return r.json(); })
        .then(function (r) { if (!r || !r.ok) throw new Error((r && r.error) || "not sent"); done(false); })
        .catch(function () {
          error.innerHTML = "It didn't send. You can <a href=\"" + mailto(report) + "\">email it instead</a>; it's already written for you.";
          error.hidden = false;
        })
        .then(function () { send.disabled = false; send.textContent = "Send report"; });
    });

    function done(byMail) {
      d.querySelector(".report-done-text").textContent = byMail
        ? "Your email app has the report ready. Press send there and it reaches The House of Koco."
        : "The House of Koco has your report. If you left an email address, we can write back.";
      form.reset(); count.textContent = "0 / " + MAX;
      form.hidden = true; d.querySelector(".report-done").hidden = false;
      d.querySelector(".report-close-done").focus();
    }
    function mail(report) { location.href = mailto(report); done(true); }
  }

  function mailto(r) {
    var body = "Where: " + r.surface + "\nConverting: " + r.conversion + "\n\n" + r.description +
      (r.page ? "\n\n—\nPage: " + r.page + "\nBrowser: " + r.browser : "");
    return "mailto:" + TO + "?subject=" + encodeURIComponent("Glimmerglass bug: " + r.surface + " · " + r.conversion) + "&body=" + encodeURIComponent(body);
  }

  function addLink() {
    var footer = document.querySelector("footer");
    if (!footer || footer.querySelector(".report-link")) return;
    var a = document.createElement("a");
    a.href = "mailto:" + TO + "?subject=" + encodeURIComponent("Glimmerglass bug");
    a.className = "report-link";
    a.textContent = "Report a bug";
    a.addEventListener("click", open);
    footer.appendChild(a);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addLink); else addLink();
})();
