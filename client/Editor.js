import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const CELL = 32;
const DEFAULT_COLS = 62;
const DEFAULT_ROWS = 37;

// Block types: 0=empty, 1=solid, 2=trampoline, 3=dash_block, 4=crumble, 5=jumpthrough, 6=oneway
const BLOCK_TYPES = [
  { id: 0, name: 'Eraser',       color: '#bbb',    key: '1' },
  { id: 1, name: 'Solid',        color: '#3B2F2F',  key: '2' },
  { id: 2, name: 'Trampoline',   color: '#27AE60',  key: '3' },
  { id: 3, name: 'Speed Pad',    color: '#E67E22',  key: '4' },
  { id: 4, name: 'Crumble',      color: '#C8A96E',  key: '5' },
  { id: 5, name: 'Jump-Through', color: '#E056A0',  key: '6' },
  { id: 6, name: 'One-Way',      color: '#8E44AD',  key: '7' },
];

const TYPE_NAMES = ['empty', 'solid', 'trampoline', 'dash_block', 'crumble', 'jumpthrough', 'oneway'];

export class Editor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = DEFAULT_COLS;
    this.rows = DEFAULT_ROWS;
    this.grid = this.makeGrid();
    this.tool = 1; // solid by default
    this.camX = 0;
    this.camY = 0;
    this.mouseX = -1;
    this.mouseY = -1;
    this.painting = false;
    this.erasing = false;
    this.keysDown = {};
    this.testing = false;

    // Compute canvas scale factor for mouse mapping
    this._canvasRect = null;

    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onContextMenu = (e) => e.preventDefault();
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);

    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('mouseleave', this._onMouseUp);
    canvas.addEventListener('contextmenu', this._onContextMenu);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  makeGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      grid.push(new Uint8Array(this.cols));
    }
    return grid;
  }

  _getCanvasScale() {
    const rect = this.canvas.getBoundingClientRect();
    return {
      scaleX: CANVAS_WIDTH / rect.width,
      scaleY: CANVAS_HEIGHT / rect.height,
      left: rect.left,
      top: rect.top,
    };
  }

  _mouseToGrid(clientX, clientY) {
    const s = this._getCanvasScale();
    const cx = (clientX - s.left) * s.scaleX + this.camX;
    const cy = (clientY - s.top) * s.scaleY + this.camY;
    const col = Math.floor(cx / CELL);
    const row = Math.floor(cy / CELL);
    return { col, row };
  }

  _handleMouseDown(e) {
    if (this.testing) return;
    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (e.button === 2) {
      this.erasing = true;
      this._paintCell(col, row, 0);
    } else if (e.button === 0) {
      // Toggle: if cell already has this type, erase it
      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows && this.grid[row][col] === this.tool) {
        this.painting = true;
        this._paintingAs = 0;
        this._paintCell(col, row, 0);
      } else {
        this.painting = true;
        this._paintingAs = this.tool;
        this._paintCell(col, row, this.tool);
      }
    }
  }

  _handleMouseMove(e) {
    const s = this._getCanvasScale();
    this.mouseX = (e.clientX - s.left) * s.scaleX;
    this.mouseY = (e.clientY - s.top) * s.scaleY;

    if (this.testing) return;
    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (this.painting) this._paintCell(col, row, this._paintingAs);
    if (this.erasing) this._paintCell(col, row, 0);
  }

  _handleMouseUp(e) {
    this.painting = false;
    this.erasing = false;
  }

  _handleKeyDown(e) {
    if (this.testing) return;
    this.keysDown[e.code] = true;
    // Number keys 1-7 to select tool
    const digit = parseInt(e.key);
    if (digit >= 1 && digit <= 7) {
      this.setTool(digit - 1);
      e.preventDefault();
    }
  }

  _handleKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  _paintCell(col, row, type) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.grid[row][col] = type;
  }

  setTool(type) {
    this.tool = type;
    // Update UI highlight
    const tools = document.querySelectorAll('.editor-tool-btn');
    tools.forEach((el, i) => {
      el.classList.toggle('active', i === type);
    });
  }

  updateCamera() {
    if (this.testing) return;
    const speed = 8;
    if (this.keysDown['KeyW'] || this.keysDown['ArrowUp']) this.camY -= speed;
    if (this.keysDown['KeyS'] || this.keysDown['ArrowDown']) this.camY += speed;
    if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) this.camX -= speed;
    if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) this.camX += speed;

    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;
    this.camX = Math.max(0, Math.min(this.camX, mapW - CANVAS_WIDTH));
    this.camY = Math.max(0, Math.min(this.camY, mapH - CANVAS_HEIGHT));
  }

  render(ctx) {
    this.updateCamera();

    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;

    // Background
    ctx.fillStyle = '#7EC8E3';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    const startCol = Math.floor(this.camX / CELL);
    const endCol = Math.min(this.cols, Math.ceil((this.camX + CANVAS_WIDTH) / CELL) + 1);
    const startRow = Math.floor(this.camY / CELL);
    const endRow = Math.min(this.rows, Math.ceil((this.camY + CANVAS_HEIGHT) / CELL) + 1);

    for (let c = startCol; c <= endCol; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, startRow * CELL);
      ctx.lineTo(c * CELL, endRow * CELL);
      ctx.stroke();
    }
    for (let r = startRow; r <= endRow; r++) {
      ctx.beginPath();
      ctx.moveTo(startCol * CELL, r * CELL);
      ctx.lineTo(endCol * CELL, r * CELL);
      ctx.stroke();
    }

    // Filled cells
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const type = this.grid[r][c];
        if (type === 0) continue;
        const block = BLOCK_TYPES[type];
        const x = c * CELL;
        const y = r * CELL;

        if (type === 2) {
          // Trampoline: draw thin strip at bottom of cell
          ctx.fillStyle = block.color;
          ctx.fillRect(x, y + CELL - 12, CELL, 12);
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          for (let dx = x + 4; dx < x + CELL; dx += 8) {
            ctx.fillRect(dx, y + CELL - 8, 3, 3);
          }
        } else {
          ctx.fillStyle = block.color;
          ctx.fillRect(x, y, CELL, CELL);

          // Type-specific textures (matching Renderer.js)
          if (type === 1) {
            // Solid - brick-like
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 16, y); ctx.lineTo(x + 16, y + CELL); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x + CELL, y + 16); ctx.stroke();
            ctx.fillStyle = '#4D3D3D';
            ctx.fillRect(x, y, CELL, 2);
          } else if (type === 3) {
            // Speed pad
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            for (let dy2 = y + 5; dy2 < y + CELL - 2; dy2 += 8) {
              for (let dx2 = x + 6; dx2 < x + CELL; dx2 += 12) {
                ctx.fillRect(dx2, dy2, 3, 3);
              }
            }
            ctx.fillStyle = '#F0A04B';
            ctx.fillRect(x, y, CELL, 2);
          } else if (type === 4) {
            // Crumble
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x, y + CELL); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 24, y); ctx.lineTo(x + 16, y + CELL); ctx.stroke();
          } else if (type === 5) {
            // Jump-through
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = block.color;
            ctx.fillRect(x, y, CELL, CELL);
            ctx.globalAlpha = 1;
            ctx.fillStyle = block.color;
            ctx.fillRect(x, y, CELL, 3);
          } else if (type === 6) {
            // One-way
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = block.color;
            ctx.fillRect(x, y, CELL, CELL);
            ctx.globalAlpha = 1;
            ctx.fillStyle = block.color;
            ctx.fillRect(x, y, CELL, 3);
          }
        }
      }
    }

    // Map boundary outline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, mapW, mapH);

    // Hover highlight
    if (!this.testing && this.mouseX >= 0 && this.mouseY >= 0) {
      const hCol = Math.floor((this.mouseX + this.camX) / CELL);
      const hRow = Math.floor((this.mouseY + this.camY) / CELL);
      if (hCol >= 0 && hCol < this.cols && hRow >= 0 && hRow < this.rows) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(hCol * CELL, hRow * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hCol * CELL, hRow * CELL, CELL, CELL);
      }
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 6, CANVAS_WIDTH - 16, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL EDITOR', 20, 23);
    ctx.textAlign = 'right';
    const block = BLOCK_TYPES[this.tool];
    ctx.fillText(`Tool: ${block.name} [${block.key}]`, CANVAS_WIDTH - 20, 23);
    ctx.textAlign = 'left';
  }

  toMap() {
    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;
    const platforms = [];

    // Boundary walls
    platforms.push({ x: 0, y: 0, w: 20, h: mapH }); // left
    platforms.push({ x: mapW - 20, y: 0, w: 20, h: mapH }); // right
    // Floor
    platforms.push({ x: 0, y: mapH - 32, w: mapW, h: 32 });

    // Merge adjacent same-type horizontal cells
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const type = this.grid[r][c];
        if (type === 0) { c++; continue; }

        if (type === 2) {
          // Trampolines: 2 cells wide, thin strip
          // Scan for consecutive trampoline cells
          let startC = c;
          while (c < this.cols && this.grid[r][c] === 2) c++;
          const cellCount = c - startC;
          // Create trampolines in pairs of 2 (64px wide)
          for (let i = 0; i < cellCount; i += 2) {
            const tw = Math.min(2, cellCount - i) * CELL;
            platforms.push({
              x: (startC + i) * CELL,
              y: r * CELL + CELL - 12,
              w: tw, h: 12,
              type: 'trampoline',
            });
          }
          continue;
        }

        // Other types: merge horizontally
        const startC = c;
        while (c < this.cols && this.grid[r][c] === type) c++;
        const plat = {
          x: startC * CELL,
          y: r * CELL,
          w: (c - startC) * CELL,
          h: CELL,
        };
        if (type !== 1) plat.type = TYPE_NAMES[type];
        if (type === 4) { plat.timer = 0; plat.gone = false; }
        platforms.push(plat);
      }
    }

    // Spawn points: 8 evenly spaced along the floor
    const spawns = [];
    for (let i = 0; i < 8; i++) {
      spawns.push({
        x: 40 + (mapW - 80) * (i / 7),
        y: mapH - 32 - PLAYER_HEIGHT - 2,
      });
    }

    return {
      name: 'Custom',
      width: mapW,
      height: mapH,
      bg: '#7EC8E3',
      theme: 'sky',
      platforms,
      spawns,
    };
  }

  save() {
    // Encode: header "COLSxROWS;" then each row as COLS chars (0-6), rows joined by |
    // Then base64 encode the whole thing
    let rowStrs = [];
    for (let r = 0; r < this.rows; r++) {
      // RLE within each row
      let rowStr = '';
      let c = 0;
      while (c < this.cols) {
        const val = this.grid[r][c];
        let count = 1;
        while (c + count < this.cols && this.grid[r][c + count] === val) count++;
        if (count > 1) {
          rowStr += count + String(val);
        } else {
          rowStr += String(val);
        }
        c += count;
      }
      rowStrs.push(rowStr);
    }
    // Trim trailing empty rows
    while (rowStrs.length > 0 && /^(0+|(\d+0)+)$/.test(rowStrs[rowStrs.length - 1]) && rowStrs[rowStrs.length - 1].replace(/\d+/g, m => '0'.repeat(parseInt(m) || 1)).replace(/0/g, '') === '') {
      // Check if row is all zeros
      const last = rowStrs[rowStrs.length - 1];
      let allZero = true;
      let i = 0;
      while (i < last.length) {
        let num = '';
        while (i < last.length && last[i] >= '1' && last[i] <= '9') { num += last[i]; i++; }
        if (i < last.length) {
          if (last[i] !== '0') { allZero = false; break; }
          i++;
        } else if (num) { allZero = false; break; }
      }
      if (!allZero) break;
      rowStrs.pop();
    }
    const raw = `${this.cols}x${this.rows};${rowStrs.join('|')}`;
    return btoa(raw);
  }

  load(code) {
    try {
      const raw = atob(code.trim());
      const [header, body] = raw.split(';');
      const [colsStr, rowsStr] = header.split('x');
      this.cols = parseInt(colsStr);
      this.rows = parseInt(rowsStr);
      this.grid = this.makeGrid();

      if (!body) return true;
      const rowStrs = body.split('|');
      for (let r = 0; r < rowStrs.length && r < this.rows; r++) {
        const rle = rowStrs[r];
        let c = 0;
        let i = 0;
        while (i < rle.length && c < this.cols) {
          // Parse optional run count
          let numStr = '';
          while (i < rle.length && rle[i] >= '1' && rle[i] <= '9' && (numStr + rle[i]).length < 4) {
            // Only treat as count if followed by a digit 0-6
            numStr += rle[i];
            i++;
          }
          if (i < rle.length) {
            const val = parseInt(rle[i]);
            i++;
            if (val >= 0 && val <= 6) {
              const count = numStr ? parseInt(numStr) : 1;
              for (let j = 0; j < count && c < this.cols; j++) {
                this.grid[r][c] = val;
                c++;
              }
            }
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to load level code:', e);
      return false;
    }
  }

  clear() {
    this.grid = this.makeGrid();
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('mouseleave', this._onMouseUp);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
