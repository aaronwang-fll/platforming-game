const DEFAULT_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'KeyW', 'ArrowUp'],
  dash: ['ShiftLeft', 'ShiftRight'],
};

export function keyDisplayName(code) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map = {
    ArrowLeft: '\u2190', ArrowRight: '\u2192', ArrowUp: '\u2191', ArrowDown: '\u2193',
    Space: 'Space', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
    ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt', AltRight: 'R-Alt',
    Tab: 'Tab', Enter: 'Enter', Backspace: 'Bksp',
    CapsLock: 'Caps', Escape: 'Esc',
  };
  return map[code] || code;
}

export class Input {
  constructor() {
    this.keys = {};
    this.bindings = this.loadBindings();

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      const allBound = Object.values(this.bindings).flat();
      if (allBound.includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  loadBindings() {
    try {
      const saved = localStorage.getItem('tag_keybindings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate structure
        if (parsed.left && parsed.right && parsed.jump && parsed.dash) return parsed;
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
  }

  saveBindings() {
    localStorage.setItem('tag_keybindings', JSON.stringify(this.bindings));
  }

  resetBindings() {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.saveBindings();
  }

  addKey(action, code) {
    if (!this.bindings[action]) return;
    if (this.bindings[action].includes(code)) return;
    this.bindings[action].push(code);
    this.saveBindings();
  }

  removeKey(action, code) {
    if (!this.bindings[action]) return;
    this.bindings[action] = this.bindings[action].filter(k => k !== code);
    this.saveBindings();
  }

  getState() {
    return {
      left: this.bindings.left.some(k => this.keys[k]),
      right: this.bindings.right.some(k => this.keys[k]),
      jump: this.bindings.jump.some(k => this.keys[k]),
      dash: this.bindings.dash.some(k => this.keys[k]),
    };
  }
}
