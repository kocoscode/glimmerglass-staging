// The home page's panes of glass. Each animation holds still until the pointer is over its pane (owner, 1 Nov 2026:
// three playing at once would overwhelm the page). Hold a pane and move it around and it keeps playing. The frost is
// the browser's backdrop-filter, so it shows whatever the pane is over, other panes included.
// The page drives the player itself, because a pane must also play while a finger holds it, and the player's own
// "hover" would count the end of every drag as a tap. A tap on a touch screen starts one pane and stops any other.
// With motion turned off (motion.js) a pane moves only while it is held: that is the visitor asking.
// A mouse picks a pane up at once. A finger has to be able to scroll the page past the panes, so it picks one up by
// holding still for a moment or by moving sideways; moving up or down first scrolls as usual.
const HOLD_MS = 180;
const SLOP = 10;
const panes = [...document.querySelectorAll('.pane')];
let front = panes.length + 1;
let tapped = null;  // the pane a tap has started
const still = () => (window.glimmerglassStill ? window.glimmerglassStill() : matchMedia('(prefers-reduced-motion: reduce)').matches);
const refreshers = [];

for (const pane of panes) {
  let x = 0, y = 0;            // where the pane has been moved to
  let startX = 0, startY = 0;  // where the pointer went down
  let fromX = 0, fromY = 0;    // where the pane was then
  let limits = null;
  let waiting = null;          // a finger is down, and hasn't yet picked the pane up
  let held = false;
  let hovering = false;
  let focused = false;
  let player = null;

  // Nothing of a .glim is fetched until its pane is first wanted: a visitor who never touches the panes gets only the
  // still pictures. After that the player reads the file's list and fetches the one video that fits this screen.
  const art = pane.querySelector('.pane-art');
  const refresh = () => {
    const wanted = held || tapped === pane || (!still() && (hovering || focused));
    if (!player) {
      if (!wanted || !window.Glimmerglass || !art) return;
      player = Glimmerglass.mount(art, { manifest: art.dataset.glim, alt: art.dataset.alt, play: 'always', autoplay: false, control: 'never', preload: 'auto' });
    }
    if (wanted) player.play();
    else player.pause();
  };
  refreshers.push(refresh);

  const place = () => {
    pane.style.setProperty('--dx', `${x}px`);
    pane.style.setProperty('--dy', `${y}px`);
  };
  // A pane can leave the hero, but stays on the page with at least a corner to get hold of.
  const measure = () => {
    const box = pane.getBoundingClientRect();
    const shell = pane.closest('.shell').getBoundingClientRect();
    const keep = Math.min(96, box.width / 3);
    limits = {
      left: shell.left + keep - box.right + x,
      right: shell.right - keep - box.left + x,
      top: shell.top - box.top + y,
      bottom: shell.bottom - keep - box.top + y,
    };
  };
  const clampTo = (value, low, high) => Math.min(high, Math.max(low, value));
  const moveTo = (nextX, nextY) => {
    x = clampTo(nextX, limits.left, limits.right);
    y = clampTo(nextY, limits.top, limits.bottom);
    place();
  };
  const raise = () => { pane.style.zIndex = ++front; };
  const pickUp = (pointerId) => {
    clearTimeout(waiting);
    waiting = null;
    held = true;
    raise();
    measure();
    pane.classList.add('held');
    pane.setPointerCapture(pointerId);
    refresh();
  };
  const letGo = () => {
    clearTimeout(waiting);
    waiting = null;
    held = false;
    pane.classList.remove('held');
    refresh();
  };

  pane.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    fromX = x;
    fromY = y;
    if (event.pointerType === 'touch') waiting = setTimeout(() => pickUp(event.pointerId), HOLD_MS);
    else pickUp(event.pointerId);
  });
  pane.addEventListener('pointermove', (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (waiting !== null) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      if (Math.abs(dx) > Math.abs(dy)) pickUp(event.pointerId);
      else letGo();
      return;
    }
    if (held) moveTo(fromX + dx, fromY + dy);
  });
  pane.addEventListener('pointerup', () => {
    // A finger that went down and came up without picking the pane up is a tap.
    if (waiting !== null) {
      tapped = tapped === pane ? null : pane;
      letGo();
      refreshers.forEach((update) => update());
      return;
    }
    letGo();
  });
  pane.addEventListener('pointercancel', letGo);
  pane.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') { hovering = true; refresh(); } });
  pane.addEventListener('pointerleave', (event) => { if (event.pointerType !== 'touch') { hovering = false; refresh(); } });
  // By keyboard, reaching a pane is the same as hovering over it. A mouse click focuses it too, and that must not count.
  pane.addEventListener('focus', () => { focused = pane.matches(':focus-visible'); refresh(); });
  pane.addEventListener('blur', () => { focused = false; refresh(); });
  // Once a finger has the pane, the page must not scroll under it. Only a listener that can cancel touchmove stops that.
  pane.addEventListener('touchmove', (event) => { if (held) event.preventDefault(); }, { passive: false });
  pane.addEventListener('contextmenu', (event) => { if (held || waiting !== null) event.preventDefault(); });
  pane.addEventListener('dragstart', (event) => event.preventDefault());

  const STEP = 24;
  const KEYS = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] };
  pane.addEventListener('keydown', (event) => {
    const step = KEYS[event.key];
    if (!step) return;
    event.preventDefault();
    raise();
    measure();
    moveTo(x + step[0], y + step[1]);
  });
}
