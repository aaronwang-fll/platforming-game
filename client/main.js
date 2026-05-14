import { Input, keyDisplayName } from '/client/Input.js';
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
  CRUMBLE_DELAY, CRUMBLE_GONE_TIME, SPEED_PAD_MULTIPLIER,
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
let crumbleState = new Map();

// Double jump option (practice mode)
let doubleJumpEnabled = localStorage.getItem('tag_doublejump') !== 'false';

// ========================
// SETTINGS PANEL
// ========================

const settingsOverlay = document.getElementById('settings-overlay');
const keybindList = document.getElementById('keybind-list');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnResetKeys = document.getElementById('btn-reset-keys');
const optDoubleJump = document.getElementById('opt-double-jump');

optDoubleJump.checked = doubleJumpEnabled;
optDoubleJump.addEventListener('change', () => {
  doubleJumpEnabled = optDoubleJump.checked;
  localStorage.setItem('tag_doublejump', doubleJumpEnabled);
});

btnSettings.addEventListener('click', () => {
  settingsOverlay.style.display = 'flex';
  renderKeybinds();
});

btnCloseSettings.addEventListener('click', () => {
  settingsOverlay.style.display = 'none';
});

settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) settingsOverlay.style.display = 'none';
});

btnResetKeys.addEventListener('click', () => {
  input.resetBindings();
  renderKeybinds();
});

let listeningAction = null;
let listeningEl = null;

function renderKeybinds() {
  keybindList.innerHTML = '';
  const actions = [
    ['left', 'Move Left'],
    ['right', 'Move Right'],
    ['jump', 'Jump'],
    ['dash', 'Dash'],
  ];
  for (const [action, label] of actions) {
    const row = document.createElement('div');
    row.className = 'keybind-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'keybind-label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    const keysEl = document.createElement('div');
    keysEl.className = 'keybind-keys';

    for (const code of input.bindings[action]) {
      const tag = document.createElement('span');
      tag.className = 'key-tag';
      tag.textContent = keyDisplayName(code);
      tag.title = 'Click to remove';
      tag.addEventListener('click', () => {
        input.removeKey(action, code);
        renderKeybinds();
      });
      keysEl.appendChild(tag);
    }

    const addBtn = document.createElement('span');
    addBtn.className = 'key-add';
    addBtn.textContent = '+';
    addBtn.title = 'Press to add a key';
    addBtn.addEventListener('click', () => {
      if (listeningEl) {
        listeningEl.classList.remove('listening');
        listeningEl.textContent = '+';
      }
      listeningAction = action;
      listeningEl = addBtn;
      addBtn.classList.add('listening');
      addBtn.textContent = '...';
    });
    keysEl.appendChild(addBtn);

    row.appendChild(keysEl);
    keybindList.appendChild(row);
  }
}

window.addEventListener('keydown', (e) => {
  if (listeningAction) {
    e.preventDefault();
    e.stopPropagation();
    if (e.code !== 'Escape') {
      input.addKey(listeningAction, e.code);
    }
    listeningAction = null;
    if (listeningEl) {
      listeningEl.classList.remove('listening');
      listeningEl.textContent = '+';
      listeningEl = null;
    }
    renderKeybinds();
  }
}, true);

// ========================
// ABOUT:BLANK LAUNCHER
// ========================

document.getElementById('btn-newwindow').addEventListener('click', () => {
  const w = window.open('about:blank', '_blank');
  if (!w) { alert('Pop-up blocked! Allow pop-ups for this site.'); return; }
  const doc = w.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>Document</title><style>*{margin:0;padding:0}body{overflow:hidden}iframe{width:100vw;height:100vh;border:none}</style></head><body><iframe src="${window.location.href}"></iframe></body></html>`);
  doc.close();
});

// --- Instructions toggle ---
window.addEventListener('keydown', e => {
  if (e.code === 'KeyH' && gameActive && !listeningAction) {
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

btnQuit.addEventListener('click', () => {
  gameActive = false;
  if (practiceMode) {
    practiceMode = false;
  } else {
    net.send({ type: C.LEAVE });
  }
  resetToMenu();
});

btnEndGame.addEventListener('click', () => {
  net.send({ type: 'END_GAME' });
});

// --- Practice mode ---
let practiceMode = false;

const practiceMap = {
  name: 'Practice',
  width: 2000,
  height: 1200,
  bg: '#7EC8E3',
  theme: 'sky',
  platforms: [
    // Floor
    { x: 0, y: 1168, w: 2000, h: 32 },
    // Ground speed pads
    { x: 40, y: 1136, w: 380, h: 32, type: 'dash_block' },
    { x: 1580, y: 1136, w: 380, h: 32, type: 'dash_block' },

    // L1 (y=1068) — staircase entries + jumpthrough center
    { x: 40, y: 1118, w: 128, h: 32 },
    { x: 40, y: 1068, w: 200, h: 32 },
    { x: 200, y: 1068, w: 400, h: 32 },
    { x: 700, y: 1068, w: 300, h: 32, type: 'jumpthrough' },
    { x: 1100, y: 1068, w: 500, h: 32 },
    { x: 1760, y: 1068, w: 200, h: 32 },
    { x: 1830, y: 1118, w: 128, h: 32 },
    { x: 880, y: 1068, w: 120, h: 32, type: 'crumble', timer: 0, gone: false },

    // L2 (y=968)
    { x: 40, y: 968, w: 300, h: 32 },
    { x: 40, y: 968, w: 32, h: 100 },
    { x: 440, y: 968, w: 250, h: 32 },
    { x: 750, y: 968, w: 280, h: 32, type: 'jumpthrough' },
    { x: 1100, y: 968, w: 250, h: 32 },
    { x: 1500, y: 968, w: 300, h: 32 },
    { x: 1768, y: 968, w: 32, h: 100 },
    { x: 60, y: 936, w: 260, h: 32, type: 'dash_block' },

    // L3 (y=868)
    { x: 80, y: 868, w: 200, h: 32 },
    { x: 380, y: 868, w: 160, h: 32 },
    { x: 640, y: 868, w: 400, h: 32 },
    { x: 640, y: 768, w: 32, h: 100 },
    { x: 1008, y: 768, w: 32, h: 100 },
    { x: 1140, y: 868, w: 160, h: 32 },
    { x: 1500, y: 868, w: 200, h: 32 },
    { x: 340, y: 868, w: 80, h: 32, type: 'oneway' },
    { x: 1360, y: 868, w: 80, h: 32, type: 'oneway' },

    // L4 (y=768)
    { x: 120, y: 768, w: 220, h: 32 },
    { x: 640, y: 768, w: 400, h: 32 },
    { x: 1440, y: 768, w: 220, h: 32 },
    { x: 420, y: 768, w: 120, h: 32, type: 'crumble', timer: 0, gone: false },
    { x: 1140, y: 768, w: 120, h: 32, type: 'crumble', timer: 0, gone: false },

    // L5 (y=668)
    { x: 200, y: 668, w: 200, h: 32 },
    { x: 800, y: 668, w: 200, h: 32 },
    { x: 1400, y: 668, w: 200, h: 32 },
    { x: 500, y: 668, w: 100, h: 32, type: 'oneway' },
    { x: 1200, y: 668, w: 100, h: 32, type: 'oneway' },

    // Trampolines
    { x: 818, y: 1156, w: 64, h: 12, type: 'trampoline' },
    { x: 500, y: 1156, w: 64, h: 12, type: 'trampoline' },
    { x: 1436, y: 1156, w: 64, h: 12, type: 'trampoline' },
    { x: 850, y: 1056, w: 64, h: 12, type: 'trampoline' },
    { x: 870, y: 856, w: 64, h: 12, type: 'trampoline' },
    { x: 250, y: 756, w: 64, h: 12, type: 'trampoline' },

    // Pillars
    { x: 460, y: 968, w: 32, h: 200 },
    { x: 1380, y: 968, w: 32, h: 200 },
    { x: 560, y: 768, w: 32, h: 200 },
    { x: 1080, y: 768, w: 32, h: 200 },

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

  for (const p of currentMap.platforms) {
    if (p.type === 'crumble') { p.timer = 0; p.gone = false; }
  }

  localPlayer = {
    x: 400, y: 1128,
    vx: 0, vy: 0,
    onGround: false, facingRight: true,
    jumpHeld: false, dashHeld: false,
    isIt: false, frozen: false,
    hasDoubleJump: doubleJumpEnabled,
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
  document.querySelector('.lobby-bottom-row').style.display = 'none';
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

  if (msg.crumble) {
    crumbleState = new Map();
    for (const c of msg.crumble) crumbleState.set(c.i, c.timer);
  }

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

// --- Client prediction ---

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
  if (plat.gone) return true;
  if (plat.type === 'crumble' && crumbleState.has(platIndex)) {
    const timer = crumbleState.get(platIndex);
    return timer > 0 && timer <= CRUMBLE_GONE_TIME;
  }
  return false;
}

function predictLocal(p, inp, platforms) {
  // Speed pad check
  let speedMul = 1;
  if (p.onGround) {
    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];
      if (isPlatGone(plat, i)) continue;
      if (plat.type === 'dash_block' &&
          p.x + PLAYER_WIDTH > plat.x && p.x < plat.x + plat.w &&
          Math.abs((p.y + PLAYER_HEIGHT) - plat.y) < 3) {
        speedMul = SPEED_PAD_MULTIPLIER;
        p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE * 4);
        break;
      }
    }
  }
  const speed = MOVE_SPEED * speedMul * (p.isIt ? IT_SPEED_BOOST : 1);

  if (p.dashTicks <= 0) {
    p.dashCharge = Math.min(1, p.dashCharge + DASH_CHARGE_RATE);
  }

  if (inp.dash && !p.dashHeld && p.dashCharge >= 1 && p.dashTicks <= 0) {
    p.dashTicks = DASH_DURATION;
    p.dashCharge = 0;
  }
  p.dashHeld = inp.dash;

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

  const touchingWallLeft = isTouchingWall(p, platforms, -2);
  const touchingWallRight = isTouchingWall(p, platforms, 2);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

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

  p.vy += GRAVITY;
  if (onWall && p.vy > 0 && p.dashTicks <= 0) p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
  if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

  // Move X
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
          if (PASSTHROUGH_TYPES.has(plat.type)) {
            const prevBottom = (p.y - stepVy) + PLAYER_HEIGHT;
            if (prevBottom > plat.y + 2) continue;
          }
          p.y = plat.y - PLAYER_HEIGHT;
          if (plat.type === 'trampoline') {
            p.vy = TRAMPOLINE_FORCE;
            p.hasDoubleJump = practiceMode ? doubleJumpEnabled : true;
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
        if (p.onGround) p.hasDoubleJump = practiceMode ? doubleJumpEnabled : true;
        return;
      }
    }
  }

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

  // Annotate crumble for rendering
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
        localPlayer.dashCharge, localPlayer.dashTicks > 0, localPlayer.vy);
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
          localPlayer.dashCharge, localPlayer.dashTicks > 0, localPlayer.vy);
      } else {
        renderer.drawPlayer(sp.x, sp.y, color, name,
          sp.facingRight, sp.isIt, sp.frozen,
          sp.dashCharge, sp.dashing, sp.vy);
      }
    }

    if (interpPlayers.length === 0 && localPlayer) {
      const info = lobbyPlayers.find(p => p.id === myId);
      renderer.drawPlayer(renderX, renderY,
        info ? info.color : PLAYER_COLORS[0], info ? info.name : 'You',
        localPlayer.facingRight, localPlayer.isIt, localPlayer.frozen,
        localPlayer.dashCharge, localPlayer.dashTicks > 0, localPlayer.vy);
    }
  }

  // Effects
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age++;
    if (e.age > e.maxAge) { effects.splice(i, 1); continue; }
    const progress = e.age / e.maxAge;
    const a = 1 - progress;
    const rise = progress * 35;
    const scale = 1 + progress * 0.4;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.globalAlpha = a;
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

  if (practiceMode) {
    renderer.drawHUD('practice', null, false, 1);
  } else {
    renderer.drawHUD(currentMode, getTimeLeft(),
      localPlayer ? localPlayer.isIt : false,
      lobbyPlayers.length);
  }

  if (showInstructions) renderer.drawInstructions();

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
  document.querySelector('.lobby-bottom-row').style.display = '';
}

// --- Boot ---
btnCreate.disabled = true;
btnJoin.disabled = true;
btnCreate.textContent = 'Connecting...';
net.connect();
