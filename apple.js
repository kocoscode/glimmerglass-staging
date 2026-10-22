// The Apple page below the story: a video marked .in-view plays only while it is on screen, and never while motion is
// held still (motion.js answers for the whole site). A video with a still <img> under it that fails to load is hidden,
// so the still shows; any other keeps its poster.
(function () {
  var still = window.glimmerglassStill ? window.glimmerglassStill() : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var videos = Array.prototype.slice.call(document.querySelectorAll("video.in-view"));
  videos.forEach(function (video) {
    var under = video.previousElementSibling;
    if (!under || !under.classList.contains("clip-still")) return;
    var hide = function () { video.style.visibility = "hidden"; };
    video.addEventListener("error", hide);
    var source = video.querySelector("source");
    if (source) source.addEventListener("error", hide);
  });
  if (still || !("IntersectionObserver" in window)) return;
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { var p = entry.target.play(); if (p && p.catch) p.catch(function () {}); } else entry.target.pause();
    });
  });
  videos.forEach(function (video) { watch.observe(video); });
})();
