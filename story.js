// The Framer page hero: one statement revealed sentence by sentence. Each .s carries data-at, its second in
// the play-through. Clip A (the squirrel in a black box) glitches in and stays; the page dims for the worried
// lines; after a beat, "Not anymore.", the page brightens and clip B (the squirrel through Glimmerglass) appears; the flourish draws in beside "dreams"; the button comes last. Any scroll, key or tap
// shows everything at once. With reduced motion, or for a clip that cannot play, the clip is shown as words.
(function () {
  var story = document.getElementById("story");
  if (!story) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clipA = story.querySelector(".clip-a"), videoA = story.querySelector(".clip-a-video");
  var clipB = story.querySelector(".clip-b"), playerB = story.querySelector(".clip-b-player");
  var text = story.querySelector(".story-text"), buy = story.querySelector(".story-buy");
  var flourishSlot = story.querySelector(".flourish");
  var steps = Array.prototype.slice.call(story.querySelectorAll(".s"));
  var asWords = function (clip) { clip.classList.add("as-words"); };
  // The flourish draws itself from the moment it loads, so it is put in place when its line arrives.
  var flourish = function () {
    if (flourishSlot.firstChild) return;
    var img = new Image(); img.alt = ""; img.decoding = "async"; img.src = "assets/framer/flourish-leafy.anim.svg";
    flourishSlot.appendChild(img);
  };
  var source = videoA.querySelector("source");
  videoA.addEventListener("error", function () { asWords(clipA); });
  if (source) source.addEventListener("error", function () { asWords(clipA); });
  if (window.Glimmerglass) {
    // The squirrel is drawn in a square frame; the box is taller than wide, so the frame is cropped at the sides, never the squirrel.
    var player = Glimmerglass.mount(playerB, { manifest: playerB.getAttribute("data-glim"), control: "never", fit: "cover" });
    player.on("fallback", function () { asWords(clipB); });
    player.on("error", function () { asWords(clipB); });
  } else asWords(clipB);

  // On a desktop the statement takes the largest size from 64 to 96 px at which all of it, and the button, fit
  // under the header. If even 64 px does not fit, the reveal scrolls each new line into view.
  var fit = function () {
    if (innerWidth <= 700) { text.style.fontSize = ""; return; }
    var room = innerHeight - (story.getBoundingClientRect().top + scrollY) - 16;
    var tall = function (px) { text.style.fontSize = px + "px"; return story.getBoundingClientRect().height > room; };
    var lo = 64, hi = 96;
    if (!tall(hi)) return;
    if (tall(lo)) return;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (tall(mid)) hi = mid; else lo = mid; }
    text.style.fontSize = lo + "px";
  };
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  var resizing = 0;
  window.addEventListener("resize", function () { clearTimeout(resizing); resizing = setTimeout(fit, 150); });

  if (reduce) {
    story.classList.add("static");
    asWords(clipA); asWords(clipB); flourish();
    return;
  }
  var play = function (video) { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  var timers = [], done = false;
  var at = function (seconds, fn) { timers.push(setTimeout(fn, seconds * 1000)); };
  // Clip A, once up, stays up: the broken version stays on the page. Only the light comes back.
  var brighten = function () { story.classList.remove("dim"); story.classList.add("bright"); };
  // A line arriving below the fold is brought up into view (the statement can run taller than the screen).
  var follow = function (el) { var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 24) window.scrollBy({ top: r.bottom - innerHeight + 48, behavior: "smooth" }); };
  var finish = function () {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    story.classList.add("done");
    steps.forEach(function (s) { s.classList.add("in"); });
    clipA.classList.add("shown"); story.classList.remove("dim");
    clipB.classList.add("shown"); flourish();
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.removeEventListener(type, finish, true); });
  };
  story.classList.add("playing");
  // Arriving lower down the page (a link to #license, a restored scroll) skips the play-through.
  if (story.getBoundingClientRect().bottom < 0 || location.hash) { finish(); return; }
  steps.forEach(function (s) { at(Number(s.getAttribute("data-at")), function () { s.classList.add("in"); follow(s); }); });
  at(3.5, function () { clipA.classList.add("shown", "glitch"); play(videoA); });
  at(4.3, function () { story.classList.add("dim"); });
  at(7.7, brighten);
  at(8.8, function () { clipB.classList.add("shown"); });
  at(10.9, flourish);
  at(12.4, finish);
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
})();
