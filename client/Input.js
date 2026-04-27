export class Input {
  constructor() {
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  getState() {
    return {
      left: !!(this.keys['ArrowLeft'] || this.keys['KeyA']),
      right: !!(this.keys['ArrowRight'] || this.keys['KeyD']),
      jump: !!(this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']),
      dash: !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']),
    };
  }
}
