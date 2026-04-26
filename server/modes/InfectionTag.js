import { TAG_RADIUS, TAG_IMMUNITY_MS, TICK_RATE, INFECTION_ROUND_TIME } from '../../shared/constants.js';
import { distance } from '../physics.js';

export class InfectionTag {
  constructor() {
    this.name = 'infection';
    this.roundTime = INFECTION_ROUND_TIME;
    this.immunityTicks = Math.round(TAG_IMMUNITY_MS / 1000 * TICK_RATE);
  }

  onGameStart(players) {
    const arr = [...players.values()];
    for (const p of arr) {
      p.isIt = false;
      p.alive = true;
    }
    const it = arr[Math.floor(Math.random() * arr.length)];
    it.isIt = true;
    return { itId: it.id };
  }

  onTick(players, tick) {
    const arr = [...players.values()];
    const events = [];
    const infected = arr.filter(p => p.isIt);
    const survivors = arr.filter(p => !p.isIt && p.alive);

    for (const inf of infected) {
      for (const surv of survivors) {
        if (surv.immuneUntil > tick) continue;
        if (distance(inf, surv) < TAG_RADIUS) {
          surv.isIt = true;
          events.push({ type: 'infect', taggerId: inf.id, taggedId: surv.id });
        }
      }
    }

    return events;
  }

  isGameOver(players, elapsed) {
    if (elapsed >= this.roundTime) return true;
    const arr = [...players.values()];
    const survivors = arr.filter(p => !p.isIt);
    return survivors.length <= 0;
  }

  getResults(players) {
    const arr = [...players.values()];
    const survivors = arr.filter(p => !p.isIt);
    const infected = arr.filter(p => p.isIt);

    const results = [];
    survivors.forEach((p, i) => results.push({
      id: p.id, name: p.name, color: p.color, rank: i + 1, stat: 'Survived!',
    }));
    infected.forEach((p, i) => results.push({
      id: p.id, name: p.name, color: p.color, rank: survivors.length + i + 1, stat: 'Infected',
    }));
    return results;
  }
}
