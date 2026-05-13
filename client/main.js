import { Input } from '/client/Input.js';
import { Renderer } from '/client/Renderer.js';
import { Camera } from '/client/Camera.js';
import { NetClient } from '/client/NetClient.js';
import { Interpolation } from '/client/Interpolation.js';
import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_COLORS, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
  MOVE_ACCEL, MOVE_FRICTION, DOUBLE_JUMP_FORCE, TRAMPOLINE_FORCE,
  DASH_CHARGE_RATE, DASH_SPEED, DASH_DURATION,
  CRUMBLE_DELAY, CRUMBLE_GONE_TIME,
} from '/shared/constants.js';
import { C, S } from '/shared/protocol.js';

const PASSTHROUGH_TYPES = new Set(['jumpthrough', 'oneway']);

// --- DOM elements ---
const canvas = document.getElementById('game');
const lobby = document.getElementById('lobby');
const roomInfo = document.getElementById('room-info');
const roomCodeEl = document.getElementById('room-code');
const playerListEl = document.getElementById('player-list');
const hostControls = document.getElementById('host-controls');
const gameOverEl = document.getElementById('game-over');
const resultsListEl = document.getElementById('results-list');

const nameInput = document.getElementById('name-input');
const codeInput = document.getElementById('code-input');
const colorPickerEl = document.getElementById('color-picker');
const modeSelect = document.getElementById('mode-select');
const mapSelect = document.getElementById('map-select');

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const btnStart = document.getElementById('btn-start');
const btnBackLobby = document.getElementById('btn-back-lobby');
const btnQuit = document.getElementById('btn-quit');
const btnEndGame = document.getElementById('btn-end-game');
const btnPractice = document.getElementById('btn-practice');

// --- State ---
const renderer = new Renderer(canvas);
const camera = new Camera();
const input = new Input();
const net = new NetClient();
const interp = new Interpolation();

let myId = null;
let isHost = false;
let currentMap = null;
let currentMode = null;
let lobbyPlayers = [];
let selectedColor = PLAYER_COLORS[0];
let gameActive = false;
let localPlayer = null;
let lastInput = { left: false, right: false, jump: false, dash: false };
const effects = [];
let showInstructions = false;

// Crumble platform state (synced from server, used for rendering & prediction)
let crumbleState = new Map(); // platformIndex -> timer

// --- Instructions toggle ---
window.addEventListener('keydown', e => {
  if (e.code === 'KeyH' && gameActive) {
    showInstructions = !showInstructions;
  }
});
canvas.addEventListener('click', () => {
  if (showInstructions) showInstructions = false;
});
document.getElementById('btn-help').addEventListener('click', () => {
  showInstructions = true;
  if (!gameActive) {
    gameActive = true;
    currentMap = practiceMap;
    localPlayer = null;
    showScreen('game');
    requestAnimationFrame(function showHelp() {
      if (!showInstructions) {
        gameActive = false;
        showScreen('lobby');
        return;
      }
      renderer.clear(currentMap.bg);
      renderer.drawInstructions();
      requestAnimationFrame(showHelp);
    });
  }
});

// --- Color picker ---
PLAYER_COLORS.forEach((color, i) => {
  const el = document.createElement('div');
  el.className = 'color-swatch' + (i === 0 ? ' selected' : '');
  el.style.background = color;
  el.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    selectedColor = color;
  });
  colorPickerEl.appendChild(el);
});

// --- Lobby UI ---
btnCreate.addEventListener('click', () => {
  if (!net.connected) { alert('Connecting to server... try again in a moment.'); return; }
  net.send({ type: C.CREATE_ROOM, name: nameInput.value || 'Player', color: selectedColor });
});

btnJoin.addEventListener('click', () => {
  if (!net.connected) { alert('Connecting to server... try again in a moment.'); return; }
  const code = codeInput.value.toUpperCase().trim();
  if (code.length < 4) { alert('Enter a 4-letter room code'); return; }
  btnJoin.textContent = 'Joining...';
  btnJoin.disabled = true;
  net.send({ type: C.JOIN_ROOM, code, name: nameInput.value || 'Player', color: selectedColor });
  setTimeout(() => { btnJoin.textContent = 'Join Room'; btnJoin.disabled = false; }, 3000);
});

btnStart.addEventListener('click', () => {
  if (!net.connected) return;
  btnStart.textContent = 'Starting...';
  net.send({ type: C.START_GAME });
  setTimeout(() => { btnStart.textContent = 'Start Game'; }, 3000);
});

btnBackLobby.addEventListener('click', () => {
  net.send({ type: 'RETURN_TO_LOBBY' });
});

// Quit game (leave room, go back to main menu)
btnQuit.addEventListener('click', () => {
  gameActive = false;
  if (practiceMode) {
    practiceMode = false;
  } else {
    net.send({ type: C.LEAVE });
  }
  resetToMenu();
});

// End game (host only — ends the game for everyone)
btnEndGame.addEventListener('click', () => {
  net.send({ type: 'END_GAME' });
});

// --- Practice mode (offline, no server) ---
let practiceMode = false;

const practiceMap = {
  name: 'Practice',
  width: 2000,
  height: 1200,
  bg: '#7EC8E3',
  theme: 'sky',
  platforms: [
    // Ground
    { x: 0, y: 1160, w: 420, h: 40 },
    { x: 520, y: 1160, w: 380, h: 40 },
    { x: 1000, y: 1160, w: 420, h: 40 },
    { x: 1520, y: 1160, w: 480, h: 40 },

    // Level 1
    { x: 100, y: 1000, w: 150, h: 16 },
    { x: 460, y: 1010, w: 140, h: 16 },
    { x: 800, y: 1000, w: 160, h: 16 },
    { x: 1200, y: 1010, w: 140, h: 16 },
    { x: 1600, y: 1000, w: 150, h: 16 },
    { x: 680, y: 1040, w: 100, h: 14, type: 'crumble', timer: 0, gone: false },

    // Level 2
    { x: 60, y: 820, w: 140, h: 16 },
    { x: 380, y: 830, w: 130, h: 16 },
    { x: 650, y: 820, w: 150, h: 10, type: 'jumpthrough' },
    { x: 960, y: 830, w: 140, h: 16 },
    { x: 1280, y: 820, w: 130, h: 16 },
    { x: 1600, y: 830, w: 140, h: 10, type: 'jumpthrough' },
    { x: 1820, y: 820, w: 60, h: 14, type: 'dash_block' },

    // Level 3
    { x: 160, y: 640, w: 130, h: 16 },
    { x: 440, y: 650, w: 120, h: 14, type: 'crumble', timer: 0, gone: false },
    { x: 720, y: 640, w: 140, h: 16 },
    { x: 1040, y: 650, w: 130, h: 16 },
    { x: 1340, y: 640, w: 120, h: 10, type: 'jumpthrough' },
    { x: 1660, y: 650, w: 130, h: 16 },

    // Level 4
    { x: 280, y: 460, w: 140, h: 16 },
    { x: 600, y: 470, w: 130, h: 10, type: 'oneway' },
    { x: 920, y: 460, w: 150, h: 16 },
    { x: 1260, y: 470, w: 130, h: 14, type: 'crumble', timer: 0, gone: false },
    { x: 1560, y: 460, w: 140, h: 16 },

    // Level 5
    { x: 450, y: 300, w: 130, h: 16 },
    { x: 800, y: 290, w: 160, h: 10, type: 'oneway' },
    { x: 1200, y: 300, w: 130, h: 16 },

    // Trampolines
    { x: 250, y: 1120, w: 50, h: 12, type: 'trampoline' },
    { x: 1460, y: 1120, w: 50, h: 12, type: 'trampoline' },
    { x: 540, y: 780, w: 50, h: 12, type: 'trampoline' },
    { x: 1140, y: 600, w: 50, h: 12, type: 'trampoline' },

    // Dash blocks
    { x: 380, y: 1120, w: 60, h: 14, type: 'dash_block' },
    { x: 1100, y: 790, w: 60, h: 14, type: 'dash_block' },

    // Walls
    { x: 0, y: 0, w: 20, h: 1200 },
    { x: 1980, y: 0, w: 20, h: 1200 },
  ],
};

btnPractice.addEventListener('click', () => {
  practiceMode = true;
  gameActive = true;
  currentMap = practiceMap;
  currentMode = null;
  lobbyPlayers = [{ id: '0', name: nameInput.value || 'You', color: selectedColor }];
  myId = '0';

  // Reset crumble state for practice
  for (const p of currentMap.platforms) {
    if (p.type === 'crumble') {
      p.timer = 0;
      p.gone = false;
    }
  }

  localPlayer = {
    x: 400, y: 1100,
    vx: 0, vy: 0,
    onGround: false, facingRight: true,
    jumpHeld: false, dashHeld: false,
    isIt: false, frozen: false,
    hasDoubleJump: true,
    dashCharge: 1, dashTicks: 0,
  };

  lastTime = 0;
  accumulator = 0;
  showScreen('game');
  requestAnimationFrame(gameLoop);
});

modeSelect.addEventListener('change', () => {
  net.send({ type: C.SET_MODE, mode: modeSelect.value });
});

mapSelect.addEventListener('change', () => {
  net.send({ type: C.SET_MAP, mapName: mapSelect.value });
});

// --- Network handlers ---
net.on('connected', () => {
  console.log('Connected to server');
  btnCreate.disabled = false;
  btnJoin.disabled = false;
  btnCreate.textContent = 'Create Room';
  btnJoin.textContent = 'Join Room';
});
net.on('disconnected', () => {
  gameActive = false;
  resetToMenu();
  btnCreate.disabled = true;
  btnJoin.disabled = true;
  btnCreate.textContent = 'Reconnecting...';
  setTimeout(() => net.connect(), 2000);
});

net.on(S.ERROR, (msg) => alert(msg.message));

net.on(S.ROOM_JOINED, (msg) => {
  myId = msg.yourId;
  isHost = msg.hostId === myId;
  lobbyPlayers = msg.players;
  currentMode = msg.mode;
  roomCodeEl.textContent = msg.code;
  updateLobbyUI();
  roomInfo.style.display = 'block';
  btnCreate.style.display = 'none';
  btnJoin.style.display = 'none';
  codeInput.style.display = 'none';
  nameInput.style.display = 'none';
  colorPickerEl.style.display = 'none';
  document.querySelector('.divider').style.display = 'none';
});

net.on(S.PLAYER_JOINED, (msg) => {
  lobbyPlayers.push(msg);
  updateLobbyUI();
});

net.on(S.PLAYER_LEFT, (msg) => {
  lobbyPlayers = lobbyPlayers.filter(p => p.id !== msg.id);
  updateLobbyUI();
});

net.on(S.HOST_CHANGED, (msg) => {
  isHost = msg.hostId === myId;
  updateLobbyUI();
});

net.on(S.MODE_CHANGED, (msg) => {
  currentMode = msg.mode;
  modeSelect.value = msg.mode;
});

net.on(S.MAP_CHANGED, (msg) => {
  mapSelect.value = msg.mapName;
});

net.on(S.GAME_STARTED, (msg) => {
  currentMap = msg.map;
  currentMode = msg.mode;
  gameActive = true;
  effects.length = 0;
  crumbleState = new Map();

  const myData = msg.players.find(p => p.id === myId);
  if (myData) {
    localPlayer = {
      x: myData.x, y: myData.y,
      vx: 0, vy: 0,
      onGround: false, facingRight: true,
      jumpHeld: false, dashHeld: false,
      isIt: myData.isIt, frozen: myData.frozen,
      hasDoubleJump: true,
      dashCharge: 1, dashTicks: 0,
    };
  }

  interp.buffer = [];
  lastTime = 0;
  accumulator = 0;

  showScreen('game');
  requestAnimationFrame(gameLoop);
});

net.on(S.SNAPSHOT, (msg) => {
  interp.pushSnapshot(msg);
  if (interp.buffer.length > 0) {
    interp.buffer[interp.buffer.length - 1].timeLeft = msg.timeLeft;
  }

  // Update crumble state from server
  if (msg.crumble) {
    crumbleState = new Map();
    for (const c of msg.crumble) {
      crumbleState.set(c.i, c.timer);
    }
  }

  // Reconcile local player with server
  if (localPlayer) {
    const serverMe = msg.players.find(p => p.id === myId);
    if (serverMe) {
      const dx = serverMe.x - localPlayer.x;
      const dy = serverMe.y - localPlayer.y;
      if (Math.abs(dx) > 80 || Math.abs(dy) > 80) {
        localPlayer.x = serverMe.x;
        localPlayer.y = serverMe.y;
        localPlayer.vy = serverMe.vy || 0;
      } else if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        localPlayer.x += dx * 0.1;
        localPlayer.y += dy * 0.1;
      }
      localPlayer.isIt = serverMe.isIt;
      localPlayer.frozen = serverMe.frozen;
      localPlayer.dashCharge = serverMe.dashCharge;
    }
  }
});

// Tag effects
net.on('tag', (msg) => {
  const t = findPlayerPos(msg.taggedId);
  if (t) spawnEffect('TAG!', t.x, t.y, '#f1c40f');
});
net.on('freeze', (msg) => {
  const t = findPlayerPos(msg.taggedId);
  if (t) spawnEffect('FROZEN!', t.x, t.y, '#88c8e8');
});
net.on('unfreeze', (msg) => {
  const t = findPlayerPos(msg.playerId);
  if (t) spawnEffect('FREE!', t.x, t.y, '#2ecc71');
});
net.on('infect', (msg) => {
  const t = findPlayerPos(msg.taggedId);
  if (t) spawnEffect('INFECTED!', t.x, t.y, '#e74c3c');
});

function findPlayerPos(id) {
  if (id === myId && localPlayer) return { x: localPlayer.x + PLAYER_WIDTH / 2, y: localPlayer.y };
  const latest = interp.buffer[interp.buffer.length - 1];
  if (!latest) return null;
  const p = latest.players.find(p => p.id === id);
  return p ? { x: p.x + PLAYER_WIDTH / 2, y: p.y } : null;
}

function spawnEffect(text, x, y, color) {
  effects.push({
    text, x, y, color,
    age: 0, maxAge: 50,
    particles: Array.from({ length: 6 }, () => ({
      dx: (Math.random() - 0.5) * 5,
      dy: (Math.random() - 0.5) * 3 - 2,
    })),
  });
}

net.on(S.GAME_OVER, (msg) => {
  gameActive = false;
  showGameOver(msg.results);
});

net.on(S.RETURN_TO_LOBBY, () => {
  gameActive = false;
  showScreen('lobby');
  roomInfo.style.display = 'block';
});

// --- Game loop ---
let lastTime = 0;
let accumulator = 0;
const TICK_MS = 1000 / 60;
let prevX = 0, prevY = 0;

function gameLoop(time) {
  if (!gameActive) return;

  const dt = lastTime ? time - lastTime : 0;
  lastTime = time;
  accumulator = Math.min(accumulator + dt, TICK_MS * 4);

  while (accumulator >= TICK_MS) {
    accumulator -= TICK_MS;
    const inp = input.getState();

    if (!practiceMode && (inp.left !== lastInput.left || inp.right !== lastInput.right || inp.jump !== lastInput.jump || inp.dash !== lastInput.dash)) {
      net.send({ type: C.INPUT, keys: inp });
      lastInput = { ...inp };
    }

    if (localPlayer && currentMap) {
      prevX = localPlayer.x;
      prevY = localPlayer.y;

      // Practice mode: update crumble timers locally
      if (practiceMode) {
        for (const plat of currentMap.platforms) {
          if (plat.type !== 'crumble') continue;
          if (plat.timer > 0) {
            plat.timer--;
            plat.gone = plat.timer > 0 && plat.timer <= CRUMBLE_GONE_TIME;
          }
        }
      }

      if (!localPlayer.frozen) {
        predictLocal(localPlayer, inp, currentMap.platforms);

        // Practice mode: check crumble trigger
        if (practiceMode) {
          for (const plat of currentMap.platforms) {
            if (plat.type !== 'crumble' || plat.timer > 0) continue;
            if (localPlayer.onGround &&
                localPlayer.x + PLAYER_WIDTH > plat.x && localPlayer.x < plat.x + plat.w &&
                Math.abs((localPlayer.y + PLAYER_HEIGHT) - plat.y) < 3) {
              plat.timer = CRUMBLE_DELAY + CRUMBLE_GONE_TIME;
            }
          }
        }
      }
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// --- Client prediction (matches server physics) ---

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

function isPlatGone(plat, platIndex) {
  if (plat.gone) return true; // practice mode
  if (plat.type === 'crumble' && crumbleState.has(platIndex)) {
    const timer = crumbleState.get(platIndex);
    return timer > 0 && timer <= CRUMBLE_GONE_TIME;
  }
  return false;
}

function predictLocal(p, inp, platforms) {
  const speed = MOVE_SPEED * (p.isIt ? IT_SPEED_BOOST : 1);

  // Dash charge
  if (p.dashTicks <= 0) {
    p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE);
  }

  // Trigger dash
  if (inp.dash && !p.dashHeld && p.dashCharge >= 1 && p.dashTicks <= 0) {
    p.dashTicks = DASH_DURATION;
    p.dashCharge = 0;
  }
  p.dashHeld = inp.dash;

  // Movement
  if (p.dashTicks > 0) {
    p.dashTicks--;
    p.vx = p.facingRight ? DASH_SPEED : -DASH_SPEED;
  } else {
    let targetVx = 0;
    if (inp.left) { targetVx = -speed; p.facingRight = false; }
    if (inp.right) { targetVx = speed; p.facingRight = true; }

    if (targetVx !== 0) {
      p.vx += (targetVx - p.vx) * MOVE_ACCEL;
    } else {
      p.vx *= MOVE_FRICTION;
      if (Math.abs(p.vx) < 0.3) p.vx = 0;
    }
  }

  // Wall detection
  const touchingWallLeft = isTouchingWall(p, platforms, -2);
  const touchingWallRight = isTouchingWall(p, platforms, 2);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

  // Jump / Double Jump / Wall Jump
  if (inp.jump && !p.jumpHeld) {
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
  p.jumpHeld = inp.jump;

  // Gravity + wall slide
  p.vy += GRAVITY;
  if (onWall && p.vy > 0 && p.dashTicks <= 0) p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
  if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

  // Move X (skip passthrough and gone platforms)
  p.x += p.vx;
  for (let i = 0; i < platforms.length; i++) {
    const plat = platforms[i];
    if (isPlatGone(plat, i)) continue;
    if (PASSTHROUGH_TYPES.has(plat.type)) continue;
    if (overlaps(p, plat)) {
      if (p.vx > 0) p.x = plat.x - PLAYER_WIDTH;
      else if (p.vx < 0) p.x = plat.x + plat.w;
      p.vx = 0;
    }
  }

  // Move Y (substep)
  const steps = Math.max(1, Math.ceil(Math.abs(p.vy) / 8));
  const stepVy = p.vy / steps;
  p.onGround = false;
  for (let i = 0; i < steps; i++) {
    p.y += stepVy;
    for (let j = 0; j < platforms.length; j++) {
      const plat = platforms[j];
      if (isPlatGone(plat, j)) continue;
      if (overlaps(p, plat)) {
        if (stepVy > 0) {
          // Falling — passthrough check
          if (PASSTHROUGH_TYPES.has(plat.type)) {
            const prevBottom = (p.y - stepVy) + PLAYER_HEIGHT;
            if (prevBottom > plat.y + 2) continue;
          }
          p.y = plat.y - PLAYER_HEIGHT;
          if (plat.type === 'trampoline') {
            p.vy = TRAMPOLINE_FORCE;
            p.hasDoubleJump = true;
            return;
          }
          if (plat.type === 'dash_block') {
            p.dashCharge = 1;
          }
          p.onGround = true;
        } else {
          if (PASSTHROUGH_TYPES.has(plat.type)) continue;
          p.y = plat.y + plat.h;
        }
        p.vy = 0;
        if (p.onGround) p.hasDoubleJump = true;
        return;
      }
    }
  }

  // Clamp to map top
  if (p.y < 0) { p.y = 0; p.vy = 0; }
}

function overlaps(p, plat) {
  return (
    p.x < plat.x + plat.w &&
    p.x + PLAYER_WIDTH > plat.x &&
    p.y < plat.y + plat.h &&
    p.y + PLAYER_HEIGHT > plat.y
  );
}

// --- Render ---

function render() {
  if (!currentMap) return;

  const alpha = accumulator / TICK_MS;

  let renderX = 0, renderY = 0;
  if (localPlayer) {
    renderX = prevX + (localPlayer.x - prevX) * alpha;
    renderY = prevY + (localPlayer.y - prevY) * alpha;
  }

  renderer.clear(currentMap.bg);
  renderer.drawBackground(currentMap, camera);
  renderer.drawDecor(currentMap, camera);
  renderer.applyCamera(camera);

  // Annotate crumble platforms with timer for rendering
  if (!practiceMode && currentMap.platforms) {
    for (let i = 0; i < currentMap.platforms.length; i++) {
      const plat = currentMap.platforms[i];
      if (plat.type === 'crumble') {
        plat.timer = crumbleState.get(i) || 0;
        plat.gone = plat.timer > 0 && plat.timer <= CRUMBLE_GONE_TIME;
      }
    }
  }

  renderer.drawPlatforms(currentMap.platforms, currentMap.theme);

  if (practiceMode) {
    if (localPlayer) {
      renderer.drawPlayer(renderX, renderY, selectedColor,
        lobbyPlayers[0]?.name || 'You', localPlayer.facingRight, false, false,
        localPlayer.dashCharge, localPlayer.dashTicks > 0);
    }
  } else {
    const interpPlayers = interp.getInterpolatedPlayers(myId);

    for (const sp of interpPlayers) {
      const info = lobbyPlayers.find(p => p.id === sp.id);
      const name = info ? info.name : 'Player';
      const color = info ? info.color : '#fff';

      if (sp.id === myId && localPlayer) {
        renderer.drawPlayer(renderX, renderY, color, name,
          localPlayer.facingRight, localPlayer.isIt, localPlayer.frozen,
          localPlayer.dashCharge, localPlayer.dashTicks > 0);
      } else {
        renderer.drawPlayer(sp.x, sp.y, color, name,
          sp.facingRight, sp.isIt, sp.frozen,
          sp.dashCharge, sp.dashing);
      }
    }

    if (interpPlayers.length === 0 && localPlayer) {
      const info = lobbyPlayers.find(p => p.id === myId);
      renderer.drawPlayer(renderX, renderY,
        info ? info.color : PLAYER_COLORS[0], info ? info.name : 'You',
        localPlayer.facingRight, localPlayer.isIt, localPlayer.frozen,
        localPlayer.dashCharge, localPlayer.dashTicks > 0);
    }
  }

  // Effects
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age++;
    if (e.age > e.maxAge) { effects.splice(i, 1); continue; }
    const progress = e.age / e.maxAge;
    const alpha = 1 - progress;
    const rise = progress * 35;
    const scale = 1 + progress * 0.4;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const pt of e.particles) {
      ctx.fillStyle = e.color;
      const px = e.x + pt.dx * e.age * 0.4;
      const py = e.y - rise + pt.dy * e.age * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = `bold ${Math.round(16 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(e.text, e.x, e.y - rise - 10);
    ctx.fillStyle = e.color;
    ctx.fillText(e.text, e.x, e.y - rise - 10);
    ctx.restore();
  }

  renderer.resetCamera();

  if (localPlayer) {
    camera.follow(renderX + PLAYER_WIDTH / 2, renderY + PLAYER_HEIGHT / 2,
      currentMap.width, currentMap.height);
  }

  // HUD
  if (practiceMode) {
    renderer.drawHUD('practice', null, false, 1);
  } else {
    renderer.drawHUD(currentMode, getTimeLeft(),
      localPlayer ? localPlayer.isIt : false,
      lobbyPlayers.length);
  }

  // Instructions overlay
  if (showInstructions) {
    renderer.drawInstructions();
  }

  // In-game buttons visibility
  btnQuit.style.display = 'block';
  btnEndGame.style.display = (!practiceMode && isHost) ? 'block' : 'none';
}

function getTimeLeft() {
  const latest = interp.buffer[interp.buffer.length - 1];
  return latest ? (latest.timeLeft ?? null) : null;
}

// --- UI helpers ---

function showScreen(screen) {
  lobby.style.display = screen === 'lobby' ? 'block' : 'none';
  canvas.style.display = screen === 'game' ? 'block' : 'none';
  gameOverEl.style.display = screen === 'gameover' ? 'block' : 'none';
  btnQuit.style.display = 'none';
  btnEndGame.style.display = 'none';
}

function updateLobbyUI() {
  playerListEl.innerHTML = '';
  for (const p of lobbyPlayers) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="player-dot" style="background:${p.color}"></span>${p.name}${p.id === myId ? ' (you)' : ''}`;
    playerListEl.appendChild(li);
  }
  hostControls.style.display = isHost ? 'block' : 'none';
}

function showGameOver(results) {
  showScreen('gameover');
  resultsListEl.innerHTML = '';
  if (!results || results.length === 0) {
    resultsListEl.innerHTML = '<li>Game ended early</li>';
  } else {
    for (const r of results) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="player-dot" style="background:${r.color}"></span><strong>#${r.rank}</strong> ${r.name} — ${r.stat}`;
      resultsListEl.appendChild(li);
    }
  }
  btnBackLobby.style.display = isHost ? 'block' : 'none';
}

function resetToMenu() {
  myId = null;
  isHost = false;
  lobbyPlayers = [];
  localPlayer = null;
  currentMap = null;
  crumbleState = new Map();
  showScreen('lobby');
  roomInfo.style.display = 'none';
  btnCreate.style.display = '';
  btnJoin.style.display = '';
  codeInput.style.display = '';
  nameInput.style.display = '';
  colorPickerEl.style.display = '';
  document.querySelector('.divider').style.display = '';
}

// --- Boot ---
btnCreate.disabled = true;
btnJoin.disabled = true;
btnCreate.textContent = 'Connecting...';
net.connect();
