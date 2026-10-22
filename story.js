// The story heroes (the Framer page, the Apple app page): one statement revealed sentence by sentence. Each .s
// carries data-at, its second in the play-through; #story's data-end is when everything is shown.
// Clips are .inline-clip: a <video> (plays from its data-at, glitching in with data-glitch), a GIF <img>, or a
// [data-glim] player that loops through Glimmerglass. A [data-glim][data-play-at] outside a clip (the sword) plays
// once at that second and holds its last frame.
// Any scroll, key or tap shows everything at once. With reduced motion, or for a clip that cannot play, the clips
// are shown as their words; a play-once player shows its still picture. A story marked data-reduced="stills" (the
// Apple page) never shows words: its clips are held as still pictures instead. A video keeps its poster (with a
// still <img> under it, which is all that shows if the video fails) and a GIF stays on its still (its src is the
// still; data-gif is swapped in only when things move, and back out if the GIF fails).
(function () {
  var story = document.getElementById("story");
  if (!story) return;
  var reduce = window.glimmerglassStill ? window.glimmerglassStill() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);  // motion.js answers for the whole site
  var stills = story.getAttribute("data-reduced") === "stills";
  var steps = Array.prototype.slice.call(story.querySelectorAll(".s"));
  var clips = Array.prototype.slice.call(story.querySelectorAll(".inline-clip"));
  var asWords = function (clip) { clip.classList.add("as-words"); };
  var timed = [], once = [];
  clips.forEach(function (clip) {
    var video = clip.querySelector("video"), gif = clip.querySelector("img.gif"), glim = clip.querySelector("[data-glim]");
    var fail = function () { if (stills) clip.classList.add("still-only"); else asWords(clip); };
    if (video) {
      video.addEventListener("error", fail);
      var source = video.querySelector("source");
      if (source) source.addEventListener("error", fail);
      timed.push({ clip: clip, video: video, at: Number(clip.getAttribute("data-at") || 0) });
    }
    if (gif) {
      var still = gif.getAttribute("src");
      gif.addEventListener("error", function () { if (stills && gif.getAttribute("src") !== still) gif.src = still; else fail(); });
      if (!reduce && gif.hasAttribute("data-gif")) gif.src = gif.getAttribute("data-gif");
      else if (gif.complete && !gif.naturalWidth) fail();
    }
    if (glim) {
      if (reduce && stills) return;  // held still: its poster <img> stays, nothing is mounted
      if (!window.Glimmerglass) { fail(); return; }
      var player = Glimmerglass.mount(glim, { manifest: glim.getAttribute("data-glim"), control: "never", reducedMotion: "ignore" });
      player.on("fallback", fail);
      player.on("error", fail);
    }
  });
  if (window.Glimmerglass) Array.prototype.forEach.call(story.querySelectorAll("[data-glim][data-play-at]"), function (slot) {
    if (slot.closest(".inline-clip")) return;
    // Plays once, when its line arrives, and holds on its last frame.
    once.push({ player: Glimmerglass.mount(slot, { manifest: slot.getAttribute("data-glim"), control: "never", autoplay: false, loop: false, reducedMotion: "ignore" }), at: Number(slot.getAttribute("data-play-at")) });
  });

  if (reduce) { story.classList.add("static"); if (!stills) clips.forEach(asWords); return; }
  var play = function (video) { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  var show = function (t) { t.clip.classList.add("shown"); if (t.clip.hasAttribute("data-glitch")) t.clip.classList.add("glitch"); play(t.video); };
  var timers = [], done = false;
  var at = function (seconds, fn) { timers.push(setTimeout(fn, seconds * 1000)); };
  // A line arriving below the fold is brought up into view: the statement runs taller than the screen.
  var follow = function (el) { var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 24) window.scrollBy({ top: r.bottom - innerHeight + 48, behavior: "smooth" }); };
  var finish = function () {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    story.classList.add("done");
    steps.forEach(function (s) { s.classList.add("in"); });
    timed.forEach(function (t) { t.clip.classList.add("shown"); play(t.video); });
    once.forEach(function (o) { o.player.play(); });
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.removeEventListener(type, finish, true); });
  };
  story.classList.add("playing");
  if (story.getBoundingClientRect().bottom < 0 || location.hash) { finish(); return; }
  steps.forEach(function (s) { at(Number(s.getAttribute("data-at")), function () { s.classList.add("in"); follow(s); }); });
  timed.forEach(function (t) { at(t.at, function () { show(t); }); });
  once.forEach(function (o) { at(o.at, function () { o.player.play(); }); });
  var last = steps.reduce(function (m, s) { return Math.max(m, Number(s.getAttribute("data-at"))); }, 0);
  at(Number(story.getAttribute("data-end")) || last + 0.8, finish);
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
})();
