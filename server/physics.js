import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
  MOVE_ACCEL, MOVE_FRICTION, DOUBLE_JUMP_FORCE, TRAMPOLINE_FORCE,
  DASH_CHARGE_RATE, DASH_SPEED, DASH_DURATION, SPEED_PAD_MULTIPLIER,
  CONVEYOR_SPEED,
} from '../shared/constants.js';

const PASSTHROUGH_TYPES = new Set(['jumpthrough', 'oneway']);

export function updatePlayer(p, platforms) {
  if (p.frozen) return;

  // Check if player is standing on a speed pad (from last tick's ground state)
  let onSpeedPad = false;
  if (p.onGround) {
    for (const plat of platforms) {
      if (plat.gone) continue;
      if (plat.type === 'dash_block' &&
          p.x + PLAYER_WIDTH > plat.x && p.x < plat.x + plat.w &&
          Math.abs((p.y + PLAYER_HEIGHT) - plat.y) < 3) {
        onSpeedPad = true;
        p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE * 4); // faster charge on pad
        break;
      }
    }
  }

  // Check if player is on a conveyor
  if (p.onGround) {
    for (const plat of platforms) {
      if (plat.gone) continue;
      if (plat.type === 'conveyor' &&
          p.x + PLAYER_WIDTH > plat.x && p.x < plat.x + plat.w &&
          Math.abs((p.y + PLAYER_HEIGHT) - plat.y) < 3) {
        const dir = plat.pushDir || 0;
        if (dir === 0) p.vx += CONVEYOR_SPEED;       // right
        else if (dir === 1) p.vy += CONVEYOR_SPEED;   // down (will be overridden by gravity mostly)
        else if (dir === 2) p.vx -= CONVEYOR_SPEED;   // left
        else if (dir === 3) p.vy -= CONVEYOR_SPEED;   // up
        break;
      }
    }
  }

  const speedMul = onSpeedPad ? SPEED_PAD_MULTIPLIER : 1;
  const speed = MOVE_SPEED * speedMul * (p.isIt ? IT_SPEED_BOOST : 1);

  // --- Dash ---
  if (p.dashTicks <= 0) {
    p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE);
  }

  if (p.input.dash && !p.dashHeld && p.dashCharge >= 1 && p.dashTicks <= 0) {
    p.dashTicks = DASH_DURATION;
    p.dashCharge = 0;
  }
  p.dashHeld = p.input.dash;

  if (p.dashTicks > 0) {
    p.dashTicks--;
    p.vx = p.facingRight ? DASH_SPEED : -DASH_SPEED;
  } else {
    let targetVx = 0;
    if (p.input.left) { targetVx = -speed; p.facingRight = false; }
    if (p.input.right) { targetVx = speed; p.facingRight = true; }

    if (targetVx !== 0) {
      p.vx += (targetVx - p.vx) * MOVE_ACCEL;
    } else {
      p.vx *= MOVE_FRICTION;
      if (Math.abs(p.vx) < 0.3) p.vx = 0;
    }
  }

  // --- Wall detection ---
  const touchingWallLeft = isTouchingWall(p, platforms, -2);
  const touchingWallRight = isTouchingWall(p, platforms, 2);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

  // --- Jump / Double Jump / Wall Jump ---
  if (p.input.jump && !p.jumpHeld) {
    if (p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
    } else if (p.hasDoubleJump) {
      if (touchingWallLeft || touchingWallRight) {
        p.vy = WALL_JUMP_FORCE_Y;
        p.vx = touchingWallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
        p.facingRight = touchingWallLeft;
      } else {
        p.vy = DOUBLE_JUMP_FORCE;
      }
      p.hasDoubleJump = false;
    }
  }
  p.jumpHeld = p.input.jump;

  // --- Gravity + wall slide ---
  p.vy += GRAVITY;
  if (onWall && p.vy > 0 && p.dashTicks <= 0) {
    p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
  }
  if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

  // --- Move X ---
  moveAxis(p, platforms, p.vx);

  // --- Move Y (substep) ---
  const steps = Math.max(1, Math.ceil(Math.abs(p.vy) / 8));
  const stepVy = p.vy / steps;
  p.onGround = false;
  for (let i = 0; i < steps; i++) {
    p.y += stepVy;
    for (const plat of platforms) {
      if (plat.gone) continue;
      if (overlaps(p, plat)) {
        if (stepVy > 0) {
          if (PASSTHROUGH_TYPES.has(plat.type)) {
            const prevBottom = (p.y - stepVy) + PLAYER_HEIGHT;
            if (prevBottom > plat.y + 2) continue;
          }
          p.y = plat.y - PLAYER_HEIGHT;
          if (plat.type === 'trampoline') {
            const bd = plat.bounceDir;
            if (bd === undefined || bd === 0) {
              // Default: bounce up
              p.vy = TRAMPOLINE_FORCE;
              p.hasDoubleJump = true;
              return;
            } else if (bd === 2) {
              // Ceiling trampoline bouncing down — shouldn't land on it from above normally
              // but handle it: bounce up same as default
              p.vy = TRAMPOLINE_FORCE;
              p.hasDoubleJump = true;
              return;
            }
            // bounceDir 1 (left) or 3 (right) are wall trampolines, handled in moveAxis
            // If we somehow land on them, just bounce up
            p.vy = TRAMPOLINE_FORCE;
            p.hasDoubleJump = true;
            return;
          }
          if (plat.type === 'dash_block') {
            p.dashCharge = 1;
          }
          p.onGround = true;
        } else {
          // Going up, hitting something above
          if (PASSTHROUGH_TYPES.has(plat.type)) continue;
          // Ceiling trampoline: bounceDir 2 means bounce down
          if (plat.type === 'trampoline' && plat.bounceDir === 2) {
            p.y = plat.y + plat.h;
            p.vy = -TRAMPOLINE_FORCE; // positive = downward
            p.hasDoubleJump = true;
            return;
          }
          p.y = plat.y + plat.h;
        }
        p.vy = 0;
        if (p.onGround) p.hasDoubleJump = true;
        return;
      }
    }
  }

  if (p.y < 0) { p.y = 0; p.vy = 0; }
}

function moveAxis(p, platforms, vx) {
  p.x += vx;
  for (const plat of platforms) {
    if (plat.gone) continue;
    if (PASSTHROUGH_TYPES.has(plat.type)) continue;
    if (overlaps(p, plat)) {
      // Wall trampoline bounce
      if (plat.type === 'trampoline') {
        const bd = plat.bounceDir;
        if (bd === 1) {
          // Right-side strip, bounces player left
          p.x = plat.x - PLAYER_WIDTH;
          p.vx = TRAMPOLINE_FORCE; // -14, pushes left
          p.vy = 0;
          p.hasDoubleJump = true;
          return;
        } else if (bd === 3) {
          // Left-side strip, bounces player right
          p.x = plat.x + plat.w;
          p.vx = -TRAMPOLINE_FORCE; // +14, pushes right
          p.vy = 0;
          p.hasDoubleJump = true;
          return;
        }
      }
      if (vx > 0) p.x = plat.x - PLAYER_WIDTH;
      else if (vx < 0) p.x = plat.x + plat.w;
      p.vx = 0;
    }
  }
}

function overlaps(p, plat) {
  return (
    p.x < plat.x + plat.w &&
    p.x + PLAYER_WIDTH > plat.x &&
    p.y < plat.y + plat.h &&
    p.y + PLAYER_HEIGHT > plat.y
  );
}

function isTouchingWall(p, platforms, dir) {
  const testX = p.x + dir;
  for (const plat of platforms) {
    if (plat.gone) continue;
    if (PASSTHROUGH_TYPES.has(plat.type)) continue;
    if (
      testX < plat.x + plat.w &&
      testX + PLAYER_WIDTH > plat.x &&
      p.y < plat.y + plat.h &&
      p.y + PLAYER_HEIGHT > plat.y
    ) return true;
  }
  return false;
}

export function playerCenter(p) {
  return { x: p.x + PLAYER_WIDTH / 2, y: p.y + PLAYER_HEIGHT / 2 };
}

export function distance(a, b) {
  const ac = playerCenter(a);
  const bc = playerCenter(b);
  const dx = ac.x - bc.x;
  const dy = ac.y - bc.y;
  return Math.sqrt(dx * dx + dy * dy);
}
