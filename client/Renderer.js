import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, CRUMBLE_DELAY, CRUMBLE_GONE_TIME } from '/shared/constants.js';

const S = PLAYER_WIDTH;
const HALF = S / 2;

// Vibrant flat platform colors
const PLAT_COLOR = '#3B2F2F';
const PLAT_TOP = '#4D3D3D';
const PLAT_TRAMPOLINE = '#27AE60';
const PLAT_TRAMPOLINE_TOP = '#2ECC71';
const PLAT_DASH = '#E67E22';
const PLAT_DASH_STRIPE = '#F39C12';
const PLAT_CRUMBLE = '#C8A96E';
const PLAT_JUMPTHROUGH = '#E056A0';
const PLAT_ONEWAY = '#8E44AD';

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
  // BACKGROUND
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

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 48;
    const offX = (-camera.x * 0.1) % gridSize;
    const offY = (-camera.y * 0.1) % gridSize;
    for (let x = offX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = offY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
  }

  drawDecor(map, camera) {
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
  // PLATFORMS — flat colors, sharp edges, obvious differences
  // ========================

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;
    const now = Date.now();

    for (const p of platforms) {
      // --- Trampoline ---
      if (p.type === 'trampoline') {
        ctx.fillStyle = PLAT_TRAMPOLINE;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Bright bouncy top
        ctx.fillStyle = PLAT_TRAMPOLINE_TOP;
        ctx.fillRect(p.x, p.y, p.w, 4);
        // Animated bounce indicator (chevrons pulsing)
        const bounce = Math.sin(now * 0.004) * 2;
        ctx.fillStyle = '#F1C40F';
        const mx = p.x + p.w / 2;
        ctx.beginPath();
        ctx.moveTo(mx - 8, p.y + 8 + bounce);
        ctx.lineTo(mx, p.y + 3 + bounce);
        ctx.lineTo(mx + 8, p.y + 8 + bounce);
        ctx.lineTo(mx + 5, p.y + 8 + bounce);
        ctx.lineTo(mx, p.y + 5 + bounce);
        ctx.lineTo(mx - 5, p.y + 8 + bounce);
        ctx.closePath();
        ctx.fill();
        continue;
      }

      // --- Dash/Speed Block --- VERY OBVIOUS
      if (p.type === 'dash_block') {
        // Bright orange base
        ctx.fillStyle = PLAT_DASH;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Animated speed arrows sliding along the platform
        const arrowOffset = (now * 0.15) % 40;
        ctx.fillStyle = PLAT_DASH_STRIPE;
        for (let ax = p.x - 40 + arrowOffset; ax < p.x + p.w; ax += 40) {
          const clampL = Math.max(ax, p.x);
          const clampR = Math.min(ax + 20, p.x + p.w);
          if (clampR > clampL) {
            ctx.fillRect(clampL, p.y + 4, clampR - clampL, p.h - 8);
          }
        }

        // Arrow chevrons pointing right (direction indicator)
        ctx.fillStyle = '#FFF';
        ctx.globalAlpha = 0.5;
        for (let cx = p.x + 30; cx < p.x + p.w - 10; cx += 60) {
          ctx.beginPath();
          ctx.moveTo(cx, p.y + 6);
          ctx.lineTo(cx + 10, p.y + p.h / 2);
          ctx.lineTo(cx, p.y + p.h - 6);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Top highlight
        ctx.fillStyle = '#F5B041';
        ctx.fillRect(p.x, p.y, p.w, 3);

        // Pulsing glow border
        const pulse = 0.3 + 0.3 * Math.sin(now * 0.005);
        ctx.strokeStyle = `rgba(241,196,15,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
        continue;
      }

      // --- Crumble Block ---
      if (p.type === 'crumble') {
        const timer = p.timer || 0;
        const isGone = timer > 0 && timer <= CRUMBLE_GONE_TIME;
        const isShaking = timer > CRUMBLE_GONE_TIME;

        if (isGone) {
          // Ghost outline
          ctx.strokeStyle = 'rgba(200,169,110,0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(p.x, p.y, p.w, p.h);
          ctx.setLineDash([]);
          continue;
        }

        const shakeX = isShaking ? (Math.random() - 0.5) * 4 : 0;
        const shakeY = isShaking ? (Math.random() - 0.5) * 3 : 0;
        const dx = p.x + shakeX;
        const dy = p.y + shakeY;

        ctx.globalAlpha = isShaking ? 0.55 : 1;

        // Main body — sandy
        ctx.fillStyle = PLAT_CRUMBLE;
        ctx.fillRect(dx, dy, p.w, p.h);

        // Crack pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        // Diagonal crack
        ctx.beginPath();
        ctx.moveTo(dx + p.w * 0.2, dy);
        ctx.lineTo(dx + p.w * 0.4, dy + p.h * 0.5);
        ctx.lineTo(dx + p.w * 0.3, dy + p.h);
        ctx.stroke();
        // Second crack
        ctx.beginPath();
        ctx.moveTo(dx + p.w * 0.7, dy);
        ctx.lineTo(dx + p.w * 0.6, dy + p.h * 0.6);
        ctx.lineTo(dx + p.w * 0.75, dy + p.h);
        ctx.stroke();

        // Top edge
        ctx.fillStyle = '#D4B870';
        ctx.fillRect(dx, dy, p.w, 3);

        // Warning border when shaking
        if (isShaking) {
          ctx.strokeStyle = '#E74C3C';
          ctx.lineWidth = 2;
          ctx.strokeRect(dx, dy, p.w, p.h);
        }

        ctx.globalAlpha = 1;
        continue;
      }

      // --- Jump-Through ---
      if (p.type === 'jumpthrough') {
        // Semi-transparent pink body
        ctx.fillStyle = PLAT_JUMPTHROUGH;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = 1;

        // Bold solid top edge (this is where you land)
        ctx.fillStyle = PLAT_JUMPTHROUGH;
        ctx.fillRect(p.x, p.y, p.w, 4);

        // Dotted pattern showing "pass through"
        ctx.fillStyle = 'rgba(224,86,160,0.25)';
        for (let dotX = p.x + 8; dotX < p.x + p.w - 4; dotX += 12) {
          for (let dotY = p.y + 8; dotY < p.y + p.h - 2; dotY += 10) {
            ctx.fillRect(dotX, dotY, 4, 4);
          }
        }
        continue;
      }

      // --- One-Way ---
      if (p.type === 'oneway') {
        // Semi-transparent purple body
        ctx.fillStyle = PLAT_ONEWAY;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = 1;

        // Bold solid top
        ctx.fillStyle = PLAT_ONEWAY;
        ctx.fillRect(p.x, p.y, p.w, 4);

        // Down arrows
        ctx.fillStyle = 'rgba(142,68,173,0.45)';
        for (let ax = p.x + 14; ax < p.x + p.w - 8; ax += 20) {
          // Arrow body
          ctx.fillRect(ax - 2, p.y + 7, 4, p.h - 16);
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(ax - 5, p.y + p.h - 10);
          ctx.lineTo(ax + 5, p.y + p.h - 10);
          ctx.lineTo(ax, p.y + p.h - 4);
          ctx.closePath();
          ctx.fill();
        }
        continue;
      }

      // --- Normal Platform ---
      ctx.fillStyle = PLAT_COLOR;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Lighter top edge
      ctx.fillStyle = PLAT_TOP;
      ctx.fillRect(p.x, p.y, p.w, 2);
    }
  }

  // ========================
  // PLAYER — simple cube with squash/stretch animations
  // ========================

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen, dashCharge, dashing, vy) {
    const ctx = this.ctx;
    const bodyColor = isFrozen ? '#A8D8EA' : color;

    // --- Squash/stretch based on vertical velocity ---
    let scaleX = 1, scaleY = 1;
    if (vy !== undefined && !isFrozen) {
      if (vy < -5) {
        // Jumping up — horizontal squash (wider, shorter)
        const t = Math.min(1, (-vy - 5) / 7);
        scaleX = 1 + t * 0.18;
        scaleY = 1 - t * 0.18;
      } else if (vy > 4) {
        // Falling — vertical stretch (taller, thinner)
        const t = Math.min(1, (vy - 4) / 6);
        scaleX = 1 - t * 0.12;
        scaleY = 1 + t * 0.18;
      }
    }

    // Dash squash (flat and fast looking)
    if (dashing) {
      scaleX = 1.2;
      scaleY = 0.8;
    }

    const drawW = Math.round(S * scaleX);
    const drawH = Math.round(S * scaleY);
    const px = Math.round(x) + Math.round((S - drawW) / 2);
    const py = Math.round(y) + (S - drawH); // anchor at bottom
    const cx = px + drawW / 2;

    // "IT" glow
    if (isIt) {
      ctx.shadowColor = 'rgba(255,255,255,0.7)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 2, py - 2, drawW + 4, drawH + 4);
      ctx.shadowBlur = 0;
    }

    if (isFrozen) ctx.globalAlpha = 0.6;

    // Dash trail
    if (dashing) {
      ctx.globalAlpha = 0.12;
      const trailDir = facingRight ? -1 : 1;
      for (let t = 1; t <= 3; t++) {
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px + trailDir * t * 10, py + t * 2, drawW - t * 3, drawH - t * 2);
      }
      ctx.globalAlpha = isFrozen ? 0.6 : 1;
    }

    // Main cube body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px, py, drawW, drawH);

    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px, py, drawW, 3);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px, py + drawH - 3, drawW, 3);

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, drawW, drawH);

    ctx.globalAlpha = 1;

    // "IT" arrow
    if (isIt) {
      const arrowX = cx;
      const bob = Math.sin(Date.now() * 0.005) * 3;
      const arrowY = py - 12 + bob;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 6);
      ctx.lineTo(arrowX - 5, arrowY);
      ctx.lineTo(arrowX + 5, arrowY);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(arrowX - 2, arrowY - 4, 4, 5);
    }

    // Frozen overlay
    if (isFrozen) {
      ctx.strokeStyle = 'rgba(168,216,234,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px - 2, py - 2, drawW + 4, drawH + 4);
      ctx.setLineDash([]);
    }

    // Dash charge bar
    {
      const barW = S + 2;
      const barH = 3;
      const barX = Math.round(x) + HALF - barW / 2;
      const barY = Math.round(y) + S + 4;
      const charge = dashCharge !== undefined ? dashCharge : 1;

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(barX, barY, barW, barH);

      if (charge >= 1) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.006);
        ctx.fillStyle = `rgba(255,215,0,${pulse})`;
        ctx.fillRect(barX + 1, barY + 1, barW - 2, barH - 2);
      } else if (charge > 0) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * charge, barH - 2);
      }
    }

    // Name tag
    const nameText = name || 'Player';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const nameW = ctx.measureText(nameText).width + 10;
    const nameY = py - (isIt ? 20 : 4);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - nameW / 2, nameY - 9, nameW, 14);

    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, cx, nameY);
    ctx.textAlign = 'left';
  }

  // ========================
  // HUD
  // ========================

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, 6, CANVAS_WIDTH - 16, 28);

    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#FF6B6B' : '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 25);
    }

    if (mode) {
      const labels = { classic: 'CLASSIC', freeze: 'FREEZE', infection: 'INFECTION', practice: 'PRACTICE' };
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[mode] || mode.toUpperCase(), 22, 24);
    }

    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${playerCount} players`, CANVAS_WIDTH - 22, 24);
    }

    if (isIt) {
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.004);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 80, 42, 160, 26);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 60);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }

  drawInstructions() {
    const ctx = this.ctx;
    const w = 440, h = 440;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = (CANVAS_HEIGHT - h) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(20,20,40,0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', CANVAS_WIDTH / 2, y + 34);

    ctx.textAlign = 'left';
    const lines = [
      ['Arrow Keys / WASD', 'Move left & right'],
      ['Space / W / Up', 'Jump'],
      ['Jump again in air', 'Double Jump'],
      ['Jump on wall', 'Wall Jump'],
      ['Shift', 'Dash (when bar is full)'],
    ];
    let ly = y + 62;
    for (const [key, desc] of lines) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(key, x + 24, ly);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '12px sans-serif';
      ctx.fillText(desc, x + 210, ly);
      ly += 24;
    }

    ly += 10;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('BLOCK TYPES', x + 24, ly);
    ly += 20;

    const blocks = [
      [PLAT_COLOR, 'Platform', 'Solid ground'],
      [PLAT_TRAMPOLINE, 'Trampoline', 'Bounce high!'],
      [PLAT_DASH, 'Speed Pad', 'Refills your dash'],
      [PLAT_CRUMBLE, 'Crumble', 'Disappears when stepped on'],
      [PLAT_JUMPTHROUGH, 'Jump-Through', 'Pass through from below'],
      [PLAT_ONEWAY, 'One-Way', 'Land on top only'],
    ];
    for (const [color, name, desc] of blocks) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 24, ly - 8, 14, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(name, x + 46, ly);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.fillText(desc, x + 210, ly);
      ly += 20;
    }

    ly += 14;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press H or click to close', CANVAS_WIDTH / 2, ly);
    ctx.textAlign = 'left';
  }
}
