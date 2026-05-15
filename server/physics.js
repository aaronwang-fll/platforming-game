import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
  MOVE_ACCEL, MOVE_FRICTION, DOUBLE_JUMP_FORCE, TRAMPOLINE_FORCE,
  DASH_CHARGE_RATE, DASH_SPEED, DASH_DURATION, SPEED_PAD_MULTIPLIER,
  CONVEYOR_SPEED,
} from '../shared/constants.js';

function isPassthrough(plat) {
  return plat.type === 'jumpthrough' || plat.type === 'oneway';
}

function getPassDir(plat) {
  if (plat.type === 'oneway') return 0;
  return plat.passDir || 0;
}

// Should we skip horizontal collision for this passthrough platform?
function skipHorizontalCollision(plat, vx) {
  if (!isPassthrough(plat)) return false;
  const pd = getPassDir(plat);
  // passDir 0 (from below) or 2 (from above): no horizontal collision
  if (pd === 0 || pd === 2) return true;
  // passDir 1 (from left): skip if moving right into it
  if (pd === 1 && vx > 0) return true;
  // passDir 3 (from right): skip if moving left into it
  if (pd === 3 && vx < 0) return true;
  return false;
}

// Should we skip vertical collision for this passthrough platform?
function skipVerticalCollision(plat, stepVy, prevBottom, platY) {
  if (!isPassthrough(plat)) return false;
  const pd = getPassDir(plat);
  if (pd === 0) {
    // Pass from below: skip going up, land going down (original behavior)
    if (stepVy > 0) {
      // Landing — only if was above
      if (prevBottom > platY + 2) return true; // was already inside, skip
      return false; // land on it
    }
    return true; // going up, skip
  }
  if (pd === 2) {
    // Pass from above: skip going down, block going up
    if (stepVy < 0) {
      // Going up — only block if was below
      const prevTop = (prevBottom - PLAYER_HEIGHT) - (-stepVy); // approximate prev top
      // Actually let's just check: skip if going down
      return false; // block going up
    }
    return true; // going down, skip
  }
  // passDir 1 or 3: no vertical collision
  return true;
}

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

  // Check if player is on a floor conveyor
  if (p.onGround) {
    for (const plat of platforms) {
      if (plat.gone) continue;
      if (plat.type === 'conveyor' &&
          p.x + PLAYER_WIDTH > plat.x && p.x < plat.x + plat.w &&
          Math.abs((p.y + PLAYER_HEIGHT) - plat.y) < 3) {
        const dir = plat.pushDir || 0;
        if (dir === 0) p.vx += CONVEYOR_SPEED;       // right
        else if (dir === 2) p.vx -= CONVEYOR_SPEED;   // left
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

  // --- Wall conveyor detection ---
  let onWallConveyor = false;
  let wallConveyorPushDir = -1;
  if (onWall) {
    const wallDir = touchingWallLeft ? -2 : 2;
    const holdingToward = (touchingWallLeft && p.input.left) || (touchingWallRight && p.input.right);
    if (holdingToward) {
      const testX = p.x + wallDir;
      for (const plat of platforms) {
        if (plat.gone) continue;
        if (plat.type === 'conveyor' &&
            testX < plat.x + plat.w &&
            testX + PLAYER_WIDTH > plat.x &&
            p.y < plat.y + plat.h &&
            p.y + PLAYER_HEIGHT > plat.y) {
          const dir = plat.pushDir || 0;
          // Only wall conveyors (rotation 1 or 3) apply wall-ride
          if (dir === 1 || dir === 3) {
            onWallConveyor = true;
            wallConveyorPushDir = dir;
          }
          break;
        }
      }
    }
  }

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
  if (onWallConveyor) {
    // Cancel gravity, apply conveyor direction
    if (wallConveyorPushDir === 1) p.vy = CONVEYOR_SPEED;   // down
    else if (wallConveyorPushDir === 3) p.vy = -CONVEYOR_SPEED; // up
  } else {
    p.vy += GRAVITY;
    if (onWall && p.vy > 0 && p.dashTicks <= 0) {
      p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
    }
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
          // Going down
          if (isPassthrough(plat)) {
            const pd = getPassDir(plat);
            if (pd === 0) {
              // Pass from below: land on top
              const prevBottom = (p.y - stepVy) + PLAYER_HEIGHT;
              if (prevBottom > plat.y + 2) continue;
            } else if (pd === 2) {
              // Pass from above: skip going down
              continue;
            } else {
              // passDir 1 or 3: no vertical collision
              continue;
            }
          }
          p.y = plat.y - PLAYER_HEIGHT;
          if (plat.type === 'trampoline') {
            const bd = plat.bounceDir;
            if (bd === undefined || bd === 0) {
              p.vy = TRAMPOLINE_FORCE;
              p.hasDoubleJump = true;
              return;
            } else if (bd === 2) {
              p.vy = TRAMPOLINE_FORCE;
              p.hasDoubleJump = true;
              return;
            }
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
          if (isPassthrough(plat)) {
            const pd = getPassDir(plat);
            if (pd === 0) {
              // Pass from below: skip going up
              continue;
            } else if (pd === 2) {
              // Pass from above: block going up
              // fall through to blocking code below
            } else {
              // passDir 1 or 3: no vertical collision
              continue;
            }
          }
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
    if (skipHorizontalCollision(plat, vx)) continue;
    if (overlaps(p, plat)) {
      // Wall trampoline bounce
      if (plat.type === 'trampoline') {
        const bd = plat.bounceDir;
        if (bd === 1) {
          p.x = plat.x - PLAYER_WIDTH;
          p.vx = TRAMPOLINE_FORCE;
          p.vy = 0;
          p.hasDoubleJump = true;
          return;
        } else if (bd === 3) {
          p.x = plat.x + plat.w;
          p.vx = -TRAMPOLINE_FORCE;
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
    if (isPassthrough(plat)) {
      const pd = getPassDir(plat);
      // Only skip wall detection for passDir 0 and 2 (no horizontal collision)
      if (pd === 0 || pd === 2) continue;
      // For passDir 1: solid on left side (blocks rightward), skip if approaching from right
      if (pd === 1 && dir > 0) continue;
      // For passDir 3: solid on right side (blocks leftward), skip if approaching from left
      if (pd === 3 && dir < 0) continue;
    }
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
