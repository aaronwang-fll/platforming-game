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
  // BACKGROUNDS — clean, colorful gradients with soft decor
  // ========================

  drawBackground(map, camera) {
    const ctx = this.ctx;
    const t = map.theme || 'sky';
    const themes = {
      sky:      ['#7EC8E3', '#4A90D9', '#2C5F8A'],
      night:    ['#1B2838', '#2C3E6B', '#1A1A3E'],
      rooftops: ['#1A1A3E', '#2C3E6B', '#0D1B2A'],
      sunset:   ['#FF9A76', '#FECA57', '#FF6348'],
      factory:  ['#2C1810', '#4A2C20', '#1A0F0A'],
    };
    const [c1, c2, c3] = themes[t] || themes.sky;

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.6, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawDecor(map, camera) {
    const ctx = this.ctx;
    const t = map.theme || 'sky';

    if (t === 'sky' || t === 'night' || t === 'rooftops') {
      // Soft clouds / shapes parallaxing
      const cloudColor = t === 'sky' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)';
      ctx.fillStyle = cloudColor;
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 217 + 80) % (CANVAS_WIDTH + 200)) - camera.x * (0.03 + i * 0.01);
        const cy = 40 + (i * 73 % 120);
        const rr = 30 + (i * 19 % 40);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr * 2, rr, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (t === 'rooftops' || t === 'night') {
      // Moon
      ctx.fillStyle = 'rgba(255,240,200,0.9)';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 70, 55, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t === 'night' ? '#1B2838' : '#1A1A3E';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 62, 50, 18, 0, Math.PI * 2);
      ctx.fill();

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137 + 50) % CANVAS_WIDTH;
        const sy = (i * 97 + 20) % (CANVAS_HEIGHT * 0.4);
        ctx.beginPath();
        ctx.arc(sx, sy, i % 4 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (t === 'sunset') {
      // Warm sun glow
      const grd = ctx.createRadialGradient(CANVAS_WIDTH * 0.5, CANVAS_HEIGHT * 0.35, 10, CANVAS_WIDTH * 0.5, CANVAS_HEIGHT * 0.35, 120);
      grd.addColorStop(0, 'rgba(255,255,200,0.4)');
      grd.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (t === 'rooftops') {
      // Background city silhouettes
      ctx.fillStyle = 'rgba(15,20,40,0.5)';
      for (let i = 0; i < 8; i++) {
        const bx = i * 130 - camera.x * 0.08;
        const bw = 40 + (i * 31 % 50);
        const bh = 80 + (i * 67 % 150);
        pill(ctx, bx, CANVAS_HEIGHT - bh, bw, bh, 3);
        ctx.fill();
      }
    }
  }

  // ========================
  // PLATFORMS — soft, rounded, colorful with subtle shadows
  // ========================

  drawPlatforms(platforms, theme) {
    const ctx = this.ctx;
    const c = platformTheme(theme);

    for (const p of platforms) {
      const r = Math.min(p.h / 2, 10);

      // Soft drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      pill(ctx, p.x + 2, p.y + 3, p.w, p.h, r);
      ctx.fill();

      // Main body
      ctx.fillStyle = c.fill;
      pill(ctx, p.x, p.y, p.w, p.h, r);
      ctx.fill();

      // Top highlight stripe
      ctx.fillStyle = c.top;
      pill(ctx, p.x, p.y, p.w, Math.min(5, p.h * 0.4), r);
      ctx.fill();

      // Subtle inner bottom shadow
      if (p.h > 10) {
        ctx.fillStyle = c.bottom;
        pill(ctx, p.x, p.y + p.h - Math.min(4, p.h * 0.3), p.w, Math.min(4, p.h * 0.3), r);
        ctx.fill();
      }
    }
  }

  // ========================
  // PLAYER — smooth circle blob with glow, bounce feel
  // ========================

  drawPlayer(x, y, color, name, facingRight, isIt, isFrozen, dashCharge, dashing) {
    const ctx = this.ctx;
    // Center of the circle
    const cx = Math.round(x) + HALF;
    const cy = Math.round(y) + HALF;
    const radius = HALF;

    const bodyColor = isFrozen ? '#A8D8EA' : color;
    const [cr, cg, cb] = hexRgb(bodyColor);

    // Soft ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius + 3, radius * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // "IT" glow ring
    if (isIt) {
      ctx.fillStyle = 'rgba(255,80,80,0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,100,100,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (isFrozen) ctx.globalAlpha = 0.7;

    // Main body circle
    const bodyGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    bodyGrad.addColorStop(0, `rgba(${Math.min(255,cr+60)},${Math.min(255,cg+60)},${Math.min(255,cb+60)},1)`);
    bodyGrad.addColorStop(0.7, bodyColor);
    bodyGrad.addColorStop(1, `rgba(${Math.max(0,cr-30)},${Math.max(0,cg-30)},${Math.max(0,cb-30)},1)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Shiny highlight bubble
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.25, cy - radius * 0.3, radius * 0.35, radius * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Subtle outline
    ctx.strokeStyle = `rgba(${Math.max(0,cr-40)},${Math.max(0,cg-40)},${Math.max(0,cb-40)},0.4)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Crown for "IT"
    if (isIt) {
      ctx.fillStyle = '#FFD700';
      const crownY = cy - radius - 4;
      ctx.beginPath();
      ctx.moveTo(cx - 10, crownY);
      ctx.lineTo(cx - 7, crownY - 9);
      ctx.lineTo(cx - 3, crownY - 3);
      ctx.lineTo(cx, crownY - 11);
      ctx.lineTo(cx + 3, crownY - 3);
      ctx.lineTo(cx + 7, crownY - 9);
      ctx.lineTo(cx + 10, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Frozen ice effect
    if (isFrozen) {
      ctx.strokeStyle = 'rgba(168,216,234,0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Ice crystals
      ctx.fillStyle = 'rgba(200,230,255,0.5)';
      for (let a = 0; a < 3; a++) {
        const angle = a * 2.1 + 0.5;
        const ix = cx + Math.cos(angle) * (radius + 2);
        const iy = cy + Math.sin(angle) * (radius + 2);
        ctx.beginPath();
        ctx.moveTo(ix, iy - 4);
        ctx.lineTo(ix + 3, iy + 2);
        ctx.lineTo(ix - 3, iy + 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Dash trail effect
    if (dashing) {
      ctx.globalAlpha = 0.25;
      const trailDir = facingRight ? -1 : 1;
      for (let t = 1; t <= 3; t++) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx + trailDir * t * 10, cy, radius - t * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Dash charge bar (below player)
    if (dashCharge !== undefined && dashCharge < 1) {
      const barW = S;
      const barH = 4;
      const barX = cx - barW / 2;
      const barY = cy + radius + 8;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      pill(ctx, barX, barY, barW, barH, 2);
      ctx.fill();
      // Fill
      ctx.fillStyle = dashCharge > 0.9 ? '#FFD700' : 'rgba(255,255,255,0.7)';
      pill(ctx, barX, barY, barW * dashCharge, barH, 2);
      ctx.fill();
    }

    // Name tag — clean pill background
    const nameText = name || 'Player';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const nameW = ctx.measureText(nameText).width + 10;
    const nameY = cy - radius - (isIt ? 18 : 8);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    pill(ctx, cx - nameW / 2, nameY - 9, nameW, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, cx, nameY);
    ctx.textAlign = 'left';
  }

  // ========================
  // HUD — clean .io style
  // ========================

  drawHUD(mode, timeLeft, isIt, playerCount) {
    const ctx = this.ctx;

    // Top bar — frosted glass style
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    pill(ctx, 8, 6, CANVAS_WIDTH - 16, 32, 16);
    ctx.fill();

    // Timer
    if (timeLeft !== null && timeLeft !== undefined) {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      ctx.fillStyle = timeLeft < 30 ? '#FF6B6B' : '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 28);
    }

    // Mode label
    if (mode) {
      const labels = { classic: 'CLASSIC', freeze: 'FREEZE', infection: 'INFECTION', practice: 'PRACTICE' };
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[mode] || mode.toUpperCase(), 22, 26);
    }

    // Player count
    if (playerCount) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${playerCount} players`, CANVAS_WIDTH - 22, 26);
    }

    // "YOU ARE IT" — big clean banner
    if (isIt) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
      ctx.globalAlpha = pulse;

      // Banner pill
      ctx.fillStyle = 'rgba(255,80,80,0.85)';
      pill(ctx, CANVAS_WIDTH / 2 - 100, 46, 200, 32, 16);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU ARE IT!', CANVAS_WIDTH / 2, 68);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  }
}

// ========================
// Helpers
// ========================

function pill(ctx, x, y, w, h, r) {
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

function platformTheme(theme) {
  switch (theme) {
    case 'sky':      return { fill: '#E8F4FD', top: '#ffffff',  bottom: '#C5DCE8' };
    case 'night':    return { fill: '#2A3A5C', top: '#3D5080',  bottom: '#1E2A45' };
    case 'rooftops': return { fill: '#3A4A6C', top: '#4D5E84',  bottom: '#2A3852' };
    case 'sunset':   return { fill: '#D4956B', top: '#E8B08A',  bottom: '#B07850' };
    case 'factory':  return { fill: '#5A4030', top: '#7A5A42',  bottom: '#3A2818' };
    default:         return { fill: '#E8F4FD', top: '#ffffff',  bottom: '#C5DCE8' };
  }
}
