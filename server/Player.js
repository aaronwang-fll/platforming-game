export class Player {
  constructor(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
    this.jumpHeld = false;
    this.input = { left: false, right: false, jump: false, dash: false };

    // Tag state
    this.isIt = false;
    this.frozen = false;
    this.immuneUntil = 0;
    this.itTime = 0;
    this.alive = true;

    // Unfreeze progress (freeze tag)
    this.unfreezeProgress = 0;

    // Double jump (replaces wall-jump cooldown)
    this.hasDoubleJump = true;

    // Dash
    this.dashCharge = 1; // start full
    this.dashTicks = 0;  // ticks remaining in active dash
    this.dashHeld = false;

    // Bounce air control
    this.bounceTicks = 0;
  }

  spawn(sx, sy) {
    this.x = sx;
    this.y = sy;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = true;
    this.hasDoubleJump = true;
    this.dashCharge = 1;
    this.dashTicks = 0;
    this.bounceTicks = 0;
  }

  toSnapshot() {
    return {
      id: this.id,
      x: Math.round(this.x * 10) / 10,
      y: Math.round(this.y * 10) / 10,
      vx: Math.round(this.vx * 10) / 10,
      vy: Math.round(this.vy * 10) / 10,
      facingRight: this.facingRight,
      isIt: this.isIt,
      frozen: this.frozen,
      alive: this.alive,
      unfreezeProgress: this.frozen ? Math.round(this.unfreezeProgress * 100) / 100 : 0,
      dashCharge: Math.round(this.dashCharge * 100) / 100,
      dashing: this.dashTicks > 0,
    };
  }

  toLobbyInfo() {
    return { id: this.id, name: this.name, color: this.color };
  }
}
