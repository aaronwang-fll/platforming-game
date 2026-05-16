import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const CELL = 32;
const DEFAULT_COLS = 62;
const DEFAULT_ROWS = 37;
const MIN_COLS = 20;
const MIN_ROWS = 15;
const MAX_COLS = 100;
const MAX_ROWS = 60;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const BLOCK_TYPES = [
  { id: 0, name: 'Eraser',       color: '#bbb',    key: '1' },
  { id: 1, name: 'Solid',        color: '#3B2F2F',  key: '2' },
  { id: 2, name: 'Trampoline',   color: '#27AE60',  key: '3' },
  { id: 3, name: 'Speed Pad',    color: '#E67E22',  key: '4' },
  { id: 4, name: 'Crumble',      color: '#C8A96E',  key: '5' },
  { id: 5, name: 'Jump-Through', color: '#E056A0',  key: '6' },
  { id: 6, name: 'One-Way',      color: '#8E44AD',  key: '7' },
  { id: 7, name: 'Conveyor',     color: '#3498DB',  key: '8' },
];

const PALETTE_TYPES = [
  { id: 0, name: 'Eraser',       color: '#bbb',    key: '\u21e7 1' },
  { id: 1, name: 'Solid',        color: '#3B2F2F',  key: '\u21e7 2' },
  { id: 2, name: 'Trampoline',   color: '#27AE60',  key: '\u21e7 3' },
  { id: 3, name: 'Speed Pad',    color: '#E67E22',  key: '\u21e7 4' },
  { id: 4, name: 'Crumble',      color: '#C8A96E',  key: '\u21e7 5' },
  { id: 5, name: 'Jump-Through', color: '#E056A0',  key: '\u21e7 6' },
  { id: 7, name: 'Conveyor',     color: '#3498DB',  key: '\u21e7 7' },
];

const TYPE_NAMES = ['empty', 'solid', 'trampoline', 'dash_block', 'crumble', 'jumpthrough', 'oneway', 'conveyor'];
const ROTATABLE = new Set([2, 5, 7]);
const SOLID_GRID_TYPES = new Set([1, 3, 4]); // types that count as solid ground for spawns/fills

const ROT_LABELS = ['\u2191 Bottom', '\u2190 Right', '\u2193 Top', '\u2192 Left'];

export class Editor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = DEFAULT_COLS;
    this.rows = DEFAULT_ROWS;
    this.grid = this.makeGrid();
    this.tool = 1;
    this.rotation = 0;
    this.zoom = 1;
    this.toolbarPos = 'bottom';
    this.camX = 0;
    this.camY = Math.max(0, this.rows * CELL - CANVAS_HEIGHT);
    this.mouseX = -1;
    this.mouseY = -1;
    this.painting = false;
    this.erasing = false;
    this._paintingAs = 0;
    this._panning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._panStartCamX = 0;
    this._panStartCamY = 0;
    this._dirToggleRect = null;
    this.keysDown = {};
    this.testing = false;

    // Design library
    this.library = this._loadLibrary();

    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onContextMenu = (e) => e.preventDefault();
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onWheel = this._handleWheel.bind(this);

    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('mouseleave', this._onMouseUp);
    canvas.addEventListener('contextmenu', this._onContextMenu);
    canvas.addEventListener('wheel', this._onWheel, { passive: false });
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

  resize(newCols, newRows) {
    newCols = Math.max(MIN_COLS, Math.min(MAX_COLS, newCols));
    newRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, newRows));
    if (newCols === this.cols && newRows === this.rows) return;
    const oldGrid = this.grid;
    const oldCols = this.cols;
    const oldRows = this.rows;
    this.cols = newCols;
    this.rows = newRows;
    this.grid = this.makeGrid();
    for (let r = 0; r < Math.min(oldRows, newRows); r++) {
      for (let c = 0; c < Math.min(oldCols, newCols); c++) {
        this.grid[r][c] = oldGrid[r][c];
      }
    }
    this._clampCamera();
  }

  get minCols() { return MIN_COLS; }
  get maxCols() { return MAX_COLS; }
  get minRows() { return MIN_ROWS; }
  get maxRows() { return MAX_ROWS; }

  // --- Library ---
  _loadLibrary() {
    try {
      const saved = localStorage.getItem('tag_editor_library');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return [];
  }

  _saveLibrary() {
    localStorage.setItem('tag_editor_library', JSON.stringify(this.library));
  }

  librarySave(name) {
    const code = this.save();
    this.library.push({ name: name || `Design ${this.library.length + 1}`, code, date: Date.now() });
    this._saveLibrary();
  }

  libraryLoad(index) {
    if (index < 0 || index >= this.library.length) return false;
    return this.load(this.library[index].code);
  }

  libraryDelete(index) {
    if (index < 0 || index >= this.library.length) return;
    this.library.splice(index, 1);
    this._saveLibrary();
  }

  libraryList() {
    return this.library.map((entry, i) => ({ index: i, name: entry.name, date: entry.date }));
  }

  // --- Input ---
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
    const cx = (clientX - s.left) * s.scaleX / this.zoom + this.camX;
    const cy = (clientY - s.top) * s.scaleY / this.zoom + this.camY;
    return { col: Math.floor(cx / CELL), row: Math.floor(cy / CELL) };
  }

  _handleMouseDown(e) {
    if (this.testing) return;

    // Direction toggle click
    if (e.button === 0 && this._dirToggleRect && ROTATABLE.has(this.tool)) {
      const s = this._getCanvasScale();
      const mx = (e.clientX - s.left) * s.scaleX;
      const my = (e.clientY - s.top) * s.scaleY;
      const r = this._dirToggleRect;
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        if (mx < r.x + r.w / 2) this.rotation = (this.rotation + 3) & 3;
        else this.rotation = (this.rotation + 1) & 3;
        return;
      }
    }

    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (e.button === 2) {
      this._panning = true;
      this._panStartX = e.clientX;
      this._panStartY = e.clientY;
      this._panStartCamX = this.camX;
      this._panStartCamY = this.camY;
    } else if (e.button === 0) {
      if (e.shiftKey) {
        this.painting = true;
        this._paintingAs = 0;
        this._paintCell(col, row, 0);
      } else {
        const cellVal = this._encodedValue(this.tool);
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows && this.grid[row][col] === cellVal) {
          this.painting = true;
          this._paintingAs = 0;
          this._paintCell(col, row, 0);
        } else {
          this.painting = true;
          this._paintingAs = cellVal;
          this._paintCell(col, row, cellVal);
        }
      }
    }
  }

  _encodedValue(type) {
    if (type === 0) return 0;
    if (ROTATABLE.has(type)) return type | (this.rotation << 4);
    return type;
  }

  _handleMouseMove(e) {
    const s = this._getCanvasScale();
    this.mouseX = (e.clientX - s.left) * s.scaleX;
    this.mouseY = (e.clientY - s.top) * s.scaleY;

    if (this._panning) {
      this.camX = this._panStartCamX - (e.clientX - this._panStartX) * s.scaleX / this.zoom;
      this.camY = this._panStartCamY - (e.clientY - this._panStartY) * s.scaleY / this.zoom;
      this._clampCamera();
      return;
    }

    if (this.testing) return;
    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (this.painting) this._paintCell(col, row, this._paintingAs);
  }

  _handleMouseUp() {
    this.painting = false;
    this._panning = false;
  }

  _handleWheel(e) {
    if (this.testing) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom + delta));
    // Zoom toward mouse position
    const s = this._getCanvasScale();
    const mx = (e.clientX - s.left) * s.scaleX;
    const my = (e.clientY - s.top) * s.scaleY;
    const worldX = mx / this.zoom + this.camX;
    const worldY = my / this.zoom + this.camY;
    this.zoom = newZoom;
    this.camX = worldX - mx / this.zoom;
    this.camY = worldY - my / this.zoom;
    this._clampCamera();
  }

  _handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.shiftKey && e.code === 'KeyT' && !this.testing) {
      document.getElementById('btn-editor-test').click();
      e.preventDefault();
      return;
    }
    if (e.shiftKey && e.code === 'KeyS' && this.testing) {
      document.getElementById('btn-editor-stop').click();
      e.preventDefault();
      return;
    }

    if (this.testing) return;
    this.keysDown[e.code] = true;

    if (e.shiftKey) {
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= PALETTE_TYPES.length) {
        this.setTool(PALETTE_TYPES[digit - 1].id);
        e.preventDefault();
      }
    }

    if (e.code === 'KeyR' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (ROTATABLE.has(this.tool)) {
        this.rotation = (this.rotation + 1) & 3;
        e.preventDefault();
      }
    }

    if (e.code === 'KeyT' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const positions = ['bottom', 'left', 'top', 'right'];
      const idx = positions.indexOf(this.toolbarPos);
      this.toolbarPos = positions[(idx + 1) % 4];
      this._applyToolbarPos();
      e.preventDefault();
    }
  }

  _applyToolbarPos() {
    const toolbar = document.getElementById('editor-toolbar');
    if (!toolbar) return;
    toolbar.classList.remove('toolbar-bottom', 'toolbar-left', 'toolbar-top', 'toolbar-right');
    toolbar.classList.add('toolbar-' + this.toolbarPos);
  }

  _handleKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  _paintCell(col, row, value) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.grid[row][col] = value;
  }

  setTool(type) {
    this.tool = type;
    if (!ROTATABLE.has(type)) this.rotation = 0;
    const tools = document.querySelectorAll('.editor-tool-btn');
    const paletteIdx = PALETTE_TYPES.findIndex(t => t.id === type);
    tools.forEach((el, i) => el.classList.toggle('active', i === paletteIdx));
  }

  _clampCamera() {
    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;
    const viewW = CANVAS_WIDTH / this.zoom;
    const viewH = CANVAS_HEIGHT / this.zoom;
    this.camX = Math.max(0, Math.min(this.camX, Math.max(0, mapW - viewW)));
    this.camY = Math.max(0, Math.min(this.camY, Math.max(0, mapH - viewH)));
  }

  updateCamera() {
    if (this.testing) return;
    const speed = 8 / this.zoom;
    if (this.keysDown['KeyW'] || this.keysDown['ArrowUp']) this.camY -= speed;
    if (this.keysDown['KeyS'] || this.keysDown['ArrowDown']) this.camY += speed;
    if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) this.camX -= speed;
    if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) this.camX += speed;
    this._clampCamera();
  }

  render(ctx) {
    this.updateCamera();
    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;

    ctx.fillStyle = '#7EC8E3';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1 / this.zoom;
    const viewW = CANVAS_WIDTH / this.zoom;
    const viewH = CANVAS_HEIGHT / this.zoom;
    const startCol = Math.floor(this.camX / CELL);
    const endCol = Math.min(this.cols, Math.ceil((this.camX + viewW) / CELL) + 1);
    const startRow = Math.floor(this.camY / CELL);
    const endRow = Math.min(this.rows, Math.ceil((this.camY + viewH) / CELL) + 1);

    for (let c = startCol; c <= endCol; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, startRow * CELL); ctx.lineTo(c * CELL, endRow * CELL); ctx.stroke();
    }
    for (let r = startRow; r <= endRow; r++) {
      ctx.beginPath(); ctx.moveTo(startCol * CELL, r * CELL); ctx.lineTo(endCol * CELL, r * CELL); ctx.stroke();
    }

    // Filled cells
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const rawVal = this.grid[r][c];
        if (rawVal === 0) continue;
        const type = rawVal & 0xF;
        const rot = (rawVal >> 4) & 3;
        const block = BLOCK_TYPES[type];
        if (!block) continue;
        const x = c * CELL;
        const y = r * CELL;

        if (type === 2) {
          ctx.fillStyle = block.color;
          if (rot === 0) ctx.fillRect(x, y + CELL - 12, CELL, 12);
          else if (rot === 1) ctx.fillRect(x + CELL - 12, y, 12, CELL);
          else if (rot === 2) ctx.fillRect(x, y, CELL, 12);
          else ctx.fillRect(x, y, 12, CELL);
        } else if (type === 7) {
          ctx.fillStyle = block.color;
          if (rot === 0) ctx.fillRect(x, y + CELL - 8, CELL, 8);
          else if (rot === 1) ctx.fillRect(x + CELL - 8, y, 8, CELL);
          else if (rot === 2) ctx.fillRect(x, y, CELL, 8);
          else ctx.fillRect(x, y, 8, CELL);
          // Animated dashes
          const t = (Date.now() * 0.06) % 12;
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          if (rot === 0 || rot === 2) {
            const sign = (rot === 0) ? 1 : -1;
            for (let dx = -12 + t * sign; dx < CELL + 12; dx += 12) {
              const dx2 = x + dx;
              if (dx2 >= x && dx2 + 4 <= x + CELL) ctx.fillRect(dx2, y + (rot === 0 ? CELL - 5 : 1), 4, 2);
            }
          } else {
            const sign = (rot === 1) ? 1 : -1;
            for (let dy = -12 + t * sign; dy < CELL + 12; dy += 12) {
              const dy2 = y + dy;
              if (dy2 >= y && dy2 + 4 <= y + CELL) ctx.fillRect(x + (rot === 1 ? CELL - 5 : 1), dy2, 2, 4);
            }
          }
        } else if (type === 5) {
          const pd = rot;
          ctx.fillStyle = block.color;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.globalAlpha = 1;
          ctx.fillStyle = block.color;
          if (pd === 0) ctx.fillRect(x, y, CELL, 3);
          else if (pd === 1) ctx.fillRect(x + CELL - 3, y, 3, CELL);
          else if (pd === 2) ctx.fillRect(x, y + CELL - 3, CELL, 3);
          else ctx.fillRect(x, y, 3, CELL);
        } else if (type === 6) {
          ctx.fillStyle = block.color;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.globalAlpha = 1;
          ctx.fillRect(x, y, CELL, 3);
        } else {
          ctx.fillStyle = block.color;
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }

    // Map boundary outline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2 / this.zoom;
    ctx.strokeRect(0, 0, mapW, mapH);

    // Hover highlight
    if (!this.testing && this.mouseX >= 0 && this.mouseY >= 0) {
      const hCol = Math.floor((this.mouseX / this.zoom + this.camX) / CELL);
      const hRow = Math.floor((this.mouseY / this.zoom + this.camY) / CELL);
      if (hCol >= 0 && hCol < this.cols && hRow >= 0 && hRow < this.rows) {
        const x = hCol * CELL;
        const y = hRow * CELL;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2 / this.zoom;

        if (this.tool === 2) {
          let hx, hy, hw, hh;
          if (this.rotation === 0) { hx=x; hy=y+CELL-12; hw=CELL; hh=12; }
          else if (this.rotation === 1) { hx=x+CELL-12; hy=y; hw=12; hh=CELL; }
          else if (this.rotation === 2) { hx=x; hy=y; hw=CELL; hh=12; }
          else { hx=x; hy=y; hw=12; hh=CELL; }
          ctx.fillRect(hx, hy, hw, hh);
          ctx.strokeRect(hx, hy, hw, hh);
        } else if (this.tool === 7) {
          let hx, hy, hw, hh;
          if (this.rotation === 0) { hx=x; hy=y+CELL-8; hw=CELL; hh=8; }
          else if (this.rotation === 1) { hx=x+CELL-8; hy=y; hw=8; hh=CELL; }
          else if (this.rotation === 2) { hx=x; hy=y; hw=CELL; hh=8; }
          else { hx=x; hy=y; hw=8; hh=CELL; }
          ctx.fillRect(hx, hy, hw, hh);
          ctx.strokeRect(hx, hy, hw, hh);
        } else {
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeRect(x, y, CELL, CELL);
        }
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
    ctx.textAlign = 'center';
    ctx.fillText(`${this.cols}x${this.rows}  ${Math.round(this.zoom * 100)}%`, CANVAS_WIDTH / 2, 23);
    ctx.textAlign = 'right';
    const block = BLOCK_TYPES[this.tool];
    ctx.fillText(`Tool: ${block.name}`, CANVAS_WIDTH - 20, 23);
    ctx.textAlign = 'left';

    // Direction toggle
    if (ROTATABLE.has(this.tool)) {
      const isConveyor = this.tool === 7;
      const isJT = this.tool === 5;
      let label;
      if (isConveyor) {
        label = ['\u2192 Right', '\u2193 Down', '\u2190 Left', '\u2191 Up'][this.rotation];
      } else if (isJT) {
        label = ['Pass \u2191', 'Pass \u2190', 'Pass \u2193', 'Pass \u2192'][this.rotation];
      } else {
        label = ['Bounce \u2191', 'Bounce \u2190', 'Bounce \u2193', 'Bounce \u2192'][this.rotation];
      }
      const bw = 120, bh = 22;
      const bx = CANVAS_WIDTH / 2 - bw / 2;
      const by = 36;
      ctx.fillStyle = 'rgba(20,20,40,0.8)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u25C0', bx + 14, by + 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(label, CANVAS_WIDTH / 2, by + 16);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('\u25B6', bx + bw - 14, by + 16);
      ctx.textAlign = 'left';
      this._dirToggleRect = { x: bx, y: by, w: bw, h: bh };
    } else {
      this._dirToggleRect = null;
    }
  }

  toMap() {
    let minCol = this.cols, minRow = this.rows, maxCol = 0, maxRow = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== 0) {
          if (c < minCol) minCol = c;
          if (c + 1 > maxCol) maxCol = c + 1;
          if (r < minRow) minRow = r;
          if (r + 1 > maxRow) maxRow = r + 1;
        }
      }
    }

    if (maxCol === 0) {
      minCol = 0; minRow = 0; maxCol = 5; maxRow = 5;
    }

    // Map bounds = exact content bounding box (no extra padding)
    const startCol = minCol;
    const startRow = minRow;
    const endCol = maxCol;
    const endRow = maxRow;

    const mapW = (endCol - startCol) * CELL;
    const mapH = (endRow - startRow) * CELL;
    const offX = startCol * CELL;
    const offY = startRow * CELL;
    const platforms = [];

    // Build platforms from grid
    for (let r = startRow; r < maxRow; r++) {
      let c = startCol;
      while (c < endCol) {
        const rawVal = this.grid[r]?.[c] || 0;
        const type = rawVal & 0xF;
        const rot = (rawVal >> 4) & 3;
        if (type === 0) { c++; continue; }

        if (type === 2) {
          // Trampoline — thin strip, individual
          let tx, ty, tw, th;
          const bx = c * CELL - offX;
          const by = r * CELL - offY;
          if (rot === 0) { tx = bx; ty = by + CELL - 12; tw = CELL; th = 12; }
          else if (rot === 1) { tx = bx + CELL - 12; ty = by; tw = 12; th = CELL; }
          else if (rot === 2) { tx = bx; ty = by; tw = CELL; th = 12; }
          else { tx = bx; ty = by; tw = 12; th = CELL; }
          platforms.push({ x: tx, y: ty, w: tw, h: th, type: 'trampoline', bounceDir: rot });
          c++;
          continue;
        }

        if (type === 7) {
          // Conveyor — thin strip, individual
          let tx, ty, tw, th;
          const bx = c * CELL - offX;
          const by = r * CELL - offY;
          if (rot === 0) { tx = bx; ty = by + CELL - 8; tw = CELL; th = 8; }
          else if (rot === 1) { tx = bx + CELL - 8; ty = by; tw = 8; th = CELL; }
          else if (rot === 2) { tx = bx; ty = by; tw = CELL; th = 8; }
          else { tx = bx; ty = by; tw = 8; th = CELL; }
          platforms.push({ x: tx, y: ty, w: tw, h: th, type: 'conveyor', pushDir: rot });
          c++;
          continue;
        }

        if (type === 5) {
          // Jump-through with rotation
          platforms.push({
            x: c * CELL - offX, y: r * CELL - offY,
            w: CELL, h: CELL,
            type: 'jumpthrough', passDir: rot,
          });
          c++;
          continue;
        }

        if (type === 6) {
          platforms.push({
            x: c * CELL - offX, y: r * CELL - offY,
            w: CELL, h: CELL,
            type: 'jumpthrough', passDir: 0,
          });
          c++;
          continue;
        }

        // Merge adjacent same-type cells horizontally
        const sc = c;
        while (c < endCol && ((this.grid[r]?.[c] || 0) & 0xF) === type) c++;
        const plat = {
          x: sc * CELL - offX,
          y: r * CELL - offY,
          w: (c - sc) * CELL,
          h: CELL,
        };
        if (type !== 1) plat.type = TYPE_NAMES[type];
        if (type === 4) { plat.timer = 0; plat.gone = false; }
        platforms.push(plat);
      }
    }

    const spawns = this._findSpawns(8, startCol, startRow, endCol, endRow, offX, offY, mapW, mapH);

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

  _findSpawns(count, startCol, startRow, endCol, endRow, offX, offY, mapW, mapH) {
    const spots = [];
    for (let c = startCol; c < endCol; c++) {
      for (let r = startRow + 1; r < endRow; r++) {
        const below = (this.grid[r]?.[c] || 0) & 0xF;
        const here = (this.grid[r - 1]?.[c] || 0) & 0xF;
        if (SOLID_GRID_TYPES.has(below) && here === 0) {
          const above = r >= 2 ? ((this.grid[r - 2]?.[c] || 0) & 0xF) : 0;
          if (above === 0) {
            const sx = c * CELL - offX + (CELL - PLAYER_WIDTH) / 2;
            if (sx >= 22 && sx + PLAYER_WIDTH <= mapW - 22) {
              spots.push({ x: sx, y: r * CELL - offY - PLAYER_HEIGHT });
            }
            break;
          }
        }
      }
    }

    if (spots.length === 0) {
      for (let i = 0; i < count; i++) {
        spots.push({
          x: 24 + (mapW - 48) * (i / Math.max(1, count - 1)),
          y: mapH - CELL - PLAYER_HEIGHT,
        });
      }
      return spots;
    }

    const result = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(i * spots.length / count);
      result.push({ x: spots[idx].x, y: spots[idx].y });
    }
    return result;
  }

  generateBoundaries() {
    let minCol = this.cols, minRow = this.rows, maxCol = 0, maxRow = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if ((this.grid[r][c] & 0xF) !== 0) {
          if (c < minCol) minCol = c;
          if (c + 1 > maxCol) maxCol = c + 1;
          if (r < minRow) minRow = r;
          if (r + 1 > maxRow) maxRow = r + 1;
        }
      }
    }
    if (maxCol === 0) return;

    // Place walls and floor OUTSIDE the content (one cell beyond each edge)
    const left = Math.max(0, minCol - 1);
    const right = Math.min(this.cols - 1, maxCol);
    const floorRow = Math.min(maxRow, this.rows - 1);

    // Floor — one row below lowest content, spanning wall to wall
    for (let c = left; c <= right; c++) {
      if (this.grid[floorRow] && (this.grid[floorRow][c] & 0xF) === 0) {
        this.grid[floorRow][c] = 1;
      }
    }

    // Left wall — one column left of content, from top to floor
    for (let r = minRow; r <= floorRow; r++) {
      if (this.grid[r] && (this.grid[r][left] & 0xF) === 0) {
        this.grid[r][left] = 1;
      }
    }

    // Right wall — one column right of content, from top to floor
    for (let r = minRow; r <= floorRow; r++) {
      if (this.grid[r] && (this.grid[r][right] & 0xF) === 0) {
        this.grid[r][right] = 1;
      }
    }
  }

  save() {
    // Binary format: version 255, cols, rows, RLE pairs [value, count]
    const bytes = [];
    const raw = [];
    raw.push(255); // version marker
    raw.push(this.cols);
    raw.push(this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        raw.push(this.grid[r][c]);
      }
    }
    // RLE compress
    let i = 0;
    while (i < raw.length) {
      const val = raw[i];
      let count = 1;
      while (i + count < raw.length && raw[i + count] === val && count < 255) count++;
      bytes.push(val, count);
      i += count;
    }
    return btoa(String.fromCharCode(...bytes));
  }

  load(code) {
    try {
      const binary = atob(code.trim());
      const data = [];
      for (let i = 0; i < binary.length; i++) data.push(binary.charCodeAt(i));

      if (data[0] === 255) {
        // New binary format
        // Decompress RLE
        const decompressed = [];
        let i = 0;
        while (i < data.length - 1) {
          const val = data[i];
          const count = data[i + 1];
          for (let j = 0; j < count; j++) decompressed.push(val);
          i += 2;
        }
        // First 3 bytes: version, cols, rows
        this.cols = Math.max(MIN_COLS, Math.min(MAX_COLS, decompressed[1]));
        this.rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, decompressed[2]));
        this.grid = this.makeGrid();
        let idx = 3;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (idx < decompressed.length) this.grid[r][c] = decompressed[idx++];
          }
        }
      } else {
        // Old text format
        const raw = binary;
        const [header, body] = raw.split(';');
        const [colsStr, rowsStr] = header.split('x');
        this.cols = Math.max(MIN_COLS, Math.min(MAX_COLS, parseInt(colsStr)));
        this.rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, parseInt(rowsStr)));
        this.grid = this.makeGrid();
        if (body) {
          const rowStrs = body.split('|');
          for (let r = 0; r < rowStrs.length && r < this.rows; r++) {
            const rle = rowStrs[r];
            let c = 0, i = 0;
            while (i < rle.length && c < this.cols) {
              let numStr = '';
              while (i < rle.length && rle[i] >= '1' && rle[i] <= '9' && numStr.length < 3) {
                numStr += rle[i]; i++;
              }
              if (i < rle.length) {
                const val = parseInt(rle[i]); i++;
                if (val >= 0 && val <= 6) {
                  const count = numStr ? parseInt(numStr) : 1;
                  for (let j = 0; j < count && c < this.cols; j++) {
                    this.grid[r][c] = val; c++;
                  }
                }
              }
            }
          }
        }
      }
      this._clampCamera();
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
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}

export { PALETTE_TYPES, ROTATABLE };
