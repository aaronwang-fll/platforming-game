import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, CRUMBLE_GONE_TIME, SPEED_PAD_MULTIPLIER } from '/shared/constants.js';

const S = PLAYER_WIDTH;
const HALF = S / 2;

// Platform colors
const COL_NORMAL = '#3B2F2F';
const COL_TRAMPOLINE = '#27AE60';
const COL_SPEED = '#E67E22';
const COL_CRUMBLE = '#C8A96E';
const COL_JUMPTHROUGH = '#E056A0';
const COL_ONEWAY = '#8E44AD';

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

  resetCamera() { this.ctx.restore(); }

  drawBackground(map, camera) {
    const ctx = this.ctx;
    const t = map.theme || 'sky';
    const themes = {
      sky:      ['#4A90D9', '#6BB3F0', '#89CFF0'],
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
  }

  drawDecor(map, camera) {
    const ctx = this.ctx;
    const t = map.theme || 'sky';
    const col = (t === 'rooftops') ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)';
    ctx.fillStyle = col;
    for (let i = 0; i < 10; i++) {
      const px = ((i * 211 + 50) % (CANVAS_WIDTH + 100)) - camera.x * (0.02 + i * 0.005);
      const py = ((i * 137 + 30) % CANVAS_HEIGHT) + Math.sin(Date.now() * 0.0004 + i) * 6;
      ctx.beginPath();
      ctx.arc(px, py, 3 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ========================
  // PLATFORMS — just colors + subtle texture
  // ========================

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;

    for (const p of platforms) {

      // --- Trampoline ---
      if (p.type === 'trampoline') {
        ctx.fillStyle = COL_TRAMPOLINE;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Subtle dots
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let dx = p.x + 6; dx < p.x + p.w; dx += 10) {
          ctx.fillRect(dx, p.y + 4, 3, 3);
        }
        continue;
      }

      // --- Speed Pad ---
      if (p.type === 'dash_block') {
        ctx.fillStyle = COL_SPEED;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Subtle dots texture
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (let dy = p.y + 5; dy < p.y + p.h - 2; dy += 8) {
          for (let dx = p.x + 6; dx < p.x + p.w; dx += 12) {
            ctx.fillRect(dx, dy, 3, 3);
          }
        }
        // Lighter top edge
        ctx.fillStyle = '#F0A04B';
        ctx.fillRect(p.x, p.y, p.w, 2);
        continue;
      }

      // --- Crumble ---
      if (p.type === 'crumble') {
        const timer = p.timer || 0;
        const isGone = timer > 0 && timer <= CRUMBLE_GONE_TIME;
        const isShaking = timer > CRUMBLE_GONE_TIME;

        if (isGone) {
          ctx.strokeStyle = 'rgba(200,169,110,0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.setLineDash([]);
          continue;
        }

        const sx = isShaking ? (Math.random() - 0.5) * 3 : 0;
        const sy = isShaking ? (Math.random() - 0.5) * 2 : 0;
        ctx.globalAlpha = isShaking ? 0.6 : 1;

        ctx.fillStyle = COL_CRUMBLE;
        ctx.fillRect(p.x + sx, p.y + sy, p.w, p.h);
        // Diagonal line texture
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let lx = p.x + sx + 8; lx < p.x + sx + p.w; lx += 16) {
          ctx.beginPath();
          ctx.moveTo(lx, p.y + sy);
          ctx.lineTo(lx - 8, p.y + sy + p.h);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        continue;
      }

      // --- Jump-Through ---
      if (p.type === 'jumpthrough') {
        ctx.fillStyle = COL_JUMPTHROUGH;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = 1;
        // Solid top line
        ctx.fillStyle = COL_JUMPTHROUGH;
        ctx.fillRect(p.x, p.y, p.w, 3);
        // Small dots
        ctx.fillStyle = 'rgba(224,86,160,0.2)';
        for (let dy = p.y + 8; dy < p.y + p.h - 2; dy += 8) {
          for (let dx = p.x + 6; dx < p.x + p.w; dx += 10) {
            ctx.fillRect(dx, dy, 3, 3);
          }
        }
        continue;
      }

      // --- One-Way ---
      if (p.type === 'oneway') {
        ctx.fillStyle = COL_ONEWAY;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = 1;
        // Solid top line
        ctx.fillStyle = COL_ONEWAY;
        ctx.fillRect(p.x, p.y, p.w, 3);
        // Small dots
        ctx.fillStyle = 'rgba(142,68,173,0.2)';
        for (let dy = p.y + 8; dy < p.y + p.h - 2; dy += 8) {
          for (let dx = p.x + 6; dx < p.x + p.w; dx += 10) {
            ctx.fillRect(dx, dy, 3, 3);
          }
        }
        continue;
      }

      // --- Normal Platform ---
      ctx.fillStyle = COL_NORMAL;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Brick-like grid texture
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let lx = p.x + 16; lx < p.x + p.w; lx += 16) {
        ctx.beginPath(); ctx.moveTo(lx, p.y); ctx.lineTo(lx, p.y + p.h); ctx.stroke();
      }
      if (p.h > 20) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 16); ctx.lineTo(p.x + p.w, p.y + 16); ctx.stroke();
      }
      // Top edge
      ctx.fillStyle = '#4D3D3D';
      ctx.fillRect(p.x, p.y, p.w, 2);
    }
  }

  // ========================
  // PLAYER — squash/stretch
  // ========================

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen, dashCharge, dashing, vy) {
    const ctx = this.ctx;
    const bodyColor = isFrozen ? '#A8D8EA' : color;

    let scaleX = 1, scaleY = 1;
    if (vy !== undefined && !isFrozen) {
      if (vy < -4) {
        const t = Math.min(1, (-vy - 4) / 7);
        scaleX = 1 + t * 0.15;
        scaleY = 1 - t * 0.15;
      } else if (vy > 3) {
        const t = Math.min(1, (vy - 3) / 5);
        scaleX = 1 - t * 0.1;
        scaleY = 1 + t * 0.15;
      }
    }
    if (dashing) { scaleX = 1.18; scaleY = 0.82; }

    const drawW = Math.round(S * scaleX);
    const drawH = Math.round(S * scaleY);
    const px = Math.round(x) + Math.round((S - drawW) / 2);
    const py = Math.round(y) + (S - drawH);
    const cx = px + drawW / 2;

    if (isIt) {
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 2, py - 2, drawW + 4, drawH + 4);
      ctx.shadowBlur = 0;
    }

    if (isFrozen) ctx.globalAlpha = 0.6;

    if (dashing) {
      ctx.globalAlpha = 0.1;
      const dir = facingRight ? -1 : 1;
      for (let t = 1; t <= 3; t++) {
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px + dir * t * 9, py + t * 2, drawW - t * 3, drawH - t * 2);
      }
      ctx.globalAlpha = isFrozen ? 0.6 : 1;
    }

    ctx.fillStyle = bodyColor;
    ctx.fillRect(px, py, drawW, drawH);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px, py, drawW, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px, py + drawH - 3, drawW, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, drawW, drawH);

    ctx.globalAlpha = 1;

    if (isIt) {
      const arrowX = cx;
      const bob = Math.sin(Date.now() * 0.004) * 3;
      const arrowY = py - 11 + bob;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 5);
      ctx.lineTo(arrowX - 4, arrowY);
      ctx.lineTo(arrowX + 4, arrowY);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(arrowX - 1.5, arrowY - 4, 3, 5);
    }

    if (isFrozen) {
      ctx.strokeStyle = 'rgba(168,216,234,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px - 2, py - 2, drawW + 4, drawH + 4);
      ctx.setLineDash([]);
    }

    // Dash bar
    const barW = S + 2, barH = 3;
    const barX = Math.round(x) + HALF - barW / 2;
    const barY = Math.round(y) + S + 4;
    const charge = dashCharge !== undefined ? dashCharge : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(barX, barY, barW, barH);
    if (charge >= 1) {
      ctx.fillStyle = 'rgba(255,215,0,0.8)';
      ctx.fillRect(barX + 1, barY + 1, barW - 2, barH - 2);
    } else if (charge > 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(barX + 1, barY + 1, (barW - 2) * charge, barH - 2);
    }

    // Name
    const nameText = name || 'Player';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const nameW = ctx.measureText(nameText).width + 10;
    const nameY = py - (isIt ? 19 : 4);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(cx - nameW / 2, nameY - 9, nameW, 14);
    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, cx, nameY);
    ctx.textAlign = 'left';
  }

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 6, CANVAS_WIDTH - 16, 26);

    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#FF6B6B' : '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 24);
    }
    if (mode) {
      const labels = { classic: 'CLASSIC', freeze: 'FREEZE', infection: 'INFECTION', practice: 'PRACTICE' };
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[mode] || mode.toUpperCase(), 20, 23);
    }
    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${playerCount} players`, CANVAS_WIDTH - 20, 23);
    }
    if (isIt) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 70, 40, 140, 24);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 57);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  drawInstructions() {
    const ctx = this.ctx;
    const w = 420, h = 420;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = 'rgba(20,20,40,0.95)';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', CANVAS_WIDTH / 2, y + 32);

    ctx.textAlign = 'left';
    const controls = [
      ['Arrow Keys / WASD', 'Move'],
      ['Space / W / Up', 'Jump'],
      ['Jump in air', 'Double Jump'],
      ['Jump on wall', 'Wall Jump'],
      ['Shift', 'Dash'],
    ];
    let ly = y + 56;
    for (const [k, d] of controls) {
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText(k, x + 20, ly);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '12px sans-serif';
      ctx.fillText(d, x + 200, ly);
      ly += 22;
    }

    ly += 8;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('BLOCKS', x + 20, ly);
    ly += 18;
    const blocks = [
      [COL_NORMAL, 'Platform', 'Solid ground'],
      [COL_TRAMPOLINE, 'Trampoline', 'Bounces you high'],
      [COL_SPEED, 'Speed Pad', '2x speed + dash refill'],
      [COL_CRUMBLE, 'Crumble', 'Breaks when stepped on'],
      [COL_JUMPTHROUGH, 'Jump-Through', 'Pass up through it'],
      [COL_ONEWAY, 'One-Way', 'Land on top only'],
    ];
    for (const [c, n, d] of blocks) {
      ctx.fillStyle = c;
      ctx.fillRect(x + 20, ly - 7, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText(n, x + 40, ly);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px sans-serif';
      ctx.fillText(d, x + 200, ly);
      ly += 18;
    }

    ly += 12;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press H or click to close', CANVAS_WIDTH / 2, ly);
    ctx.textAlign = 'left';
  }
}
