import { Input } from '/client/Input.js';
import { Renderer } from '/client/Renderer.js';
import { Camera } from '/client/Camera.js';
import { NetClient } from '/client/NetClient.js';
import { Interpolation } from '/client/Interpolation.js';
import {
  GRAVITY, MOVE_SPEED, JUMP_FORCE, MAX_FALL_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_COLORS, IT_SPEED_BOOST,
  WALL_SLIDE_SPEED, WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y,
} from '/shared/constants.js';
import { C, S } from '/shared/protocol.js';

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

// Client-side prediction state
let localPlayer = null;
let lastInput = { left: false, right: false, jump: false };

// Visual effects
const effects = []; // { type, x, y, age, maxAge, ... }

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
  net.send({ type: C.CREATE_ROOM, name: nameInput.value || 'Player', color: selectedColor });
});

btnJoin.addEventListener('click', () => {
  const code = codeInput.value.toUpperCase().trim();
  if (code.length !== 4) return;
  net.send({ type: C.JOIN_ROOM, code, name: nameInput.value || 'Player', color: selectedColor });
});

btnStart.addEventListener('click', () => {
  net.send({ type: C.START_GAME });
});

btnBackLobby.addEventListener('click', () => {
  net.send({ type: 'RETURN_TO_LOBBY' });
});

modeSelect.addEventListener('change', () => {
  net.send({ type: C.SET_MODE, mode: modeSelect.value });
});

mapSelect.addEventListener('change', () => {
  net.send({ type: C.SET_MAP, mapName: mapSelect.value });
});

// --- Network handlers ---
net.on('connected', () => console.log('Connected to server'));
net.on('disconnected', () => {
  gameActive = false;
  showScreen('lobby');
  alert('Disconnected from server');
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

  // Init local prediction
  const myData = msg.players.find(p => p.id === myId);
  if (myData) {
    localPlayer = {
      x: myData.x, y: myData.y,
      vx: 0, vy: 0,
      onGround: false, facingRight: true,
      jumpHeld: false,
      isIt: myData.isIt,
      frozen: myData.frozen,
    };
  }

  // Reset interpolation
  interp.buffer = [];

  showScreen('game');
  requestAnimationFrame(gameLoop);
});

net.on(S.SNAPSHOT, (msg) => {
  interp.pushSnapshot(msg);
  msg._timeLeft = msg.timeLeft;

  // Reconcile local player with server
  if (localPlayer) {
    const serverMe = msg.players.find(p => p.id === myId);
    if (serverMe) {
      const dx = serverMe.x - localPlayer.x;
      const dy = serverMe.y - localPlayer.y;
      // Smooth correction for small diffs, snap for large
      if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
        localPlayer.x = serverMe.x;
        localPlayer.y = serverMe.y;
      } else {
        localPlayer.x += dx * 0.3;
        localPlayer.y += dy * 0.3;
      }
      localPlayer.isIt = serverMe.isIt;
      localPlayer.frozen = serverMe.frozen;
      localPlayer.onGround = localPlayer.onGround; // keep local prediction
    }
  }
});

// Tag/freeze/infect event effects
net.on('tag', (msg) => {
  const target = findPlayerPos(msg.taggedId);
  if (target) spawnEffect('TAG!', target.x, target.y, '#f1c40f');
});
net.on('freeze', (msg) => {
  const target = findPlayerPos(msg.taggedId);
  if (target) spawnEffect('FROZEN!', target.x, target.y, '#88c8e8');
});
net.on('unfreeze', (msg) => {
  const target = findPlayerPos(msg.playerId);
  if (target) spawnEffect('FREE!', target.x, target.y, '#2ecc71');
});
net.on('infect', (msg) => {
  const target = findPlayerPos(msg.taggedId);
  if (target) spawnEffect('INFECTED!', target.x, target.y, '#e74c3c');
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
    age: 0, maxAge: 60,
    particles: Array.from({ length: 8 }, () => ({
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 4 - 2,
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

function gameLoop(time) {
  if (!gameActive) return;

  const dt = lastTime ? time - lastTime : 0;
  lastTime = time;
  accumulator += dt;

  // Fixed-step client prediction
  while (accumulator >= TICK_MS) {
    accumulator -= TICK_MS;

    const inp = input.getState();

    // Send input to server (only when changed)
    if (inp.left !== lastInput.left || inp.right !== lastInput.right || inp.jump !== lastInput.jump) {
      net.send({ type: C.INPUT, keys: inp });
      lastInput = { ...inp };
    }

    // Client-side prediction for local player
    if (localPlayer && currentMap && !localPlayer.frozen) {
      predictLocal(localPlayer, inp, currentMap.platforms);
    }
  }

  // Render
  render();

  requestAnimationFrame(gameLoop);
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

function predictLocal(p, inp, platforms) {
  const speed = MOVE_SPEED * (p.isIt ? IT_SPEED_BOOST : 1);

  p.vx = 0;
  if (inp.left) { p.vx = -speed; p.facingRight = false; }
  if (inp.right) { p.vx = speed; p.facingRight = true; }

  // Wall detection (must match server exactly)
  const touchingWallLeft = isTouchingWall(p, platforms, -1);
  const touchingWallRight = isTouchingWall(p, platforms, 1);
  const onWall = !p.onGround && (touchingWallLeft || touchingWallRight);

  // Jump + wall jump
  if (inp.jump && !p.jumpHeld) {
    if (p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
    } else if (onWall) {
      p.vy = WALL_JUMP_FORCE_Y;
      p.vx = touchingWallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
      p.facingRight = touchingWallLeft;
    }
  }
  p.jumpHeld = inp.jump;

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
      if (p.vy > 0) { p.y = plat.y - PLAYER_HEIGHT; p.onGround = true; }
      else if (p.vy < 0) { p.y = plat.y + plat.h; }
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

function render() {
  if (!currentMap) return;

  renderer.clear(currentMap.bg);
  renderer.drawBackground(currentMap, camera);
  renderer.drawDecor(currentMap, camera);
  renderer.applyCamera(camera);
  renderer.drawPlatforms(currentMap.platforms, currentMap.theme);

  // Get interpolated remote players
  const interpPlayers = interp.getInterpolatedPlayers(myId);
  const playerInfo = lobbyPlayers;

  // Draw all players
  for (const sp of interpPlayers) {
    const info = playerInfo.find(p => p.id === sp.id);
    const name = info ? info.name : 'Player';
    const color = info ? info.color : '#fff';

    if (sp.id === myId && localPlayer) {
      // Draw local player from prediction
      renderer.drawPlayer(
        localPlayer.x, localPlayer.y, color, name,
        localPlayer.facingRight, localPlayer.isIt, localPlayer.frozen
      );
    } else {
      renderer.drawPlayer(
        sp.x, sp.y, color, name,
        sp.facingRight, sp.isIt, sp.frozen
      );
    }
  }

  // If no snapshots yet, still draw local player
  if (interpPlayers.length === 0 && localPlayer) {
    const info = playerInfo.find(p => p.id === myId);
    renderer.drawPlayer(
      localPlayer.x, localPlayer.y,
      info ? info.color : PLAYER_COLORS[0],
      info ? info.name : 'You',
      localPlayer.facingRight, localPlayer.isIt, localPlayer.frozen
    );
  }

  // Draw effects (in world space, before resetCamera)
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age++;
    if (e.age > e.maxAge) { effects.splice(i, 1); continue; }
    const progress = e.age / e.maxAge;
    const alpha = 1 - progress;
    const rise = progress * 40;
    const scale = 1 + progress * 0.5;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Particles
    for (const pt of e.particles) {
      const px = e.x + pt.dx * e.age * 0.5;
      const py = e.y - rise + pt.dy * e.age * 0.5;
      ctx.fillStyle = e.color;
      ctx.fillRect(px - 2, py - 2, 4, 4);
    }
    // Text
    ctx.font = `bold ${Math.round(18 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(e.text, e.x, e.y - rise - 10);
    ctx.fillStyle = e.color;
    ctx.fillText(e.text, e.x, e.y - rise - 10);
    ctx.restore();
  }

  renderer.resetCamera();

  // Camera follow local player
  if (localPlayer) {
    camera.follow(
      localPlayer.x + PLAYER_WIDTH / 2,
      localPlayer.y + PLAYER_HEIGHT / 2,
      currentMap.width, currentMap.height
    );
  }

  // HUD
  const latestSnap = interp.buffer[interp.buffer.length - 1];
  const timeLeft = latestSnap ? latestSnap.players && latestSnap.tick ? (interp.buffer[interp.buffer.length - 1]._timeLeft ?? null) : null : null;
  renderer.drawHUD(
    currentMode,
    getTimeLeft(),
    localPlayer ? localPlayer.isIt : false,
    interpPlayers.length || lobbyPlayers.length
  );
}

function getTimeLeft() {
  const latest = interp.buffer[interp.buffer.length - 1];
  if (!latest) return null;
  // timeLeft is stored in the snapshot from server
  return latest.timeLeft ?? null;
}

// --- Snapshot timeLeft passthrough ---
const origPush = interp.pushSnapshot.bind(interp);
interp.pushSnapshot = function(snapshot) {
  origPush(snapshot);
  // Store timeLeft on the buffer entry
  if (this.buffer.length > 0) {
    this.buffer[this.buffer.length - 1].timeLeft = snapshot.timeLeft;
  }
};

// --- UI helpers ---
function showScreen(screen) {
  lobby.style.display = screen === 'lobby' ? 'block' : 'none';
  canvas.style.display = screen === 'game' ? 'block' : 'none';
  gameOverEl.style.display = screen === 'gameover' ? 'block' : 'none';
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
    return;
  }
  for (const r of results) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="player-dot" style="background:${r.color}"></span><strong>#${r.rank}</strong> ${r.name} — ${r.stat}`;
    resultsListEl.appendChild(li);
  }
  btnBackLobby.style.display = isHost ? 'block' : 'none';
}

// --- Boot ---
net.connect();
