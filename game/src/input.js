// Keyboard + mouse input. One job: turn presses into named actions the world
// can read, and expose the same actions to mouse clicks on the canvas.
export const ACTIONS = {
  jump: false,
  slide: false,
  sprint: false,
  gobble: false,
  confirm: false,
  restart: false,
};

const KEYMAP = {
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  KeyG: 'gobble',
  KeyX: 'gobble',
  Enter: 'confirm',
  KeyR: 'restart',
};

// Edge-triggered presses: true for exactly one world step after the key goes down.
const pressed = { jump: false, slide: false, sprint: false, gobble: false, confirm: false, restart: false };
const held = { jump: false, slide: false, sprint: false, gobble: false, confirm: false, restart: false };

export function attachInput(canvas, onClick) {
  window.addEventListener('keydown', (event) => {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!held[action]) pressed[action] = true;
    held[action] = true;
    ACTIONS[action] = true;
  });
  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (!action) return;
    held[action] = false;
    ACTIONS[action] = false;
  });
  window.addEventListener('blur', () => {
    for (const key of Object.keys(held)) held[key] = false;
    for (const key of Object.keys(ACTIONS)) ACTIONS[key] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    onClick((event.clientX - rect.left) * (canvas.width / rect.width), (event.clientY - rect.top) * (canvas.height / rect.height));
  });
}

/** Consume one edge-triggered press; returns true only on the step it fired. */
export function consumePress(action) {
  if (!pressed[action]) return false;
  pressed[action] = false;
  return true;
}

export function clearPresses() {
  for (const key of Object.keys(pressed)) pressed[key] = false;
}
