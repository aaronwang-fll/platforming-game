import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const CELL = 32;
const DEFAULT_COLS = 62;
const DEFAULT_ROWS = 37;
const MIN_COLS = 20;  // 640px
const MIN_ROWS = 15;  // 480px
const MAX_COLS = 100; // 3200px
const MAX_ROWS = 60;  // 1920px

// Block types: 0=empty, 1=solid, 2=trampoline, 3=dash_block, 4=crumble, 5=jumpthrough, 6=oneway(hidden), 7=conveyor
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

// Palette types (what appears in the editor toolbar) — One-Way removed, Conveyor shifted to Shift+7
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

const ROTATABLE = new Set([2, 5, 7]); // trampoline, jump-through, and conveyor support rotation
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
    this.toolbarPos = 'bottom';
    // Start camera at bottom-left
    this.camX = 0;
    this.camY = Math.max(0, this.rows * CELL - CANVAS_HEIGHT);
    this.mouseX = -1;
    this.mouseY = -1;
    this.painting = false;
    this._panning = false;
    this._paintingAs = 0;
    this.keysDown = {};
    this.testing = false;

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

  // Resize grid, preserving existing content
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

    // Copy existing data
    const copyRows = Math.min(oldRows, newRows);
    const copyCols = Math.min(oldCols, newCols);
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        this.grid[r][c] = oldGrid[r][c];
      }
    }

    // Clamp camera
    this._clampCamera();
  }

  get minCols() { return MIN_COLS; }
  get maxCols() { return MAX_COLS; }
  get minRows() { return MIN_ROWS; }
  get maxRows() { return MAX_ROWS; }

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
    return { col: Math.floor(cx / CELL), row: Math.floor(cy / CELL) };
  }

  _handleMouseDown(e) {
    if (this.testing) return;
    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (e.button === 2) {
      // Right-click drag = pan camera
      this._panning = true;
      this._panStartX = e.clientX;
      this._panStartY = e.clientY;
      this._panStartCamX = this.camX;
      this._panStartCamY = this.camY;
    } else if (e.button === 0) {
      if (e.shiftKey) {
        // Shift+click = erase
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
    if (ROTATABLE.has(type)) {
      return type | (this.rotation << 4);
    }
    return type;
  }

  _handleMouseMove(e) {
    const s = this._getCanvasScale();
    this.mouseX = (e.clientX - s.left) * s.scaleX;
    this.mouseY = (e.clientY - s.top) * s.scaleY;
    if (this.testing) return;
    if (this._panning) {
      this.camX = this._panStartCamX - (e.clientX - this._panStartX) * s.scaleX;
      this.camY = this._panStartCamY - (e.clientY - this._panStartY) * s.scaleY;
      this._clampCamera();
      return;
    }
    const { col, row } = this._mouseToGrid(e.clientX, e.clientY);
    if (this.painting) this._paintCell(col, row, this._paintingAs);
  }

  _handleMouseUp() {
    this.painting = false;
    this._panning = false;
  }

  _handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Shift+T/S work in both edit and test mode
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
    // Shift+1-7 to select tools from palette
    if (e.shiftKey) {
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= PALETTE_TYPES.length) {
        this.setTool(PALETTE_TYPES[digit - 1].id);
        e.preventDefault();
      }
    }
    // R to cycle rotation (only for rotatable tools)
    if (e.code === 'KeyR' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (ROTATABLE.has(this.tool)) {
        this.rotation = (this.rotation + 1) & 3;
        e.preventDefault();
      }
    }
    // T to cycle toolbar position
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
    // Reset rotation when switching to non-rotatable tool
    if (!ROTATABLE.has(type)) {
      this.rotation = 0;
    }
    const tools = document.querySelectorAll('.editor-tool-btn');
    // Find which palette index matches this type
    const paletteIdx = PALETTE_TYPES.findIndex(pt => pt.id === type);
    tools.forEach((el, i) => el.classList.toggle('active', i === paletteIdx));
  }

  _clampCamera() {
    const mapW = this.cols * CELL;
    const mapH = this.rows * CELL;
    this.camX = Math.max(0, Math.min(this.camX, Math.max(0, mapW - CANVAS_WIDTH)));
    this.camY = Math.max(0, Math.min(this.camY, Math.max(0, mapH - CANVAS_HEIGHT)));
  }

  updateCamera() {
    if (this.testing) return;
    const speed = 8;
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
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    const startCol = Math.floor(this.camX / CELL);
    const endCol = Math.min(this.cols, Math.ceil((this.camX + CANVAS_WIDTH) / CELL) + 1);
    const startRow = Math.floor(this.camY / CELL);
    const endRow = Math.min(this.rows, Math.ceil((this.camY + CANVAS_HEIGHT) / CELL) + 1);

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
          // Trampoline with rotation — thin strip
          ctx.fillStyle = block.color;
          if (rot === 0) {
            ctx.fillRect(x, y + CELL - 12, CELL, 12);
          } else if (rot === 1) {
            ctx.fillRect(x + CELL - 12, y, 12, CELL);
          } else if (rot === 2) {
            ctx.fillRect(x, y, CELL, 12);
          } else {
            ctx.fillRect(x, y, 12, CELL);
          }
        } else if (type === 7) {
          // Conveyor — thin strip with animated dashes
          ctx.fillStyle = block.color;
          let sx, sy, sw, sh;
          if (rot === 0) { sx = x; sy = y + CELL - 8; sw = CELL; sh = 8; }
          else if (rot === 1) { sx = x + CELL - 8; sy = y; sw = 8; sh = CELL; }
          else if (rot === 2) { sx = x; sy = y; sw = CELL; sh = 8; }
          else { sx = x; sy = y; sw = 8; sh = CELL; }
          ctx.fillRect(sx, sy, sw, sh);
          // Animated scrolling dashes
          const t = (Date.now() * 0.06) % 12;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          if (rot === 0 || rot === 2) {
            const sign = (rot === 0) ? 1 : -1;
            for (let dx = -12 + t * sign; dx < sw + 12; dx += 12) {
              const drawX = sx + dx;
              if (drawX >= sx && drawX + 5 <= sx + sw) {
                ctx.fillRect(drawX, sy + sh / 2 - 1, 5, 2);
              }
            }
          } else {
            const sign = (rot === 1) ? 1 : -1;
            for (let dy = -12 + t * sign; dy < sh + 12; dy += 12) {
              const drawY = sy + dy;
              if (drawY >= sy && drawY + 5 <= sy + sh) {
                ctx.fillRect(sx + sw / 2 - 1, drawY, 2, 5);
              }
            }
          }
        } else if (type === 5) {
          // Jump-Through — full block, semi-transparent with solid line on landing side based on rotation
          ctx.fillStyle = block.color;
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.globalAlpha = 1;
          ctx.fillStyle = block.color;
          if (rot === 0) {
            ctx.fillRect(x, y, CELL, 3); // solid top
          } else if (rot === 1) {
            ctx.fillRect(x + CELL - 3, y, 3, CELL); // solid right
          } else if (rot === 2) {
            ctx.fillRect(x, y + CELL - 3, CELL, 3); // solid bottom
          } else {
            ctx.fillRect(x, y, 3, CELL); // solid left
          }
        } else if (type === 6) {
          // One-Way (legacy) — semi-transparent with solid top
          ctx.fillStyle = block.color;
          ctx.globalAlpha = 0.5;
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
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, mapW, mapH);

    // Hover highlight
    if (!this.testing && this.mouseX >= 0 && this.mouseY >= 0) {
      const hCol = Math.floor((this.mouseX + this.camX) / CELL);
      const hRow = Math.floor((this.mouseY + this.camY) / CELL);
      if (hCol >= 0 && hCol < this.cols && hRow >= 0 && hRow < this.rows) {
        const hx0 = hCol * CELL;
        const hy0 = hRow * CELL;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;

        if (this.tool === 2) {
          // Trampoline — thin strip preview
          let hx, hy, hw, hh;
          if (this.rotation === 0) { hx=hx0; hy=hy0+CELL-12; hw=CELL; hh=12; }
          else if (this.rotation === 1) { hx=hx0+CELL-12; hy=hy0; hw=12; hh=CELL; }
          else if (this.rotation === 2) { hx=hx0; hy=hy0; hw=CELL; hh=12; }
          else { hx=hx0; hy=hy0; hw=12; hh=CELL; }
          ctx.fillRect(hx, hy, hw, hh);
          ctx.strokeRect(hx, hy, hw, hh);
        } else if (this.tool === 7) {
          // Conveyor — thin strip preview
          let hx, hy, hw, hh;
          if (this.rotation === 0) { hx=hx0; hy=hy0+CELL-8; hw=CELL; hh=8; }
          else if (this.rotation === 1) { hx=hx0+CELL-8; hy=hy0; hw=8; hh=CELL; }
          else if (this.rotation === 2) { hx=hx0; hy=hy0; hw=CELL; hh=8; }
          else { hx=hx0; hy=hy0; hw=8; hh=CELL; }
          ctx.fillRect(hx, hy, hw, hh);
          ctx.strokeRect(hx, hy, hw, hh);
        } else {
          // Normal full-cell highlight
          ctx.fillRect(hx0, hy0, CELL, CELL);
          ctx.strokeRect(hx0, hy0, CELL, CELL);
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
    ctx.fillText(`${this.cols}x${this.rows}`, CANVAS_WIDTH / 2, 23);
    ctx.textAlign = 'right';
    const block = BLOCK_TYPES[this.tool];
    let toolInfo = `Tool: ${block.name}`;
    if (ROTATABLE.has(this.tool)) {
      const dirNames = this.tool === 7
        ? ['Push \u2192', 'Push \u2193', 'Push \u2190', 'Push \u2191']
        : ['Bounce \u2191', 'Bounce \u2190', 'Bounce \u2193', 'Bounce \u2192'];
      toolInfo += ` [R: ${dirNames[this.rotation]}]`;
    }
    ctx.fillText(toolInfo, CANVAS_WIDTH - 20, 23);
    ctx.textAlign = 'left';
  }

  toMap() {
    // Find bounding box of all placed blocks
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

    // No blocks placed — make a tiny default map
    if (maxCol === 0) {
      minCol = 0; minRow = 0; maxCol = 5; maxRow = 5;
    }

    // Pad: 1 col each side for walls, 20 rows above for sky + ceiling, 1 row below for floor
    const startCol = Math.max(0, minCol - 1);
    const startRow = minRow - 21; // can go negative — that's fine, we offset everything
    const endCol = Math.min(this.cols, maxCol + 1);
    const endRow = maxRow + 1; // +1 for auto floor

    const mapW = (endCol - startCol) * CELL;
    const mapH = (endRow - startRow) * CELL;
    const offX = startCol * CELL;
    const offY = startRow * CELL;
    const platforms = [];

    // Visible ceiling at top (row 0 of the map = 20 rows above topmost block)
    platforms.push({ x: 0, y: 0, w: mapW, h: CELL });

    // Visible side walls (full height from ceiling to floor)
    platforms.push({ x: 0, y: 0, w: 20, h: mapH });
    platforms.push({ x: mapW - 20, y: 0, w: 20, h: mapH });

    // Visible floor at bottom
    platforms.push({ x: 0, y: mapH - CELL, w: mapW, h: CELL });

    // Merge adjacent same-type horizontal cells into platforms
    // Trampolines and conveyors are NOT merged — each cell is its own platform
    for (let r = startRow; r < maxRow; r++) {
      let c = startCol;
      while (c < endCol) {
        const rawVal = this.grid[r]?.[c] || 0;
        const type = rawVal & 0xF;
        const rot = (rawVal >> 4) & 3;
        if (type === 0) { c++; continue; }

        if (type === 2) {
          // Trampoline — each cell is its own platform
          let tx, ty, tw, th;
          const bx = c * CELL - offX;
          const by = r * CELL - offY;
          if (rot === 0) { tx = bx; ty = by + CELL - 12; tw = CELL; th = 12; }
          else if (rot === 1) { tx = bx + CELL - 12; ty = by; tw = 12; th = CELL; }
          else if (rot === 2) { tx = bx; ty = by; tw = CELL; th = 12; }
          else { tx = bx; ty = by; tw = 12; th = CELL; }

          // bounceDir: 0=up, 1=left, 2=down, 3=right
          const bounceDir = rot; // rot 0->up(0), 1->left(1), 2->down(2), 3->right(3)
          platforms.push({
            x: tx, y: ty, w: tw, h: th,
            type: 'trampoline',
            bounceDir,
          });
          c++;
          continue;
        }

        if (type === 7) {
          // Conveyor — thin strip, each cell is its own platform
          const bx = c * CELL - offX;
          const by = r * CELL - offY;
          let tx, ty, tw, th;
          if (rot === 0) { tx = bx; ty = by + CELL - 8; tw = CELL; th = 8; }
          else if (rot === 1) { tx = bx + CELL - 8; ty = by; tw = 8; th = CELL; }
          else if (rot === 2) { tx = bx; ty = by; tw = CELL; th = 8; }
          else { tx = bx; ty = by; tw = 8; th = CELL; }

          platforms.push({
            x: tx, y: ty, w: tw, h: th,
            type: 'conveyor',
            pushDir: rot, // 0=right, 1=down, 2=left, 3=up
          });
          c++;
          continue;
        }

        if (type === 5) {
          // Jump-through — full 32x32 block, each cell separate (rotation matters)
          platforms.push({
            x: c * CELL - offX,
            y: r * CELL - offY,
            w: CELL, h: CELL,
            type: 'jumpthrough',
            passDir: rot, // 0=from below, 1=from left, 2=from above, 3=from right
          });
          c++;
          continue;
        }

        if (type === 6) {
          // One-Way (legacy) — treat as jumpthrough with passDir 0
          platforms.push({
            x: c * CELL - offX,
            y: r * CELL - offY,
            w: CELL, h: CELL,
            type: 'jumpthrough',
            passDir: 0,
          });
          c++;
          continue;
        }

        // Normal merging for other types
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

    // Fill dead space below blocks down to the floor
    const floorRow = endRow - 1;
    const fillGrid = [];
    for (let c = startCol; c < endCol; c++) {
      let lowestBlock = -1;
      for (let r = maxRow - 1; r >= Math.max(0, minRow); r--) {
        if ((this.grid[r]?.[c] || 0) !== 0) {
          lowestBlock = r;
          break;
        }
      }
      if (lowestBlock >= 0) {
        for (let r = lowestBlock + 1; r < floorRow; r++) {
          if (!fillGrid[r]) fillGrid[r] = {};
          fillGrid[r][c] = true;
        }
      }
    }

    for (let c = startCol; c < endCol; c++) {
      let hasBlock = false;
      for (let r = Math.max(0, minRow); r < maxRow; r++) {
        if ((this.grid[r]?.[c] || 0) !== 0) { hasBlock = true; break; }
      }
      if (!hasBlock) {
        for (let r = floorRow - 1; r >= 0; r--) {
          if (fillGrid[r]?.[c]) delete fillGrid[r][c];
        }
      }
    }

    for (let r = 0; r < floorRow; r++) {
      if (!fillGrid[r]) continue;
      let c = startCol;
      while (c < endCol) {
        if (!fillGrid[r][c]) { c++; continue; }
        const sc = c;
        while (c < endCol && fillGrid[r][c]) c++;
        platforms.push({
          x: sc * CELL - offX,
          y: r * CELL - offY,
          w: (c - sc) * CELL,
          h: CELL,
        });
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
    const SOLID_TYPES = new Set([1, 3, 4, 7]);
    const spots = [];

    for (let c = startCol; c < endCol; c++) {
      for (let r = startRow + 1; r < endRow; r++) {
        const below = (this.grid[r]?.[c] || 0) & 0xF;
        const here = (this.grid[r - 1]?.[c] || 0) & 0xF;
        if (SOLID_TYPES.has(below) && here === 0) {
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

  save() {
    // New binary format: version byte 255, cols, rows, then RLE pairs [value, count]
    const bytes = [255, this.cols, this.rows];
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const val = this.grid[r][c];
        let count = 1;
        while (c + count < this.cols && this.grid[r][c + count] === val && count < 255) count++;
        bytes.push(val, count);
        c += count;
      }
    }
    // Convert to base64
    const arr = new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  load(code) {
    try {
      const raw = atob(code.trim());
      // Detect format: new binary starts with byte 255
      if (raw.charCodeAt(0) === 255) {
        return this._loadBinary(raw);
      }
      return this._loadLegacy(raw);
    } catch (e) {
      console.error('Failed to load level code:', e);
      return false;
    }
  }

  _loadBinary(raw) {
    const cols = raw.charCodeAt(1);
    const rows = raw.charCodeAt(2);
    this.cols = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
    this.rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows));
    this.grid = this.makeGrid();

    let r = 0, c = 0;
    let i = 3;
    while (i + 1 < raw.length && r < this.rows) {
      const val = raw.charCodeAt(i);
      const count = raw.charCodeAt(i + 1);
      i += 2;
      for (let j = 0; j < count && r < this.rows; j++) {
        if (c < this.cols) {
          this.grid[r][c] = val;
        }
        c++;
        if (c >= cols) { c = 0; r++; }
      }
    }
    this._clampCamera();
    return true;
  }

  _loadLegacy(raw) {
    const [header, body] = raw.split(';');
    const [colsStr, rowsStr] = header.split('x');
    this.cols = Math.max(MIN_COLS, Math.min(MAX_COLS, parseInt(colsStr)));
    this.rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, parseInt(rowsStr)));
    this.grid = this.makeGrid();

    if (!body) return true;
    const rowStrs = body.split('|');
    for (let r = 0; r < rowStrs.length && r < this.rows; r++) {
      const rle = rowStrs[r];
      let c = 0;
      let i = 0;
      while (i < rle.length && c < this.cols) {
        let numStr = '';
        while (i < rle.length && rle[i] >= '1' && rle[i] <= '9' && (numStr + rle[i]).length < 4) {
          numStr += rle[i];
          i++;
        }
        if (i < rle.length) {
          const val = parseInt(rle[i]);
          i++;
          if (val >= 0 && val <= 7) {
            const count = numStr ? parseInt(numStr) : 1;
            for (let j = 0; j < count && c < this.cols; j++) {
              this.grid[r][c] = val;
              c++;
            }
          }
        }
      }
    }
    this._clampCamera();
    return true;
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

// Exported for main.js palette building
export { PALETTE_TYPES, ROTATABLE };
