// The home page's panes of glass. Hold one and move it around while its animation keeps playing; the frost is the
// browser's backdrop-filter, so it shows whatever the pane is over, other panes included.
// A mouse picks a pane up at once. A finger has to be able to scroll the page past the panes, so it picks one up by
// holding still for a moment or by moving sideways; moving up or down first scrolls as usual.
const HOLD_MS = 180;
const SLOP = 10;
const panes = [...document.querySelectorAll('.pane')];
let front = panes.length + 1;

for (const pane of panes) {
  let x = 0, y = 0;            // where the pane has been moved to
  let startX = 0, startY = 0;  // where the pointer went down
  let fromX = 0, fromY = 0;    // where the pane was then
  let limits = null;
  let waiting = null;          // a finger is down, and hasn't yet picked the pane up
  let held = false;

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
  };
  const letGo = () => {
    clearTimeout(waiting);
    waiting = null;
    held = false;
    pane.classList.remove('held');
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
  pane.addEventListener('pointerup', letGo);
  pane.addEventListener('pointercancel', letGo);
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
