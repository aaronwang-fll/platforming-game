import { TAG_RADIUS, TAG_IMMUNITY_MS, TICK_RATE, CLASSIC_ROUND_TIME } from '../../shared/constants.js';
import { distance } from '../physics.js';

export class ClassicTag {
  constructor() {
    this.name = 'classic';
    this.roundTime = CLASSIC_ROUND_TIME;
    this.immunityTicks = Math.round(TAG_IMMUNITY_MS / 1000 * TICK_RATE);
  }

  onGameStart(players) {
    const arr = [...players.values()];
    for (const p of arr) {
      p.isIt = false;
      p.itTime = 0;
    }
    const it = arr[Math.floor(Math.random() * arr.length)];
    it.isIt = true;
    return { itId: it.id };
  }

  onTick(players, tick) {
    const arr = [...players.values()];
    const events = [];

    // Track it-time
    for (const p of arr) {
      if (p.isIt) p.itTime++;
    }

    // Check tag collisions
    const itPlayers = arr.filter(p => p.isIt);
    const others = arr.filter(p => !p.isIt);

    for (const it of itPlayers) {
      for (const other of others) {
        if (other.immuneUntil > tick) continue;
        if (distance(it, other) < TAG_RADIUS) {
          it.isIt = false;
          other.isIt = true;
          it.immuneUntil = tick + this.immunityTicks;
          events.push({ type: 'tag', taggerId: it.id, taggedId: other.id });
        }
      }
    }

    return events;
  }

  isGameOver(players, elapsed) {
    return elapsed >= this.roundTime;
  }

  getResults(players) {
    const arr = [...players.values()];
    arr.sort((a, b) => a.itTime - b.itTime);
    return arr.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      rank: i + 1,
      stat: `IT for ${(p.itTime / TICK_RATE).toFixed(1)}s`,
    }));
  }
}
