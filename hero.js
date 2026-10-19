// The home page's film and the three knights that ride out of it.
//
// The film behaves as before: one Play/Pause button owns playback, it pauses
// off screen and when the tab is hidden, and it does not start by itself when
// the visitor asks for reduced motion. The knights are three Glimmerglass
// conversions mounted through the product's own player (glimmerglass.min.js,
// loaded before this script); the page moves their boxes in step with the
// film's clock during its last scene, as if they had been in the film and
// kept walking.
const video = document.querySelector('#hero-video');
const toggle = document.querySelector('.film-toggle');
if (video && toggle) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let wantsPlayback = !motion.matches;
  let visible = true;
  const sync = () => { toggle.textContent = video.paused ? 'Play video' : 'Pause video'; };
  const shouldPlay = () => wantsPlayback && visible && !document.hidden;
  const update = () => {
    if (shouldPlay()) video.play().catch(sync);
    else video.pause();
  };
  // Keep native controls as the no-JavaScript fallback. One explicit control
  // owns playback intent when JavaScript is available; late media events must
  // never turn a user's Pause back into an autoplay request.
  video.controls = false;
  toggle.hidden = false;
  video.addEventListener('play', () => {
    if (!shouldPlay()) video.pause();
    sync();
  });
  video.addEventListener('pause', sync);
  toggle.addEventListener('click', () => {
    wantsPlayback = video.paused;
    update();
  });
  motion.addEventListener('change', () => { wantsPlayback = !motion.matches; update(); });
  document.addEventListener('visibilitychange', update);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: 0.1 }).observe(video);
  sync();

  // The knights. Each is mounted through the player's documented API: the player
  // picks the file this browser draws transparently and the size that fits the
  // box. They are not started by themselves and have no button of their own,
  // because the film decides when they ride.
  // They are mounted once the page has loaded and the browser is idle (at most 3 s later): they first ride
  // 32 seconds into the film, and on a phone their files must not compete with the page's first paint.
  const afterLoad = (fn) => {
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 0));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  };
  afterLoad(() => {
    const stage = document.querySelector('.hero-stage');
    const shell = document.querySelector('.shell');
    const riders = [...document.querySelectorAll('.rider')];
    if (window.Glimmerglass && stage && shell && riders.length) {
      const STRIDE_SECONDS = 4 / 3;  // one stride of the walk: 16 drawings at 12 a second, played at their own speed
      const START = { maroon: 0.05, blue: 0.9, green: 1.75 };  // where each knight's box starts, in box widths from the film's left edge
      const DRAWN_TO = 0.93;  // how far across its box a knight's drawing reaches (its tail)
      const mounted = riders.map((element) => ({
        element,
        start: START[element.dataset.knight] ?? 0,
        player: Glimmerglass.mount(element, { manifest: element.dataset.glim, autoplay: false, control: 'never', preload: 'auto', priority: true, offscreen: 'play' }),
      }));
      let scene = { sceneStarts: Infinity, filmDuration: 42, dissolveIn: 0.4, dissolveOut: 0.36 };
      fetch('hero.json').then((r) => r.json()).then((timing) => { scene = timing; }).catch(() => {});
      // How long ago the film's last scene began, counted round the film's loop.
      const sinceScene = () => ((video.currentTime - scene.sceneStarts) % scene.filmDuration + scene.filmDuration) % scene.filmDuration;
      let riding = false;
      let before = Infinity;
      const rest = () => { riding = false; for (const rider of mounted) { rider.element.style.opacity = 0; rider.player.pause(); } };
      const walk = () => {
        requestAnimationFrame(walk);
        if (!Number.isFinite(scene.sceneStarts)) return;
        const now = sinceScene();
        if (!riding && before > scene.filmDuration / 2 && now < 1 && !video.paused) { riding = true; before = now; }  // the film has just reached its last scene
        if (!riding) { before = now; return; }
        const box = mounted[0].element.getBoundingClientRect();
        const width = box.width;
        // A stride carries a knight 210 pixels for every 1000 its box is high: the pace its unseen hooves walk at.
        const speed = 210 / STRIDE_SECONDS * box.height / 1000;
        const lane = stage.getBoundingClientRect().left - shell.getBoundingClientRect().left;  // page to the left of the film
        const cut = scene.filmDuration - scene.sceneStarts - 0.4;  // when the film dissolves back to its opening
        let anyLeft = false;
        for (const rider of mounted) {
          const x = rider.start * width - speed * now;
          // A knight who is clear of the film at the cut keeps walking to the shell's edge; one still inside dissolves with it.
          const clear = rider.start * width - speed * cut + DRAWN_TO * width < 0;
          let opacity = Math.min(1, now / scene.dissolveIn);
          if (!clear) opacity *= 1 - Math.min(1, Math.max(0, (now - cut) / scene.dissolveOut));
          const gone = x + width < -lane - 4 || (!clear && now >= cut + scene.dissolveOut);  // past the shell's edge, or dissolved with the film
          rider.element.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
          rider.element.style.opacity = gone ? 0 : opacity;
          if (gone || video.paused) { if (!rider.player.paused) rider.player.pause(); } else if (rider.player.paused) rider.player.play();
          if (!gone) anyLeft = true;
        }
        if (!anyLeft || now < before - 1) rest();  // all gone, or the film was moved elsewhere
        before = now;
      };
      requestAnimationFrame(walk);
    }
  });
}

// The App Store button is not available yet. It does nothing when pressed, and says so on hover and on focus.
const soon = document.getElementById('app-store');
const note = document.getElementById('app-store-note');
if (soon && note) {
  const show = () => { note.hidden = false; };
  const hide = () => { note.hidden = true; };
  soon.addEventListener('click', (event) => event.preventDefault());
  soon.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); if (event.key === 'Escape') hide(); });
  soon.addEventListener('mouseenter', show);
  soon.addEventListener('focus', show);
  soon.addEventListener('mouseleave', hide);
  soon.addEventListener('blur', hide);
}
