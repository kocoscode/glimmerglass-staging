// The Assistants page hero: one statement revealed sentence by sentence, as on the Framer page (story.js). Each .s
// carries data-at, its second in the play-through. The houses are .glims played by our player; they loop while on
// screen and rest on their posters with reduced motion. Any scroll, key or tap shows everything at once.
(function () {
  // The server address's Copy button, shown only where the browser can copy.
  if (navigator.clipboard) Array.prototype.forEach.call(document.querySelectorAll(".copy-address"), function (button) {
    button.hidden = false;
    button.addEventListener("click", function () {
      navigator.clipboard.writeText(button.getAttribute("data-copy")).then(function () { button.textContent = "Copied"; setTimeout(function () { button.textContent = "Copy"; }, 1600); });
    });
  });

  // The ChatGPT and Claude films: muted loops that play only while on screen, and rest on their posters when motion is off.
  var films = document.querySelectorAll(".chat-film");
  var filmsStill = window.glimmerglassStill ? window.glimmerglassStill() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (films.length && !filmsStill && window.IntersectionObserver) {
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else e.target.pause(); });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(films, function (film) { watch.observe(film); });
  }

  var story = document.getElementById("story");
  if (!story) return;
  var reduce = window.glimmerglassStill ? window.glimmerglassStill() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);  // motion.js answers for the whole site
  var steps = Array.prototype.slice.call(story.querySelectorAll(".s"));
  if (window.Glimmerglass) {
    Array.prototype.forEach.call(story.querySelectorAll(".house[data-glim]"), function (slot) {
      Glimmerglass.mount(slot, { manifest: slot.getAttribute("data-glim"), play: "always", control: "never" });
    });
  }

  if (reduce) { story.classList.add("static"); return; }
  var timers = [], done = false;
  var at = function (seconds, fn) { timers.push(setTimeout(fn, seconds * 1000)); };
  // A line arriving below the fold is brought up into view: the statement runs taller than the screen.
  var follow = function (el) { var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 24) window.scrollBy({ top: r.bottom - innerHeight + 48, behavior: "smooth" }); };
  var finish = function () {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    story.classList.add("done");
    steps.forEach(function (s) { s.classList.add("in"); });
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.removeEventListener(type, finish, true); });
  };
  story.classList.add("playing");
  if (story.getBoundingClientRect().bottom < 0 || location.hash) { finish(); return; }
  steps.forEach(function (s) { at(Number(s.getAttribute("data-at")), function () { s.classList.add("in"); follow(s); }); });
  at(10.6, finish);
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
})();
