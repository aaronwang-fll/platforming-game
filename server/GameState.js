import {
  TICK_RATE, SNAPSHOT_INTERVAL,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  CRUMBLE_DELAY, CRUMBLE_GONE_TIME,
} from '../shared/constants.js';
import { updatePlayer } from './physics.js';
import { ClassicTag } from './modes/ClassicTag.js';
import { FreezeTag } from './modes/FreezeTag.js';
import { InfectionTag } from './modes/InfectionTag.js';

const MODES = {
  classic: ClassicTag,
  freeze: FreezeTag,
  infection: InfectionTag,
};

export class GameState {
  constructor(players, map, modeName, broadcast) {
    this.players = players; // Map<id, Player>
    this.map = map;
    this.broadcast = broadcast;
    this.tick = 0;
    this.startTime = Date.now();
    this.interval = null;

    // Deep copy platforms so crumble state is per-game
    this.platforms = map.platforms.map(p => ({ ...p }));
    // Init crumble timers
    for (const p of this.platforms) {
      if (p.type === 'crumble') {
        p.timer = 0;
        p.gone = false;
      }
    }

    const ModeClass = MODES[modeName] || ClassicTag;
    this.mode = new ModeClass();

    // Spawn players
    const arr = [...players.values()];
    const spawns = map.spawns;
    arr.forEach((p, i) => {
      const spawn = spawns[i % spawns.length];
      p.spawn(spawn.x, spawn.y);
      p.frozen = false;
      p.alive = true;
      p.isIt = false;
      p.itTime = 0;
      p.immuneUntil = 0;
      p.unfreezeProgress = 0;
    });

    // Init mode
    this.modeStartInfo = this.mode.onGameStart(players);
  }

  start(onGameOver) {
    this.onGameOver = onGameOver;
    this.interval = setInterval(() => this.update(), 1000 / TICK_RATE);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  update() {
    this.tick++;

    // Update crumble timers
    for (const plat of this.platforms) {
      if (plat.type !== 'crumble') continue;
      if (plat.timer > 0) {
        plat.timer--;
        plat.gone = plat.timer > 0 && plat.timer <= CRUMBLE_GONE_TIME;
      }
    }

    // Update physics for all players
    for (const p of this.players.values()) {
      updatePlayer(p, this.platforms);
    }

    // Check for players landing on crumble platforms
    for (const plat of this.platforms) {
      if (plat.type !== 'crumble' || plat.timer > 0) continue;
      for (const p of this.players.values()) {
        if (p.frozen) continue;
        if (p.onGround &&
            p.x + PLAYER_WIDTH > plat.x && p.x < plat.x + plat.w &&
            Math.abs((p.y + PLAYER_HEIGHT) - plat.y) < 3) {
          plat.timer = CRUMBLE_DELAY + CRUMBLE_GONE_TIME;
          break;
        }
      }
    }

    // Run mode logic
    const elapsed = (Date.now() - this.startTime) / 1000;
    const events = this.mode.onTick(this.players, this.tick);

    // Broadcast events
    for (const ev of events) {
      this.broadcast(ev);
    }

    // Broadcast snapshot
    if (this.tick % SNAPSHOT_INTERVAL === 0) {
      // Build crumble state for snapshot
      const crumble = [];
      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.type === 'crumble' && plat.timer > 0) {
          crumble.push({ i, timer: plat.timer });
        }
      }

      const snapshot = {
        type: 'SNAPSHOT',
        tick: this.tick,
        elapsed: Math.round(elapsed * 10) / 10,
        timeLeft: Math.max(0, Math.round((this.mode.roundTime - elapsed) * 10) / 10),
        players: [...this.players.values()].map(p => p.toSnapshot()),
        crumble,
      };
      this.broadcast(snapshot);
    }

    // Check game over
    if (this.mode.isGameOver(this.players, elapsed)) {
      this.stop();
      const results = this.mode.getResults(this.players);
      this.onGameOver(results);
    }
  }
}
