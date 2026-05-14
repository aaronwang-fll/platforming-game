import { CANVAS_WIDTH, CANVAS_HEIGHT } from '/shared/constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.smoothing = 0.13;
  }

  follow(targetX, targetY, mapWidth, mapHeight) {
    const goalX = targetX - CANVAS_WIDTH / 2;
    const goalY = targetY - CANVAS_HEIGHT / 2;

    this.x += (goalX - this.x) * this.smoothing;
    this.y += (goalY - this.y) * this.smoothing;

    this.x = Math.max(0, Math.min(this.x, mapWidth - CANVAS_WIDTH));
    // Allow camera to go above the map (show sky), but not below
    this.y = Math.min(this.y, Math.max(0, mapHeight - CANVAS_HEIGHT));
  }
}
