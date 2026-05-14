import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from '/shared/constants.js';

const CELL = 32;
const DEFAULT_COLS = 62;
const DEFAULT_ROWS = 37;
const MIN_COLS = 20;  // 640px
const MIN_ROWS = 15;  // 480px
const MAX_COLS = 100; // 3200px
const MAX_ROWS = 60;  // 1920px

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
    this.tool = 1;
    this.camX = 0;
    this.camY = 0;
    this.mouseX = -1;
    this.mouseY = -1;
    this.painting = false;
    this.erasing = false;
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
      this.erasing = true;
      this._paintCell(col, row, 0);
    } else if (e.button === 0) {
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

  _handleMouseUp() {
    this.painting = false;
    this.erasing = false;
  }

  _handleKeyDown(e) {
    if (this.testing) return;
    this.keysDown[e.code] = true;
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
    const tools = document.querySelectorAll('.editor-tool-btn');
    tools.forEach((el, i) => el.classList.toggle('active', i === type));
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
        const type = this.grid[r][c];
        if (type === 0) continue;
        const block = BLOCK_TYPES[type];
        const x = c * CELL;
        const y = r * CELL;

        if (type === 2) {
          ctx.fillStyle = block.color;
          ctx.fillRect(x, y + CELL - 12, CELL, 12);
        } else if (type === 5 || type === 6) {
          // Jumpthrough / oneway — semi-transparent with solid top
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
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(hCol * CELL, hRow * CELL, CELL, CELL);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
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
    ctx.textAlign = 'center';
    ctx.fillText(`${this.cols}x${this.rows}`, CANVAS_WIDTH / 2, 23);
    ctx.textAlign = 'right';
    const block = BLOCK_TYPES[this.tool];
    ctx.fillText(`Tool: ${block.name} [${block.key}]`, CANVAS_WIDTH - 20, 23);
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
    // Coordinates are offset so the map starts at (0,0)
    for (let r = startRow; r < maxRow; r++) {
      let c = startCol;
      while (c < endCol) {
        const type = this.grid[r]?.[c] || 0;
        if (type === 0) { c++; continue; }

        if (type === 2) {
          let sc = c;
          while (c < endCol && (this.grid[r]?.[c] || 0) === 2) c++;
          const cellCount = c - sc;
          for (let i = 0; i < cellCount; i += 2) {
            const tw = Math.min(2, cellCount - i) * CELL;
            platforms.push({
              x: (sc + i) * CELL - offX,
              y: r * CELL - offY + CELL - 12,
              w: tw, h: 12,
              type: 'trampoline',
            });
          }
          continue;
        }

        const sc = c;
        while (c < endCol && (this.grid[r]?.[c] || 0) === type) c++;
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
    // For each column, find lowest block and fill below it with solid
    // Open columns (no blocks) get no fill, leaving a 1-row gap under neighboring fills
    const floorRow = endRow - 1; // the auto-floor row
    const fillGrid = []; // track which cells to fill
    for (let c = startCol; c < endCol; c++) {
      // Find lowest non-empty cell in this column
      let lowestBlock = -1;
      for (let r = maxRow - 1; r >= Math.max(0, minRow); r--) {
        if ((this.grid[r]?.[c] || 0) !== 0) {
          lowestBlock = r;
          break;
        }
      }
      if (lowestBlock >= 0) {
        // Fill from lowestBlock+1 down to floorRow-1 (above the auto-floor)
        for (let r = lowestBlock + 1; r < floorRow; r++) {
          if (!fillGrid[r]) fillGrid[r] = {};
          fillGrid[r][c] = true;
        }
      }
    }

    // For open columns next to filled columns, remove the bottom fill row (1-row gap)
    for (let c = startCol; c < endCol; c++) {
      let hasBlock = false;
      for (let r = Math.max(0, minRow); r < maxRow; r++) {
        if ((this.grid[r]?.[c] || 0) !== 0) { hasBlock = true; break; }
      }
      if (!hasBlock) {
        // This is an open column — remove fill in adjacent columns' lowest row
        // to leave a gap for passage
        for (let r = floorRow - 1; r >= 0; r--) {
          if (fillGrid[r]?.[c]) delete fillGrid[r][c];
        }
      }
    }

    // Merge fill cells into platforms (horizontal runs of solid)
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

    // Find spawn points (pass offset info)
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
    const SOLID_TYPES = new Set([1, 3, 4]);
    const spots = [];

    for (let c = startCol; c < endCol; c++) {
      for (let r = startRow + 1; r < endRow; r++) {
        const below = this.grid[r]?.[c] || 0;
        const here = this.grid[r - 1]?.[c] || 0;
        if (SOLID_TYPES.has(below) && here === 0) {
          const above = r >= 2 ? (this.grid[r - 2]?.[c] || 0) : 0;
          if (above === 0) {
            const sx = c * CELL - offX + (CELL - PLAYER_WIDTH) / 2;
            // Ensure spawn is past the 20px boundary walls
            if (sx >= 22 && sx + PLAYER_WIDTH <= mapW - 22) {
              spots.push({ x: sx, y: r * CELL - offY - PLAYER_HEIGHT });
            }
            break;
          }
        }
      }
    }

    // Fallback: spawn on the auto-floor at the bottom
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
    let rowStrs = [];
    for (let r = 0; r < this.rows; r++) {
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
    // Trim trailing all-zero rows
    while (rowStrs.length > 0) {
      const last = rowStrs[rowStrs.length - 1];
      // Check if row is all zeros by parsing the RLE
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
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
