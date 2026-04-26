import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const S = PLAYER_WIDTH; // cube size alias

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Cache for star positions (generated per-map)
    this._starCache = null;
    this._starMapId = null;
  }

  resize() {
    const ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  clear(bg) {
    this.ctx.fillStyle = bg || '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  applyCamera(camera) {
    this.ctx.save();
    this.ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  }

  resetCamera() {
    this.ctx.restore();
  }

  // --- Themed background and decorations ---

  drawBackground(map, camera) {
    const ctx = this.ctx;
    const theme = map.theme || 'night';

    if (theme === 'night' || theme === 'rooftops') {
      // Gradient sky
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#0a0a2e');
      grad.addColorStop(0.6, '#16213e');
      grad.addColorStop(1, '#1a1a3e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars (parallax)
      this._ensureStars(map);
      ctx.fillStyle = '#fff';
      for (const star of this._starCache) {
        const px = star.x - camera.x * star.depth;
        const py = star.y - camera.y * star.depth;
        const flicker = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 * star.speed + star.phase);
        ctx.globalAlpha = star.brightness * flicker;
        ctx.fillRect(px % CANVAS_WIDTH, py % CANVAS_HEIGHT, star.size, star.size);
      }
      ctx.globalAlpha = 1;

      // Moon
      if (theme === 'rooftops') {
        ctx.fillStyle = '#f5e6c8';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH - 80, 60, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a2e';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH - 70, 55, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#2d1b4e');
      grad.addColorStop(0.3, '#8b3a62');
      grad.addColorStop(0.6, '#d4734e');
      grad.addColorStop(0.85, '#f0a959');
      grad.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sun glow
      ctx.fillStyle = 'rgba(240, 169, 89, 0.3)';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2 - camera.x * 0.1, CANVAS_HEIGHT * 0.55, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2 - camera.x * 0.1, CANVAS_HEIGHT * 0.55, 35, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme === 'factory') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#1a0a0a');
      grad.addColorStop(0.5, '#2a1515');
      grad.addColorStop(1, '#0d0505');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Animated hazard stripes at bottom
      const t = Date.now() * 0.03;
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#f39c12';
      for (let i = -1; i < CANVAS_WIDTH / 40 + 1; i++) {
        const bx = (i * 40 + t) % (CANVAS_WIDTH + 40) - 20;
        ctx.fillRect(bx, CANVAS_HEIGHT - 8, 20, 8);
      }
      ctx.globalAlpha = 1;
    }
  }

  _ensureStars(map) {
    const id = map.name;
    if (this._starMapId === id) return;
    this._starMapId = id;
    // Seeded random-ish based on map name
    let seed = 0;
    for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i);
    const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
    this._starCache = Array.from({ length: 60 }, () => ({
      x: rng() * CANVAS_WIDTH,
      y: rng() * CANVAS_HEIGHT * 0.7,
      size: rng() < 0.2 ? 2 : 1,
      brightness: 0.3 + rng() * 0.7,
      depth: 0.05 + rng() * 0.15,
      speed: 0.5 + rng() * 1.5,
      phase: rng() * Math.PI * 2,
    }));
  }

  drawDecor(map, camera) {
    const ctx = this.ctx;
    const theme = map.theme || 'night';

    if (theme === 'rooftops') {
      // Background buildings (parallax)
      ctx.fillStyle = '#0f1a2e';
      this._drawBuildings(ctx, camera, 0.3, 200, 400, 8);
      ctx.fillStyle = '#132240';
      this._drawBuildings(ctx, camera, 0.5, 150, 300, 10);
    } else if (theme === 'sunset') {
      // Distant trees silhouettes
      ctx.fillStyle = 'rgba(30, 20, 40, 0.6)';
      this._drawTrees(ctx, camera, 0.2, 12);
    } else if (theme === 'factory') {
      // Pipes in background
      ctx.strokeStyle = 'rgba(100, 60, 30, 0.3)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 5; i++) {
        const x = 200 + i * 400 - camera.x * 0.2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
        // connectors
        ctx.beginPath();
        ctx.moveTo(x - 15, 200 + i * 100);
        ctx.lineTo(x + 15, 200 + i * 100);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
  }

  _drawBuildings(ctx, camera, parallax, minH, maxH, count) {
    const baseY = CANVAS_HEIGHT;
    let seed = 42;
    const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

    for (let i = 0; i < count; i++) {
      const w = 60 + rng() * 80;
      const h = minH + rng() * (maxH - minH);
      const x = i * (CANVAS_WIDTH / count) * 1.3 - camera.x * parallax;
      ctx.fillRect(x, baseY - h, w, h);
      // Windows
      const prevFill = ctx.fillStyle;
      ctx.fillStyle = 'rgba(255, 220, 100, 0.15)';
      for (let wy = baseY - h + 15; wy < baseY - 20; wy += 25) {
        for (let wx = x + 8; wx < x + w - 8; wx += 18) {
          if (rng() > 0.4) ctx.fillRect(wx, wy, 8, 10);
        }
      }
      ctx.fillStyle = prevFill;
    }
  }

  _drawTrees(ctx, camera, parallax, count) {
    const baseY = CANVAS_HEIGHT;
    let seed = 99;
    const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

    for (let i = 0; i < count; i++) {
      const x = i * (CANVAS_WIDTH / count) * 1.4 - camera.x * parallax;
      const h = 40 + rng() * 80;
      // Trunk
      ctx.fillRect(x - 3, baseY - h, 6, h * 0.4);
      // Canopy
      ctx.beginPath();
      ctx.arc(x, baseY - h, 15 + rng() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Platform drawing with themed styles ---

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;

    for (const p of platforms) {
      if (theme === 'rooftops') {
        // Concrete look
        ctx.fillStyle = '#2a3a5c';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#3a4a6c';
        ctx.fillRect(p.x, p.y, p.w, 3);
        // Edge detail
        ctx.fillStyle = '#1a2a4c';
        ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
      } else if (theme === 'sunset') {
        // Warm earthy platforms
        ctx.fillStyle = '#4a3228';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#6b4a3a';
        ctx.fillRect(p.x, p.y, p.w, 3);
        // Grass on top of wider platforms
        if (p.w > 60 && p.h < 30) {
          ctx.fillStyle = '#3a6b3a';
          ctx.fillRect(p.x, p.y - 3, p.w, 4);
        }
      } else if (theme === 'factory') {
        // Metal grate look
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(p.x, p.y, p.w, 2);
        // Rivets on walls
        if (p.h > 100) {
          ctx.fillStyle = '#6a5a4a';
          for (let ry = p.y + 20; ry < p.y + p.h - 10; ry += 30) {
            ctx.fillRect(p.x + 3, ry, 4, 4);
            ctx.fillRect(p.x + p.w - 7, ry, 4, 4);
          }
        }
        // Hazard stripes on edges of ground platforms
        if (p.h >= 40) {
          ctx.fillStyle = '#8a6a1a';
          for (let sx = p.x; sx < p.x + p.w; sx += 20) {
            ctx.fillRect(sx, p.y, 10, 3);
          }
        }
      } else {
        // Default night theme
        ctx.fillStyle = '#16213e';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = '#0a1a35';
        ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
      }
    }
  }

  // --- Cube player drawing ---

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen) {
    const ctx = this.ctx;
    const px = Math.round(x);
    const py = Math.round(y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + S / 2, py + S + 2, S / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (cube with slight 3D effect)
    if (isFrozen) {
      ctx.fillStyle = '#88c8e8';
      ctx.globalAlpha = 0.7;
    } else {
      ctx.fillStyle = color;
    }
    // Main face
    ctx.fillRect(px, py, S, S);

    // Highlight edge (top-left lighter)
    ctx.fillStyle = isFrozen ? '#aaddef' : lighten(color, 40);
    ctx.fillRect(px, py, S, 3);
    ctx.fillRect(px, py, 3, S);

    // Shadow edge (bottom-right darker)
    ctx.fillStyle = isFrozen ? '#6aa8c0' : darken(color, 40);
    ctx.fillRect(px, py + S - 3, S, 3);
    ctx.fillRect(px + S - 3, py, 3, S);

    ctx.globalAlpha = 1;

    // Outline
    ctx.strokeStyle = isFrozen ? '#aaddef' : '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, S, S);

    // Eyes (bigger for cube face)
    const eyeY = py + S * 0.3;
    const eyeW = 8;
    const eyeH = 8;
    const eyeGap = 4;
    const eyeBaseX = px + (S - eyeW * 2 - eyeGap) / 2;
    const eyeShift = facingRight ? 2 : -2;

    // White of eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(eyeBaseX + eyeShift, eyeY, eyeW, eyeH);
    ctx.fillRect(eyeBaseX + eyeW + eyeGap + eyeShift, eyeY, eyeW, eyeH);

    // Pupils
    const pupilX = facingRight ? 4 : 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(eyeBaseX + eyeShift + pupilX, eyeY + 3, 4, 4);
    ctx.fillRect(eyeBaseX + eyeW + eyeGap + eyeShift + pupilX, eyeY + 3, 4, 4);

    // Mouth (little smile or worried)
    ctx.fillStyle = isFrozen ? '#6aa8c0' : darken(color, 60);
    if (isIt) {
      // Determined grin
      ctx.fillRect(px + 10, py + S * 0.7, S - 20, 3);
      ctx.fillRect(px + 8, py + S * 0.7 - 2, 3, 3);
      ctx.fillRect(px + S - 11, py + S * 0.7 - 2, 3, 3);
    } else {
      // Small smile
      ctx.fillRect(px + 12, py + S * 0.72, S - 24, 2);
    }

    // "IT" crown
    if (isIt) {
      ctx.fillStyle = '#f1c40f';
      const crownW = S - 4;
      const cx = px + 2;
      const cy = py - 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + crownW * 0.15, cy - 12);
      ctx.lineTo(cx + crownW * 0.3, cy - 4);
      ctx.lineTo(cx + crownW * 0.5, cy - 14);
      ctx.lineTo(cx + crownW * 0.7, cy - 4);
      ctx.lineTo(cx + crownW * 0.85, cy - 12);
      ctx.lineTo(cx + crownW, cy);
      ctx.closePath();
      ctx.fill();
      // Crown outline
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Frozen overlay
    if (isFrozen) {
      ctx.strokeStyle = '#aaddef';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px - 3, py - 3, S + 6, S + 6);
      ctx.setLineDash([]);
      // Ice crystals
      ctx.fillStyle = 'rgba(170, 221, 239, 0.6)';
      ctx.fillRect(px - 2, py + S - 8, 4, 8);
      ctx.fillRect(px + S - 2, py + S - 6, 4, 6);
      ctx.fillRect(px + S / 2 - 1, py + S - 4, 3, 4);
    }

    // Name tag
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    const nameY = py - (isIt ? 18 : 6);
    ctx.strokeText(name || 'Player', px + S / 2, nameY);
    ctx.fillText(name || 'Player', px + S / 2, nameY);
    ctx.textAlign = 'left';
  }

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;

    // Semi-transparent bar at top
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

    // Timer
    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#e74c3c' : '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 28);
    }

    // Mode label
    if (mode) {
      const modeLabels = { classic: 'CLASSIC TAG', freeze: 'FREEZE TAG', infection: 'INFECTION' };
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(modeLabels[mode] || mode.toUpperCase(), 12, 26);
    }

    // Player count
    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Players: ${playerCount}`, CANVAS_WIDTH - 12, 26);
    }

    // "YOU ARE IT" flash (pulsing)
    if (isIt) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.006);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('YOU ARE IT!', CANVAS_WIDTH / 2, 80);
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 80);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }
}

// Color utility helpers
function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount)
  );
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.max(0, r - amount),
    Math.max(0, g - amount),
    Math.max(0, b - amount)
  );
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
