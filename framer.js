// The Framer page: the before-and-after clip plays only while it is on screen (never with reduced motion),
// and the video slot swaps its placeholder for the film as soon as assets/framer/plugin-in-framer.mp4 exists.
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var plain = document.querySelector(".plain-export");
  if (plain && !reduce && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { var p = plain.play(); if (p && p.catch) p.catch(function () {}); } else plain.pause();
      });
    }).observe(plain);
  }
  // The intro's flyers, on one clock that runs only while the section is on screen. The airship crosses
  // right to left in 12 s, waits 4 s off the left edge, flies back in 12 s and waits 4 s off the right.
  // The knights ride right to left one after another at their walking pace (210 px a stride for every
  // 1000 px of height, a stride every 4/3 s, as on the home page), and each comes back 16 s after it leaves.
  var section = document.querySelector(".intro-scatter");
  var shell = document.querySelector(".shell");
  if (section && shell && !reduce && "IntersectionObserver" in window) {
    section.classList.add("flying");
    var ship = section.querySelector(".s-airship");
    var knights = [".s-maroon", ".s-blue", ".s-green"].map(function (q) { return section.querySelector(q); });
    var clock = 0, last = null, visible = false;
    var put = function (el, x, y) { el.style.transform = "translate3d(" + x.toFixed(1) + "px," + (y || 0).toFixed(1) + "px,0)"; };
    var place = function () {
      var sr = section.getBoundingClientRect(), hr = shell.getBoundingClientRect();
      var left = hr.left - sr.left, right = hr.right - sr.left;
      if (ship && ship.offsetParent) {
        var w = ship.offsetWidth, from = right + 10, to = left - w - 10, t = clock % 32, x;
        x = t < 12 ? from + (to - from) * t / 12 : t < 16 ? to : t < 28 ? to + (from - to) * (t - 16) / 12 : from;
        put(ship, x, Math.sin(clock * Math.PI / 3) * 6);
      }
      knights.forEach(function (k, i) {
        if (!k || !k.offsetParent) return;
        var w = k.offsetWidth, speed = 210 / (4 / 3) * k.offsetHeight / 1000;
        var from = right, trip = (from - (left - w)) / speed, local = clock - i * 6;
        var tl = local < 0 ? -1 : local % (trip + 16);
        put(k, tl < 0 || tl >= trip ? from : from - speed * tl);
      });
    };
    var frame = function (now) {
      if (!visible) { last = null; return; }
      if (last !== null) clock += Math.min(0.1, (now - last) / 1000);
      last = now; place(); requestAnimationFrame(frame);
    };
    place();
    new IntersectionObserver(function (entries) {
      var was = visible; visible = entries[entries.length - 1].isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(section);
    window.addEventListener("resize", place);
  }

  var slot = document.getElementById("plugin-film");
  if (!slot || !window.fetch) return;
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
