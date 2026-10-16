// The Framer page hero: one statement revealed sentence by sentence. Each .s carries data-at, its second in
// the play-through. Clip A (the knight in a black box) glitches in; the page dims for the worried lines; after
// a beat, "Not anymore.", the black box wipes away, the page brightens and clip B (the knight through
// Glimmerglass) appears; the flourish draws in beside "dreams"; the button comes last. Any scroll, key or tap
// shows everything at once. With reduced motion, or for a clip that cannot play, the clip is shown as words.
(function () {
  var story = document.getElementById("story");
  if (!story) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clipA = story.querySelector(".clip-a"), videoA = story.querySelector(".clip-a-video");
  var clipB = story.querySelector(".clip-b"), playerB = story.querySelector(".clip-b-player");
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
    // Cropped to the bottom of its frame, where the horse and rider are, so the knight reads at the size of a word.
    var player = Glimmerglass.mount(playerB, { manifest: playerB.getAttribute("data-glim"), control: "never", fit: "cover", position: "50% 100%" });
    player.on("fallback", function () { asWords(clipB); });
    player.on("error", function () { asWords(clipB); });
  } else asWords(clipB);

  if (reduce) {
    story.classList.add("static");
    asWords(clipA); asWords(clipB); flourish();
    return;
  }
  var play = function (video) { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  var timers = [], done = false;
  var at = function (seconds, fn) { timers.push(setTimeout(fn, seconds * 1000)); };
  var wipe = function () { clipA.classList.add("wiped"); story.classList.remove("dim"); story.classList.add("bright"); };
  var finish = function () {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    story.classList.add("done");
    steps.forEach(function (s) { s.classList.add("in"); });
    clipA.classList.add("wiped"); story.classList.remove("dim");
    clipB.classList.add("shown"); flourish();
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.removeEventListener(type, finish, true); });
  };
  story.classList.add("playing");
  // Arriving lower down the page (a link to #license, a restored scroll) skips the play-through.
  if (story.getBoundingClientRect().bottom < 0 || location.hash) { finish(); return; }
  steps.forEach(function (s) { at(Number(s.getAttribute("data-at")), function () { s.classList.add("in"); }); });
  at(3.5, function () { clipA.classList.add("glitch"); play(videoA); });
  at(4.3, function () { story.classList.add("dim"); });
  at(7.7, wipe);
  at(8.8, function () { clipB.classList.add("shown"); });
  at(10.9, flourish);
  at(12.4, finish);
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) { window.addEventListener(type, finish, { capture: true, passive: true }); });
})();
