// The .glim page's demo: the maroon knight's .glim through the player, and a caption saying which file this browser was given.
(function () {
  var el = document.getElementById("demo-player"), caption = document.getElementById("demo-caption");
  if (!el || !window.Glimmerglass) return;
  var names = { "hevc-alpha": "HEVC with transparency (.mp4)", "vp9-alpha": "VP9 with transparency (.webm)" };
  var manifest = null;
  var player = Glimmerglass.mount(el, { manifest: el.getAttribute("data-glim"), alt: "The maroon knight on horseback, riding in place" });
  player.on("ready", function (m) { manifest = m; });
  player.on("rendition", function (r) {
    var match = manifest && manifest.renditions.filter(function (x) { return x.width === r.width && x.format === r.format; })[0];
    var kb = match ? ", " + Math.round(match.bytes / 1000) + " KB" : "";
    caption.textContent = "Your browser got the " + r.width + " pixel " + (names[r.format] || r.format) + " file" + kb + ", out of the six inside this one .glim.";
  });
  player.on("fallback", function () { caption.textContent = "This browser can't show transparent video, so it gets the still picture."; });
})();
