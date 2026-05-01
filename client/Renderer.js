import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const S = PLAYER_WIDTH;
const HALF = S / 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
    this.ctx.fillStyle = bg || '#000';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  applyCamera(camera) {
    this.ctx.save();
    this.ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  }

  resetCamera() {
    this.ctx.restore();
  }

  // ========================
  // BACKGROUND — clean gradient with subtle checkerboard
  // ========================

  drawBackground(map, camera) {
    const ctx = this.ctx;
    const t = map.theme || 'sky';
    const themes = {
      sky:      ['#4A90D9', '#6BB3F0', '#89CFF0'],
      night:    ['#1A1A3E', '#2C3E6B', '#1B2838'],
      rooftops: ['#0D1B2A', '#1A1A3E', '#2C3E6B'],
      sunset:   ['#FF6348', '#FF9A76', '#FECA57'],
      factory:  ['#1A0F0A', '#2C1810', '#4A2C20'],
    };
    const [c1, c2, c3] = themes[t] || themes.sky;

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.5, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid overlay for depth
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 48;
    const offX = (-camera.x * 0.1) % gridSize;
    const offY = (-camera.y * 0.1) % gridSize;
    for (let x = offX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = offY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  drawDecor(map, camera) {
    // Minimal — just subtle floating particles for atmosphere
    const ctx = this.ctx;
    const t = map.theme || 'sky';
    const particleColor = (t === 'night' || t === 'rooftops')
      ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)';

    ctx.fillStyle = particleColor;
    for (let i = 0; i < 12; i++) {
      const px = ((i * 211 + 50) % (CANVAS_WIDTH + 100)) - camera.x * (0.02 + i * 0.005);
      const py = ((i * 137 + 30) % CANVAS_HEIGHT) + Math.sin(Date.now() * 0.0005 + i) * 8;
      const size = 3 + (i % 4) * 2;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ========================
  // PLATFORMS — clean, minimalist grey/white blocks
  // ========================

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;

    for (const p of platforms) {
      if (p.type === 'trampoline') {
        // Trampoline — bright green with bounce indicator
        // Glow
        ctx.shadowColor = '#2ECC71';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#2ECC71';
        roundRect(ctx, p.x, p.y, p.w, p.h, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Top highlight
        ctx.fillStyle = '#58D68D';
        ctx.fillRect(p.x + 1, p.y, p.w - 2, Math.min(3, p.h / 2));

        // Chevrons (bounce indicators)
        ctx.strokeStyle = '#F1C40F';
        ctx.lineWidth = 2;
        const midX = p.x + p.w / 2;
        for (let i = 0; i < 2; i++) {
          const cy = p.y + 3 + i * 4;
          ctx.beginPath();
          ctx.moveTo(midX - 6, cy + 3);
          ctx.lineTo(midX, cy);
          ctx.lineTo(midX + 6, cy + 3);
          ctx.stroke();
        }
        continue;
      }

      // Normal platform — clean grey/white block
      const r = Math.min(4, p.h / 2, p.w / 2);

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      roundRect(ctx, p.x + 1, p.y + 2, p.w, p.h, r);
      ctx.fill();

      // Main body — light grey
      ctx.fillStyle = '#D8DEE4';
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.fill();

      // Top edge highlight — white
      ctx.fillStyle = '#EEF1F5';
      ctx.fillRect(p.x + r, p.y, p.w - r * 2, Math.min(3, p.h * 0.3));

      // Bottom edge — slightly darker
      if (p.h > 8) {
        ctx.fillStyle = '#B8C0CA';
        ctx.fillRect(p.x + r, p.y + p.h - Math.min(2, p.h * 0.2), p.w - r * 2, Math.min(2, p.h * 0.2));
      }

      // Subtle outline
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, p.x, p.y, p.w, p.h, r);
      ctx.stroke();
    }
  }

  // ========================
  // PLAYER — beveled cube/block with clean visuals
  // ========================

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen, dashCharge, dashing) {
    const ctx = this.ctx;
    const px = Math.round(x);
    const py = Math.round(y);
    const cx = px + HALF;
    const cy = py + HALF;
    const bevel = 4;

    const bodyColor = isFrozen ? '#A8D8EA' : color;
    const [cr, cg, cb] = hexRgb(bodyColor);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, py + S + 3, S * 0.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // "IT" glow ring
    if (isIt) {
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      roundRect(ctx, px - 4, py - 4, S + 8, S + 8, bevel + 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (isFrozen) ctx.globalAlpha = 0.6;

    // Dash trail
    if (dashing) {
      ctx.globalAlpha = 0.15;
      const trailDir = facingRight ? -1 : 1;
      for (let t = 1; t <= 3; t++) {
        ctx.fillStyle = bodyColor;
        roundRect(ctx, px + trailDir * t * 12, py + t, S - t * 2, S - t * 2, bevel);
        ctx.fill();
      }
      ctx.globalAlpha = isFrozen ? 0.6 : 1;
    }

    // Main cube body
    ctx.fillStyle = bodyColor;
    roundRect(ctx, px, py, S, S, bevel);
    ctx.fill();

    // Top bevel — lighter
    ctx.fillStyle = `rgba(${Math.min(255,cr+50)},${Math.min(255,cg+50)},${Math.min(255,cb+50)},0.6)`;
    ctx.fillRect(px + bevel, py + 1, S - bevel * 2, bevel);

    // Left bevel — slightly lighter
    ctx.fillStyle = `rgba(${Math.min(255,cr+30)},${Math.min(255,cg+30)},${Math.min(255,cb+30)},0.4)`;
    ctx.fillRect(px + 1, py + bevel, bevel - 1, S - bevel * 2);

    // Bottom bevel — darker
    ctx.fillStyle = `rgba(${Math.max(0,cr-40)},${Math.max(0,cg-40)},${Math.max(0,cb-40)},0.5)`;
    ctx.fillRect(px + bevel, py + S - bevel, S - bevel * 2, bevel - 1);

    // Right bevel — darker
    ctx.fillStyle = `rgba(${Math.max(0,cr-30)},${Math.max(0,cg-30)},${Math.max(0,cb-30)},0.4)`;
    ctx.fillRect(px + S - bevel, py + bevel, bevel - 1, S - bevel * 2);

    // Subtle outline
    ctx.strokeStyle = `rgba(${Math.max(0,cr-50)},${Math.max(0,cg-50)},${Math.max(0,cb-50)},0.5)`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, px, py, S, S, bevel);
    ctx.stroke();

    // Shine spot (top-left)
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, px + 3, py + 3, 8, 8, 3);
    ctx.fill();

    ctx.globalAlpha = 1;

    // "IT" white arrow above head
    if (isIt) {
      const arrowX = cx;
      const bob = Math.sin(Date.now() * 0.005) * 3;
      const arrowY = py - 16 + bob;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 8);
      ctx.lineTo(arrowX - 6, arrowY);
      ctx.lineTo(arrowX + 6, arrowY);
      ctx.closePath();
      ctx.fill();

      // Arrow stem
      ctx.fillRect(arrowX - 2, arrowY - 6, 4, 7);
    }

    // Frozen ice overlay
    if (isFrozen) {
      ctx.strokeStyle = 'rgba(168,216,234,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      roundRect(ctx, px - 2, py - 2, S + 4, S + 4, bevel + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ice crystals
      ctx.fillStyle = 'rgba(200,230,255,0.6)';
      for (let a = 0; a < 3; a++) {
        const angle = a * 2.1 + 0.5;
        const ix = cx + Math.cos(angle) * (HALF + 3);
        const iy = cy + Math.sin(angle) * (HALF + 3);
        ctx.beginPath();
        ctx.moveTo(ix, iy - 4);
        ctx.lineTo(ix + 3, iy + 2);
        ctx.lineTo(ix - 3, iy + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Dash charge bar (below player)
    {
      const barW = S + 6;
      const barH = 4;
      const barX = cx - barW / 2;
      const barY = py + S + 7;
      const charge = dashCharge !== undefined ? dashCharge : 1;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      roundRect(ctx, barX, barY, barW, barH, 2);
      ctx.fill();

      // Fill
      if (charge >= 1) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.006);
        ctx.fillStyle = `rgba(255,215,0,${pulse})`;
        roundRect(ctx, barX + 1, barY + 1, barW - 2, barH - 2, 1);
        ctx.fill();
      } else if (charge > 0) {
        ctx.fillStyle = '#fff';
        roundRect(ctx, barX + 1, barY + 1, (barW - 2) * charge, barH - 2, 1);
        ctx.fill();
      }
    }

    // Name tag
    const nameText = name || 'Player';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const nameW = ctx.measureText(nameText).width + 10;
    const nameY = py - (isIt ? 24 : 8);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, cx - nameW / 2, nameY - 9, nameW, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, cx, nameY);
    ctx.textAlign = 'left';
  }

  // ========================
  // HUD — clean minimal style
  // ========================

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 8, 6, CANVAS_WIDTH - 16, 30, 15);
    ctx.fill();

    // Timer
    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#FF6B6B' : '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 26);
    }

    // Mode label
    if (mode) {
      const labels = { classic: 'CLASSIC', freeze: 'FREEZE', infection: 'INFECTION', practice: 'PRACTICE' };
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[mode] || mode.toUpperCase(), 22, 25);
    }

    // Player count
    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${playerCount} players`, CANVAS_WIDTH - 22, 25);
    }

    // "YOU ARE IT" banner
    if (isIt) {
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.004);
      ctx.globalAlpha = pulse;

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      roundRect(ctx, CANVAS_WIDTH / 2 - 80, 44, 160, 28, 14);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 63);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }

  drawInstructions() {
    const ctx = this.ctx;
    const w = 420, h = 340;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Panel
    ctx.fillStyle = 'rgba(20,20,40,0.95)';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', CANVAS_WIDTH / 2, y + 38);

    // Controls list
    ctx.textAlign = 'left';
    const lines = [
      ['Arrow Keys / WASD', 'Move left & right'],
      ['Space / W / Up', 'Jump'],
      ['Jump again in air', 'Double Jump'],
      ['Jump on wall', 'Wall Jump'],
      ['Shift', 'Dash (when bar is full)'],
    ];
    let ly = y + 70;
    for (const [key, desc] of lines) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(key, x + 30, ly);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '13px sans-serif';
      ctx.fillText(desc, x + 220, ly);
      ly += 28;
    }

    // Trampoline note
    ly += 10;
    ctx.fillStyle = '#2ECC71';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Green platforms', x + 30, ly);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '13px sans-serif';
    ctx.fillText('Trampolines — bounce high!', x + 220, ly);

    // Close hint
    ly += 40;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press H or click to close', CANVAS_WIDTH / 2, ly);

    ctx.textAlign = 'left';
  }
}

// ========================
// Helpers
// ========================

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r < 0) r = 0;
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

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return [128, 128, 128];
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.substring(0,2),16)||0, parseInt(hex.substring(2,4),16)||0, parseInt(hex.substring(4,6),16)||0];
}
