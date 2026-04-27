import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
  WALL_JUMP_COOLDOWN, DASH_CHARGE_RATE, DASH_SPEED, DASH_DURATION,
} from '../shared/constants.js';

export function updatePlayer(p, platforms) {
  if (p.frozen) return;

  const speed = MOVE_SPEED * (p.isIt ? IT_SPEED_BOOST : 1);

  // Tick down wall-jump cooldown
  if (p.wallJumpCooldown > 0) p.wallJumpCooldown--;

  // --- Dash ---
  // Charge when not dashing
  if (p.dashTicks <= 0) {
    p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE);
  }

  // Trigger dash
  if (p.input.dash && !p.dashHeld && p.dashCharge >= 1 && p.dashTicks <= 0) {
    p.dashTicks = DASH_DURATION;
    p.dashCharge = 0;
  }
  p.dashHeld = p.input.dash;

  // During dash: override horizontal velocity
  if (p.dashTicks > 0) {
    p.dashTicks--;
    p.vx = p.facingRight ? DASH_SPEED : -DASH_SPEED;
  } else {
    p.vx = 0;
    if (p.input.left) { p.vx = -speed; p.facingRight = false; }
    if (p.input.right) { p.vx = speed; p.facingRight = true; }
  }

  // --- Wall detection ---
  const touchingWallLeft = isTouchingWall(p, platforms, -2);
  const touchingWallRight = isTouchingWall(p, platforms, 2);
  const canWallJump = !p.onGround && p.wallJumpCooldown <= 0 && (touchingWallLeft || touchingWallRight);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

  // --- Jump ---
  if (p.input.jump && !p.jumpHeld) {
    if (p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
    } else if (canWallJump) {
      p.vy = WALL_JUMP_FORCE_Y;
      p.vx = touchingWallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
      p.facingRight = touchingWallLeft;
      p.wallJumpCooldown = WALL_JUMP_COOLDOWN;
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
      if (overlaps(p, plat)) {
        if (stepVy > 0) {
          p.y = plat.y - PLAYER_HEIGHT;
          p.onGround = true;
        } else {
          p.y = plat.y + plat.h;
        }
        p.vy = 0;
        // Reset wall-jump cooldown on landing
        if (p.onGround) p.wallJumpCooldown = 0;
        return;
      }
    }
  }

  // Clamp to map top
  if (p.y < 0) { p.y = 0; p.vy = 0; }
}

function moveAxis(p, platforms, vx) {
  p.x += vx;
  for (const plat of platforms) {
    if (overlaps(p, plat)) {
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
