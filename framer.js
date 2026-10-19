// The Framer page: the before-and-after clip plays only while it is on screen (never with reduced motion),
// and the video slot swaps its placeholder for the film as soon as assets/framer/plugin-in-framer.mp4 exists.
// While the slot's figure is hidden (for launch, until the film is made) nothing is asked for, so nothing 404s.
(function () {
  var reduce = window.glimmerglassStill ? window.glimmerglassStill() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);  // motion.js answers for the whole site
  var plain = document.querySelector(".plain-export");
  if (plain && !reduce && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { var p = plain.play(); if (p && p.catch) p.catch(function () {}); } else plain.pause();
      });
    }).observe(plain);
  }
  var slot = document.getElementById("plugin-film");
  if (!slot || slot.closest("[hidden]") || !window.fetch) return;
  var head = function (url) { return fetch(url, { method: "HEAD" }).then(function (r) { return r.ok; }, function () { return false; }); };
  var mp4 = slot.getAttribute("data-mp4"), webm = slot.getAttribute("data-webm");
  Promise.all([head(mp4), head(webm)]).then(function (found) {
    if (!found[0] && !found[1]) return;
    var video = document.createElement("video");
    video.muted = true; video.loop = true; video.playsInline = true; video.controls = true; video.preload = "metadata";
    video.setAttribute("aria-label", slot.parentNode.getAttribute("aria-label"));
    [[found[0], mp4, "video/mp4"], [found[1], webm, "video/webm"]].forEach(function (s) {
      if (!s[0]) return;
      var source = document.createElement("source"); source.src = s[1]; source.type = s[2]; video.appendChild(source);
    });
    slot.replaceChildren(video);
  });
})();
