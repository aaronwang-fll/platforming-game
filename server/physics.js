import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
} from '../shared/constants.js';

export function updatePlayer(p, platforms) {
  const speed = MOVE_SPEED * (p.isIt ? IT_SPEED_BOOST : 1);

  // Horizontal movement
  p.vx = 0;
  if (p.frozen) return; // frozen players don't move

  if (p.input.left) { p.vx = -speed; p.facingRight = false; }
  if (p.input.right) { p.vx = speed; p.facingRight = true; }

  // Wall detection (before jump, so wall-jump works)
  const touchingWallLeft = isTouchingWall(p, platforms, -1);
  const touchingWallRight = isTouchingWall(p, platforms, 1);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

  // Jump
  if (p.input.jump && !p.jumpHeld) {
    if (p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
    } else if (onWall) {
      // Wall jump
      p.vy = WALL_JUMP_FORCE_Y;
      p.vx = touchingWallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
      p.facingRight = touchingWallLeft;
    }
  }
  p.jumpHeld = p.input.jump;

  // Gravity + wall slide
  p.vy += GRAVITY;
  if (onWall && p.vy > 0) {
    p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
  }
  if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

  // Move X
  p.x += p.vx;
  for (const plat of platforms) {
    if (overlaps(p, plat)) {
      if (p.vx > 0) p.x = plat.x - PLAYER_WIDTH;
      else if (p.vx < 0) p.x = plat.x + plat.w;
      p.vx = 0;
    }
  }

  // Move Y
  p.y += p.vy;
  p.onGround = false;
  for (const plat of platforms) {
    if (overlaps(p, plat)) {
      if (p.vy > 0) {
        p.y = plat.y - PLAYER_HEIGHT;
        p.onGround = true;
      } else if (p.vy < 0) {
        p.y = plat.y + plat.h;
      }
      p.vy = 0;
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
    ) {
      return true;
    }
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
