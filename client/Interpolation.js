// Buffers snapshots and interpolates remote player positions

export class Interpolation {
  constructor() {
    this.buffer = []; // { tick, players, timestamp }
    this.renderDelay = 80; // ms behind latest snapshot for smooth interp
  }

  pushSnapshot(snapshot) {
    this.buffer.push({
      tick: snapshot.tick,
      players: snapshot.players,
      timestamp: Date.now(),
    });
    // Keep last 30 snapshots
    if (this.buffer.length > 30) this.buffer.shift();
  }

  getInterpolatedPlayers(localId) {
    if (this.buffer.length < 2) {
      return this.buffer.length === 1 ? this.buffer[0].players : [];
    }

    const renderTime = Date.now() - this.renderDelay;

    // Find the two snapshots surrounding renderTime
    let prev = this.buffer[0];
    let next = this.buffer[1];
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i + 1].timestamp >= renderTime) {
        prev = this.buffer[i];
        next = this.buffer[i + 1];
        break;
      }
      prev = this.buffer[i];
      next = this.buffer[i + 1];
    }

    const range = next.timestamp - prev.timestamp;
    const t = range > 0 ? Math.max(0, Math.min(1, (renderTime - prev.timestamp) / range)) : 0;

    // Interpolate all players
    return next.players.map(np => {
      const pp = prev.players.find(p => p.id === np.id);
      if (!pp) return np;

      // For the local player, use the latest snapshot directly (prediction handles it)
      if (np.id === localId) return np;

      return {
        ...np,
        x: pp.x + (np.x - pp.x) * t,
        y: pp.y + (np.y - pp.y) * t,
      };
    });
  }
}
