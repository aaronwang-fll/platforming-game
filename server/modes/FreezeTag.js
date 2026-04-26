import { TAG_RADIUS, TAG_IMMUNITY_MS, TICK_RATE, FREEZE_ROUND_TIME, UNFREEZE_TIME } from '../../shared/constants.js';
import { distance } from '../physics.js';

export class FreezeTag {
  constructor() {
    this.name = 'freeze';
    this.roundTime = FREEZE_ROUND_TIME;
    this.immunityTicks = Math.round(TAG_IMMUNITY_MS / 1000 * TICK_RATE);
    this.unfreezeTicks = Math.round(UNFREEZE_TIME * TICK_RATE);
  }

  onGameStart(players) {
    const arr = [...players.values()];
    for (const p of arr) {
      p.isIt = false;
      p.frozen = false;
      p.unfreezeProgress = 0;
    }
    const it = arr[Math.floor(Math.random() * arr.length)];
    it.isIt = true;
    return { itId: it.id };
  }

  onTick(players, tick) {
    const arr = [...players.values()];
    const events = [];
    const it = arr.find(p => p.isIt);
    if (!it) return events;

    const others = arr.filter(p => !p.isIt);

    // Freezer tags unfrozen players
    for (const other of others) {
      if (other.frozen) continue;
      if (other.immuneUntil > tick) continue;
      if (distance(it, other) < TAG_RADIUS) {
        other.frozen = true;
        other.unfreezeProgress = 0;
        events.push({ type: 'freeze', taggedId: other.id });
      }
    }

    // Unfrozen players can unfreeze frozen ones by standing near
    const unfrozen = others.filter(p => !p.frozen);
    const frozen = others.filter(p => p.frozen);

    for (const fp of frozen) {
      let nearbyHelper = false;
      for (const uf of unfrozen) {
        if (distance(uf, fp) < TAG_RADIUS) {
          nearbyHelper = true;
          break;
        }
      }
      if (nearbyHelper) {
        fp.unfreezeProgress += 1 / this.unfreezeTicks;
        if (fp.unfreezeProgress >= 1) {
          fp.frozen = false;
          fp.unfreezeProgress = 0;
          fp.immuneUntil = tick + this.immunityTicks;
          events.push({ type: 'unfreeze', playerId: fp.id });
        }
      } else {
        fp.unfreezeProgress = Math.max(0, fp.unfreezeProgress - 0.5 / this.unfreezeTicks);
      }
    }

    return events;
  }

  isGameOver(players, elapsed) {
    if (elapsed >= this.roundTime) return true;
    const arr = [...players.values()];
    const others = arr.filter(p => !p.isIt);
    return others.length > 0 && others.every(p => p.frozen);
  }

  getResults(players) {
    const arr = [...players.values()];
    const others = arr.filter(p => !p.isIt);
    const allFrozen = others.every(p => p.frozen);
    const it = arr.find(p => p.isIt);

    const results = [];
    if (allFrozen) {
      results.push({ id: it.id, name: it.name, color: it.color, rank: 1, stat: 'Froze everyone!' });
      others.forEach((p, i) => results.push({ id: p.id, name: p.name, color: p.color, rank: i + 2, stat: 'Frozen' }));
    } else {
      const survivors = others.filter(p => !p.frozen);
      survivors.forEach((p, i) => results.push({ id: p.id, name: p.name, color: p.color, rank: i + 1, stat: 'Survived!' }));
      results.push({ id: it.id, name: it.name, color: it.color, rank: survivors.length + 1, stat: 'Time ran out' });
      const frozenOnes = others.filter(p => p.frozen);
      frozenOnes.forEach((p, i) => results.push({ id: p.id, name: p.name, color: p.color, rank: survivors.length + 2 + i, stat: 'Frozen' }));
    }
    return results;
  }
}
