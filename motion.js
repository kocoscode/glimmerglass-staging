// One site-wide answer to "should things move?" (owner, 19 October 2026). The animations themselves show no buttons
// of their own. The visitor's choice, saved in this browser, wins; with no choice saved, the system's Reduce Motion
// setting decides. Every page with motion carries a "Motion on / off" switch in its footer, and a visitor whose
// system asks for reduced motion (and who has not chosen yet) gets a short note at the bottom of the screen
// offering the animations back. Loaded first in <head>, so the choice is in place before anything paints or mounts.
// Other scripts ask `window.glimmerglassStill()`; the stylesheet keys off `html.still` and `html.motion-on`.
(function () {
  var KEY = "glimmerglass-motion", DISMISSED = "glimmerglass-motion-note";
  var root = document.documentElement;
  var asked = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { /* storage blocked: see ?motion= below */ }
  var fromAddress = /[?&]motion=(on|off)(&|$)/.exec(location.search);
  if (fromAddress) choice = fromAddress[1];
  var still = choice === "off" || (choice !== "on" && asked);
  root.classList.add(still ? "still" : "motion-on");
  window.glimmerglassStill = function () { return still; };

  // Saves the choice and starts the page again with it, where the visitor is. A browser that keeps no storage
  // gets the choice in the address instead.
  function choose(value) {
    try { localStorage.setItem(KEY, value); location.reload(); }
    catch (e) { var q = new URLSearchParams(location.search); q.set("motion", value); location.search = q.toString(); }
  }

  // The page is parsed but no deferred script has run yet: the player mounts its animations from those scripts, so
  // the choice goes onto them now. Moving: every declarative animation plays, whatever the system says. Still: none
  // starts by itself. Either way, no per-animation button.
  function prepare() {
    document.querySelectorAll("[data-glimmerglass]").forEach(function (el) {
      if (still) el.setAttribute("data-autoplay", "false"); else el.setAttribute("data-reduced-motion", "ignore");
      if (!el.hasAttribute("data-control")) el.setAttribute("data-control", "never");
    });
  }
  if (document.readyState === "loading") document.addEventListener("readystatechange", function once() {
    if (document.readyState === "loading") return;
    document.removeEventListener("readystatechange", once);
    prepare();
  }); else prepare();

  document.addEventListener("DOMContentLoaded", function () {

    var footer = document.querySelector("footer");
    if (footer) {
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "motion-toggle";
      toggle.setAttribute("aria-pressed", String(!still));
      toggle.textContent = still ? "Motion off" : "Motion on";
      toggle.title = still ? "Play the animations" : "Hold the animations still";
      toggle.addEventListener("click", function () { choose(still ? "on" : "off"); });
      footer.appendChild(toggle);
    }

    if (!asked || choice) return;
    try { if (sessionStorage.getItem(DISMISSED)) return; } catch (e) { /* show it */ }
    var note = document.createElement("div");
    note.className = "motion-note";
    note.setAttribute("role", "region");
    note.setAttribute("aria-label", "Motion");
    note.innerHTML = '<p><strong>Heads up: things move here.</strong> Your Reduce Motion setting has paused the animations.</p>' +
      '<div class="motion-note-actions"><button type="button" class="button motion-play">Play the animations</button>' +
      '<button type="button" class="motion-later">Not now</button></div>';
    note.querySelector(".motion-play").addEventListener("click", function () { choose("on"); });
    note.querySelector(".motion-later").addEventListener("click", function () {
      try { sessionStorage.setItem(DISMISSED, "1"); } catch (e) { /* hide it for this page */ }
      note.remove();
    });
    document.body.appendChild(note);
  });
})();
