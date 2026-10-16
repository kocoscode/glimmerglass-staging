// The Framer page hero: one statement revealed sentence by sentence. Each .s carries data-at, its second in the
// play-through. The flourish draws itself in when its line arrives, the boxed squirrel glitches in and stays, the
// clean squirrel plays through Glimmerglass, and the sword is pulled once when its line arrives, then held raised.
// Any scroll, key or tap shows everything at once. With reduced motion, or for a clip that cannot play, the
// squirrels are shown as their words and the sword as its still picture.
(function () {
  var story = document.getElementById("story");
  if (!story) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clipA = story.querySelector(".clip-a"), videoA = story.querySelector(".clip-a-video");
  var clipB = story.querySelector(".clip-b"), playerB = story.querySelector(".clip-b-player");
  var swordSlot = story.querySelector(".sword-player"), flourishSlot = story.querySelector(".flourish");
  var steps = Array.prototype.slice.call(story.querySelectorAll(".s"));
  var asWords = function (clip) { clip.classList.add("as-words"); };
  var flourish = function () {
    if (flourishSlot.firstChild) return;
    var img = new Image(); img.alt = ""; img.decoding = "async"; img.src = "assets/framer/flourish-leafy.anim.svg";
    flourishSlot.appendChild(img);
  };
  var source = videoA.querySelector("source");
  videoA.addEventListener("error", function () { asWords(clipA); });
  if (source) source.addEventListener("error", function () { asWords(clipA); });
  var sword = null;
  if (window.Glimmerglass) {
    var player = Glimmerglass.mount(playerB, { manifest: playerB.getAttribute("data-glim"), control: "never" });
    player.on("fallback", function () { asWords(clipB); });
    player.on("error", function () { asWords(clipB); });
    // Plays once, when its line arrives, and holds on the raised sword.
    sword = Glimmerglass.mount(swordSlot, { manifest: swordSlot.getAttribute("data-glim"), control: "never", autoplay: false, loop: false });
  } else asWords(clipB);

  if (reduce) { story.classList.add("static"); asWords(clipA); asWords(clipB); flourish(); return; }
  var play = function (video) { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  var pull = function () { if (sword) sword.play(); };
  var timers = [], done = false;
  var at = function (seconds, fn) { timers.push(setTimeout(fn, seconds * 1000)); };
  // A line arriving below the fold is brought up into view: the statement runs taller than the screen.
  var follow = function (el) { var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 24) window.scrollBy({ top: r.bottom - innerHeight + 48, behavior: "smooth" }); };
  var finish = function () {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    story.classList.add("done");
    steps.forEach(function (s) { s.classList.add("in"); });
    clipA.classList.add("shown"); play(videoA); flourish(); pull();
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.removeEventListener(type, finish, true); });
  };
  story.classList.add("playing");
  if (story.getBoundingClientRect().bottom < 0 || location.hash) { finish(); return; }
  steps.forEach(function (s) { at(Number(s.getAttribute("data-at")), function () { s.classList.add("in"); follow(s); }); });
  at(0.4, flourish);
  at(3.9, function () { clipA.classList.add("shown", "glitch"); play(videoA); });
  at(10.4, pull);
  at(12.2, finish);
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
})();
