import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const S = PLAYER_WIDTH;
const R = 8; // corner radius for player
const PR = 6; // corner radius for platforms

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Pre-rendered background canvases (for performance)
    this._bgCache = null;
    this._bgMapName = null;
  }

  resize() {
    const ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > ratio) w = h * ratio;
    else h = w / ratio;
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

  // --- Background (cached to offscreen canvas for performance) ---

  drawBackground(map, camera) {
    const ctx = this.ctx;
    const theme = map.theme || 'night';

    // Draw gradient
    if (theme === 'night' || theme === 'rooftops') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#0a0a2e');
      grad.addColorStop(0.6, '#16213e');
      grad.addColorStop(1, '#1a1a3e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this._drawStars(ctx, camera);
      if (theme === 'rooftops') this._drawMoon(ctx);
    } else if (theme === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#2d1b4e');
      grad.addColorStop(0.3, '#8b3a62');
      grad.addColorStop(0.6, '#d4734e');
      grad.addColorStop(0.85, '#f0a959');
      grad.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'factory') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#1a0a0a');
      grad.addColorStop(0.5, '#2a1515');
      grad.addColorStop(1, '#0d0505');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  _drawStars(ctx, camera) {
    // Simple static stars with parallax — no sin() flicker for performance
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 40; i++) {
      // Deterministic positions from index
      const x = ((i * 137 + 50) % CANVAS_WIDTH);
      const y = ((i * 97 + 30) % (CANVAS_HEIGHT * 0.6));
      const px = (x - camera.x * 0.05) % CANVAS_WIDTH;
      const sz = i % 5 === 0 ? 2 : 1;
      ctx.fillRect(px < 0 ? px + CANVAS_WIDTH : px, y, sz, sz);
    }
  }

  _drawMoon(ctx) {
    ctx.fillStyle = '#f5e6c8';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 80, 60, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a2e';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 72, 56, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDecor(map, camera) {
    const ctx = this.ctx;
    const theme = map.theme || 'night';

    if (theme === 'rooftops') {
      ctx.fillStyle = '#0f1a2e';
      this._drawBuildings(ctx, camera, 0.15, 6);
      ctx.fillStyle = '#152240';
      this._drawBuildings(ctx, camera, 0.3, 8);
    } else if (theme === 'sunset') {
      ctx.fillStyle = 'rgba(30, 20, 40, 0.5)';
      this._drawHills(ctx, camera);
    } else if (theme === 'factory') {
      ctx.fillStyle = 'rgba(80, 50, 30, 0.15)';
      this._drawPipes(ctx, camera);
    }
  }

  _drawBuildings(ctx, camera, parallax, count) {
    const base = CANVAS_HEIGHT;
    for (let i = 0; i < count; i++) {
      const w = 50 + (i * 31 % 60);
      const h = 120 + (i * 67 % 200);
      const x = i * (CANVAS_WIDTH / count) * 1.3 - camera.x * parallax;
      roundRect(ctx, x, base - h, w, h, 4);
      ctx.fill();
    }
  }

  _drawHills(ctx, camera) {
    const base = CANVAS_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(-50, base);
    for (let x = -50; x < CANVAS_WIDTH + 100; x += 80) {
      const px = x - camera.x * 0.1;
      ctx.quadraticCurveTo(px + 40, base - 60 - (x * 7 % 40), px + 80, base);
    }
    ctx.closePath();
    ctx.fill();
  }

  _drawPipes(ctx, camera) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = ctx.fillStyle;
    for (let i = 0; i < 4; i++) {
      const x = 250 + i * 450 - camera.x * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  // --- Rounded platforms ---

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;
    const colors = themeColors(theme);

    for (const p of platforms) {
      // Main body
      ctx.fillStyle = colors.plat;
      roundRect(ctx, p.x, p.y, p.w, p.h, PR);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = colors.platTop;
      roundRect(ctx, p.x, p.y, p.w, Math.min(4, p.h), PR);
      ctx.fill();

      // Grass on sunset platforms
      if (theme === 'sunset' && p.w > 60 && p.h < 30) {
        ctx.fillStyle = '#3a6b3a';
        roundRect(ctx, p.x + 2, p.y - 2, p.w - 4, 5, 3);
        ctx.fill();
      }
    }
  }

  // --- Rounded cube player (no face) ---

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen) {
    const ctx = this.ctx;
    const px = Math.round(x);
    const py = Math.round(y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px + S / 2, py + S + 2, S / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyColor = isFrozen ? '#88c8e8' : color;
    if (isFrozen) ctx.globalAlpha = 0.75;

    // Main fill
    ctx.fillStyle = bodyColor;
    roundRect(ctx, px, py, S, S, R);
    ctx.fill();

    // Highlight (top-left)
    ctx.fillStyle = lighten(bodyColor, 35);
    roundRect(ctx, px, py, S, S * 0.35, R);
    ctx.fill();

    // Subtle inner glow
    ctx.fillStyle = darken(bodyColor, 20);
    roundRect(ctx, px + 3, py + S * 0.6, S - 6, S * 0.35, R - 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Outline
    ctx.strokeStyle = isFrozen ? '#aaddef' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, S, S, R);
    ctx.stroke();

    // "IT" crown
    if (isIt) {
      ctx.fillStyle = '#f1c40f';
      const cw = S - 8;
      const cx = px + 4;
      const cy = py - 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cw * 0.15, cy - 10);
      ctx.lineTo(cx + cw * 0.3, cy - 3);
      ctx.lineTo(cx + cw * 0.5, cy - 12);
      ctx.lineTo(cx + cw * 0.7, cy - 3);
      ctx.lineTo(cx + cw * 0.85, cy - 10);
      ctx.lineTo(cx + cw, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Frozen overlay
    if (isFrozen) {
      ctx.strokeStyle = '#aaddef';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      roundRect(ctx, px - 3, py - 3, S + 6, S + 6, R + 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Name tag
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    const nameY = py - (isIt ? 16 : 6);
    ctx.strokeText(name || 'Player', px + S / 2, nameY);
    ctx.fillStyle = '#fff';
    ctx.fillText(name || 'Player', px + S / 2, nameY);
    ctx.textAlign = 'left';
  }

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 4, 4, CANVAS_WIDTH - 8, 34, 8);
    ctx.fill();

    // Timer
    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#e74c3c' : '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 28);
    }

    // Mode label
    if (mode) {
      const labels = { classic: 'CLASSIC TAG', freeze: 'FREEZE TAG', infection: 'INFECTION' };
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(labels[mode] || mode.toUpperCase(), 14, 26);
    }

    // Player count
    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Players: ${playerCount}`, CANVAS_WIDTH - 14, 26);
    }

    // "YOU ARE IT" flash
    if (isIt) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.005);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('YOU ARE IT!', CANVAS_WIDTH / 2, 76);
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 76);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }
}

// --- Helpers ---

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lighten(hex, amt) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}

function darken(hex, amt) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}

function hexRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16)];
}

function themeColors(theme) {
  switch (theme) {
    case 'rooftops': return { plat: '#2a3a5c', platTop: '#3a4a6c' };
    case 'sunset':   return { plat: '#4a3228', platTop: '#6b4a3a' };
    case 'factory':  return { plat: '#3a2a1a', platTop: '#5a4a3a' };
    default:         return { plat: '#16213e', platTop: '#0f3460' };
  }
}
