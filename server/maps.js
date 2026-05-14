// Connected-structure map design
// Platforms form rooms, corridors, L-shapes, and U-shapes
// Walls connect horizontal platforms — no floating isolated platforms
// All platforms 32px tall, walls 32px wide, trampolines 64x12
// Player 26x26, jump ~114px, double jump adds ~86px (total ~200px)
// Wall heights 128-192px (climbable with double jump)
// Speed pads 300-400px wide
// Crumble bridges 96-128px wide
// Jumpthrough platforms always have a surface below to jump from

export const maps = {
  playground: {
    name: 'Playground',
    width: 1600,
    height: 900,
    bg: '#7EC8E3',
    theme: 'sky',
    platforms: [
      // ============================================================
      // FLOOR — continuous ground, no death pits
      // ============================================================
      { x: 0, y: 868, w: 1600, h: 32 },

      // ============================================================
      // LEFT ROOM — U-shape (x: 32–384)
      // Floor at y:740, walls rising to y:580
      // Open top, entry gap on right wall
      // ============================================================
      // Left room floor
      { x: 32, y: 740, w: 352, h: 32 },
      // Left wall (full height)
      { x: 32, y: 580, w: 32, h: 160 },
      // Right wall — UPPER portion only (gap at bottom for entry)
      { x: 352, y: 580, w: 32, h: 96 },
      // Jumpthrough inside U-shape (can jump up from room floor at 740)
      { x: 96, y: 644, w: 224, h: 32, type: 'jumpthrough' },
      // Small shelf on left wall interior
      { x: 64, y: 580, w: 128, h: 32 },

      // ============================================================
      // LEFT-TO-CENTER CORRIDOR (x: 384–640)
      // Connects left room to center room at mid-height
      // ============================================================
      // Corridor floor
      { x: 384, y: 740, w: 256, h: 32 },
      // Crumble shortcut above corridor
      { x: 416, y: 644, w: 128, h: 32, type: 'crumble' },
      // Trampoline on corridor floor
      { x: 480, y: 728, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // CENTER ROOM — large room with walls (x: 608–1024)
      // Floor at y:740, walls to y:548 (192px tall)
      // Gaps in walls for entries: bottom-left, bottom-right, top openings
      // ============================================================
      // Center room floor
      { x: 608, y: 740, w: 416, h: 32 },
      // Left wall — upper section (gap at bottom, 64px gap for entry)
      { x: 608, y: 548, w: 32, h: 128 },
      // Right wall — upper section (gap at bottom for entry)
      { x: 992, y: 548, w: 32, h: 128 },
      // Center room ceiling/upper platform
      { x: 608, y: 548, w: 416, h: 32 },
      // Speed pad inside center room (on room floor)
      { x: 672, y: 708, w: 320, h: 32, type: 'dash_block' },
      // Jumpthrough mid-level inside room (above speed pad, below ceiling)
      { x: 672, y: 628, w: 288, h: 32, type: 'jumpthrough' },

      // ============================================================
      // CENTER-TO-RIGHT CORRIDOR (x: 1024–1216)
      // ============================================================
      // Corridor floor
      { x: 1024, y: 740, w: 192, h: 32 },
      // Crumble bridge at upper level
      { x: 1056, y: 580, w: 128, h: 32, type: 'crumble' },

      // ============================================================
      // RIGHT ROOM — L-shape (x: 1184–1568)
      // Horizontal base + vertical wall forming an L
      // ============================================================
      // Right room base floor
      { x: 1184, y: 740, w: 384, h: 32 },
      // Right outer wall (full height)
      { x: 1536, y: 548, w: 32, h: 192 },
      // Right room upper shelf (forms the L top)
      { x: 1312, y: 548, w: 256, h: 32 },
      // Interior wall stub (creates sub-room)
      { x: 1312, y: 612, w: 32, h: 128 },
      // Jumpthrough inside L-shape
      { x: 1216, y: 644, w: 224, h: 32, type: 'jumpthrough' },

      // ============================================================
      // UPPER LEVEL — stepping stones and oneway platforms
      // (x: various, y: 420–460 range)
      // ============================================================
      // Above left room
      { x: 64, y: 452, w: 128, h: 32 },
      // Stepping stone left-center
      { x: 256, y: 420, w: 96, h: 32 },
      // Oneway over center room
      { x: 544, y: 420, w: 160, h: 32, type: 'oneway' },
      // Stepping stone center
      { x: 784, y: 388, w: 96, h: 32 },
      // Oneway over right area
      { x: 960, y: 420, w: 160, h: 32, type: 'oneway' },
      // Above right room
      { x: 1216, y: 420, w: 128, h: 32 },
      // Top perch
      { x: 1408, y: 388, w: 96, h: 32 },

      // ============================================================
      // GROUND LEVEL FEATURES
      // ============================================================
      // Speed pad on ground (left area)
      { x: 64, y: 836, w: 320, h: 32, type: 'dash_block' },
      // Speed pad on ground (right area)
      { x: 1216, y: 836, w: 320, h: 32, type: 'dash_block' },
      // Trampoline left ground
      { x: 32, y: 856, w: 64, h: 12, type: 'trampoline' },
      // Trampoline right ground
      { x: 1504, y: 856, w: 64, h: 12, type: 'trampoline' },
      // Trampoline center ground
      { x: 768, y: 856, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 900 },
      { x: 1580, y: 0, w: 20, h: 900 },
    ],
    spawns: [
      { x: 100, y: 828 }, { x: 260, y: 828 }, { x: 440, y: 828 },
      { x: 640, y: 828 }, { x: 840, y: 828 }, { x: 1060, y: 828 },
      { x: 1280, y: 828 }, { x: 1460, y: 828 },
    ],
  },

  rooftops: {
    name: 'Rooftops',
    width: 1800,
    height: 1000,
    bg: '#0d1b2a',
    theme: 'rooftops',
    platforms: [
      // ============================================================
      // FLOOR — continuous ground
      // ============================================================
      { x: 0, y: 968, w: 1800, h: 32 },

      // ============================================================
      // BUILDING 1 — tall left building (x: 32–320)
      // Roof at y:620, two internal floors
      // ============================================================
      // Roof
      { x: 32, y: 620, w: 288, h: 32 },
      // Left wall
      { x: 32, y: 620, w: 32, h: 348 },
      // Right wall — gap at bottom for ground entry (128px gap)
      { x: 288, y: 620, w: 32, h: 192 },
      // Internal floor 1 (fire escape / jumpthrough)
      { x: 64, y: 780, w: 224, h: 32, type: 'jumpthrough' },
      // Internal floor 2 (jumpthrough)
      { x: 96, y: 700, w: 192, h: 32, type: 'jumpthrough' },
      // Speed pad on roof
      { x: 32, y: 588, w: 288, h: 32, type: 'dash_block' },

      // ============================================================
      // CORRIDOR 1→2 — skybridge (x: 320–544)
      // ============================================================
      // Bridge floor
      { x: 320, y: 780, w: 224, h: 32 },
      // Bridge walls (short, chest height)
      { x: 320, y: 716, w: 32, h: 64 },
      { x: 512, y: 716, w: 32, h: 64 },
      // Crumble shortcut above bridge
      { x: 368, y: 684, w: 128, h: 32, type: 'crumble' },

      // ============================================================
      // BUILDING 2 — wide center-left building (x: 512–864)
      // Roof at y:700, one internal floor
      // ============================================================
      // Roof
      { x: 512, y: 700, w: 352, h: 32 },
      // Left wall (gap at top for corridor entry)
      { x: 512, y: 780, w: 32, h: 188 },
      // Right wall — upper portion only
      { x: 832, y: 700, w: 32, h: 128 },
      // Internal jumpthrough
      { x: 544, y: 844, w: 288, h: 32, type: 'jumpthrough' },
      // Fire escape platforms (exterior right side)
      { x: 864, y: 844, w: 96, h: 32 },
      { x: 864, y: 780, w: 96, h: 32 },

      // ============================================================
      // CORRIDOR 2→3 — chase corridor at ground level (x: 864–1088)
      // ============================================================
      // Corridor ceiling
      { x: 864, y: 844, w: 224, h: 32 },
      // Speed pad on ground in corridor
      { x: 896, y: 936, w: 320, h: 32, type: 'dash_block' },

      // ============================================================
      // BUILDING 3 — center-right building (x: 1056–1376)
      // Roof at y:652, tallest building
      // ============================================================
      // Roof
      { x: 1056, y: 652, w: 320, h: 32 },
      // Left wall
      { x: 1056, y: 652, w: 32, h: 316 },
      // Right wall — gap in middle for entry (64px gap)
      { x: 1344, y: 652, w: 32, h: 128 },
      { x: 1344, y: 876, w: 32, h: 92 },
      // Internal floor (jumpthrough)
      { x: 1088, y: 812, w: 256, h: 32, type: 'jumpthrough' },
      // Internal shelf
      { x: 1088, y: 732, w: 160, h: 32 },
      // Speed pad on roof
      { x: 1088, y: 620, w: 288, h: 32, type: 'dash_block' },

      // ============================================================
      // CORRIDOR 3→4 — elevated bridge (x: 1376–1504)
      // ============================================================
      { x: 1376, y: 780, w: 128, h: 32 },
      // Crumble shortcut at roof level
      { x: 1376, y: 652, w: 128, h: 32, type: 'crumble' },

      // ============================================================
      // BUILDING 4 — right building (x: 1472–1768)
      // Roof at y:732
      // ============================================================
      // Roof
      { x: 1472, y: 732, w: 296, h: 32 },
      // Left wall — partial
      { x: 1472, y: 732, w: 32, h: 128 },
      // Right wall
      { x: 1736, y: 732, w: 32, h: 236 },
      // Internal jumpthrough
      { x: 1504, y: 844, w: 232, h: 32, type: 'jumpthrough' },
      // Speed pad on roof
      { x: 1472, y: 700, w: 296, h: 32, type: 'dash_block' },

      // ============================================================
      // UPPER ROOFTOP PLATFORMS — above buildings
      // ============================================================
      // Above building 1
      { x: 96, y: 500, w: 128, h: 32 },
      // Stepping stone
      { x: 320, y: 480, w: 96, h: 32 },
      // Above corridor 1-2
      { x: 480, y: 540, w: 128, h: 32, type: 'oneway' },
      // Above building 2
      { x: 640, y: 500, w: 128, h: 32 },
      // Central high platform
      { x: 864, y: 460, w: 160, h: 32 },
      // Above building 3
      { x: 1120, y: 500, w: 128, h: 32, type: 'oneway' },
      // Stepping stones right
      { x: 1376, y: 520, w: 96, h: 32 },
      // Above building 4
      { x: 1536, y: 540, w: 128, h: 32 },

      // ============================================================
      // TOP LEVEL — sky platforms
      // ============================================================
      { x: 256, y: 360, w: 128, h: 32 },
      { x: 576, y: 340, w: 128, h: 32 },
      { x: 896, y: 320, w: 128, h: 32 },
      { x: 1216, y: 340, w: 128, h: 32 },
      { x: 1536, y: 380, w: 128, h: 32 },

      // ============================================================
      // TRAMPOLINES
      // ============================================================
      { x: 160, y: 956, w: 64, h: 12, type: 'trampoline' },
      { x: 720, y: 956, w: 64, h: 12, type: 'trampoline' },
      { x: 1440, y: 956, w: 64, h: 12, type: 'trampoline' },
      { x: 384, y: 748, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // PILLARS for wall-jumping
      // ============================================================
      { x: 448, y: 844, w: 32, h: 124 },
      { x: 1000, y: 780, w: 32, h: 188 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1000 },
      { x: 1780, y: 0, w: 20, h: 1000 },
    ],
    spawns: [
      { x: 80, y: 928 }, { x: 280, y: 928 }, { x: 480, y: 928 },
      { x: 700, y: 928 }, { x: 960, y: 928 }, { x: 1200, y: 928 },
      { x: 1440, y: 928 }, { x: 1680, y: 928 },
    ],
  },

  sunset_park: {
    name: 'Sunset Park',
    width: 1600,
    height: 900,
    bg: '#FF9A76',
    theme: 'sunset',
    platforms: [
      // ============================================================
      // FLOOR — continuous
      // ============================================================
      { x: 0, y: 868, w: 1600, h: 32 },

      // ============================================================
      // LEFT STRUCTURE — wide low structure (x: 32–480)
      // Horizontal flow emphasis — long rooms, short walls
      // ============================================================
      // Structure floor
      { x: 32, y: 740, w: 448, h: 32 },
      // Left wall
      { x: 32, y: 612, w: 32, h: 128 },
      // Interior divider wall (short, 96px, creates two sub-rooms)
      { x: 256, y: 644, w: 32, h: 96 },
      // Right wall — partial (gap at bottom)
      { x: 448, y: 612, w: 32, h: 64 },
      // Ceiling
      { x: 32, y: 612, w: 448, h: 32 },
      // Jumpthrough in left sub-room
      { x: 64, y: 676, w: 192, h: 32, type: 'jumpthrough' },
      // Speed pad connecting across structure floor
      { x: 64, y: 708, w: 384, h: 32, type: 'dash_block' },

      // ============================================================
      // LEFT-TO-CENTER LINK (x: 480–672)
      // Low horizontal corridor
      // ============================================================
      // Corridor floor
      { x: 480, y: 740, w: 192, h: 32 },
      // Corridor ceiling (creates enclosed hallway feel)
      { x: 480, y: 644, w: 192, h: 32 },
      // Speed pad on ground between structures
      { x: 448, y: 836, w: 320, h: 32, type: 'dash_block' },

      // ============================================================
      // CENTER STRUCTURE — hub room (x: 640–1024)
      // Wider room, multiple entries, vertical escape via jumpthrough
      // ============================================================
      // Room floor
      { x: 640, y: 740, w: 384, h: 32 },
      // Left wall — gap at bottom
      { x: 640, y: 548, w: 32, h: 128 },
      // Right wall — gap at bottom
      { x: 992, y: 548, w: 32, h: 128 },
      // Ceiling
      { x: 640, y: 548, w: 384, h: 32 },
      // Jumpthrough mid-level (escape route upward)
      { x: 704, y: 644, w: 256, h: 32, type: 'jumpthrough' },
      // Interior shelf
      { x: 672, y: 580, w: 128, h: 32 },
      { x: 864, y: 580, w: 128, h: 32 },

      // ============================================================
      // CENTER-TO-RIGHT LINK (x: 1024–1184)
      // ============================================================
      // Corridor floor
      { x: 1024, y: 740, w: 160, h: 32 },
      // Crumble bridge at upper level
      { x: 1024, y: 612, w: 128, h: 32, type: 'crumble' },
      // Speed pad on ground between structures
      { x: 992, y: 836, w: 320, h: 32, type: 'dash_block' },

      // ============================================================
      // RIGHT STRUCTURE — tall narrow structure (x: 1152–1568)
      // Two-story room
      // ============================================================
      // Lower room floor
      { x: 1152, y: 740, w: 416, h: 32 },
      // Left wall
      { x: 1152, y: 548, w: 32, h: 192 },
      // Right wall
      { x: 1536, y: 612, w: 32, h: 128 },
      // Mid floor (divides into two stories)
      { x: 1152, y: 612, w: 416, h: 32 },
      // Upper right wall
      { x: 1536, y: 452, w: 32, h: 160 },
      // Upper ceiling
      { x: 1184, y: 452, w: 384, h: 32 },
      // Jumpthrough in lower story
      { x: 1216, y: 676, w: 256, h: 32, type: 'jumpthrough' },
      // Jumpthrough in upper story
      { x: 1216, y: 516, w: 256, h: 32, type: 'jumpthrough' },
      // Interior pillar for wall-jump
      { x: 1376, y: 548, w: 32, h: 64 },

      // ============================================================
      // UPPER LEVEL — stepping stones above structures
      // More horizontal than vertical
      // ============================================================
      { x: 64, y: 484, w: 160, h: 32 },
      { x: 288, y: 484, w: 128, h: 32, type: 'oneway' },
      { x: 480, y: 452, w: 128, h: 32 },
      { x: 704, y: 420, w: 128, h: 32, type: 'oneway' },
      { x: 928, y: 452, w: 128, h: 32 },

      // ============================================================
      // TOP LEVEL
      // ============================================================
      { x: 192, y: 356, w: 128, h: 32 },
      { x: 448, y: 324, w: 128, h: 32 },
      { x: 736, y: 292, w: 128, h: 32 },
      { x: 1024, y: 324, w: 128, h: 32 },
      { x: 1312, y: 356, w: 128, h: 32 },

      // ============================================================
      // GROUND FEATURES
      // ============================================================
      // Trampolines
      { x: 96, y: 856, w: 64, h: 12, type: 'trampoline' },
      { x: 768, y: 856, w: 64, h: 12, type: 'trampoline' },
      { x: 1472, y: 856, w: 64, h: 12, type: 'trampoline' },
      // Trampoline inside center room
      { x: 800, y: 728, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 900 },
      { x: 1580, y: 0, w: 20, h: 900 },
    ],
    spawns: [
      { x: 80, y: 828 }, { x: 240, y: 828 }, { x: 440, y: 828 },
      { x: 640, y: 828 }, { x: 860, y: 828 }, { x: 1080, y: 828 },
      { x: 1300, y: 828 }, { x: 1480, y: 828 },
    ],
  },

  factory: {
    name: 'Factory',
    width: 2000,
    height: 1100,
    bg: '#2C1810',
    theme: 'factory',
    platforms: [
      // ============================================================
      // FLOOR — continuous
      // ============================================================
      { x: 0, y: 1068, w: 2000, h: 32 },

      // ============================================================
      // STRUCTURE 1 — left intake room (x: 32–352)
      // U-shape with pillar inside
      // ============================================================
      // Floor
      { x: 32, y: 908, w: 320, h: 32 },
      // Left wall
      { x: 32, y: 716, w: 32, h: 192 },
      // Right wall — gap at bottom (64px entry)
      { x: 320, y: 716, w: 32, h: 128 },
      // Ceiling
      { x: 32, y: 716, w: 320, h: 32 },
      // Interior pillar (wall-jump)
      { x: 176, y: 780, w: 32, h: 128 },
      // Jumpthrough
      { x: 64, y: 812, w: 256, h: 32, type: 'jumpthrough' },
      // Speed pad on structure floor
      { x: 64, y: 876, w: 256, h: 32, type: 'dash_block' },

      // ============================================================
      // CORRIDOR 1→2 (x: 352–576)
      // ============================================================
      // Corridor floor
      { x: 352, y: 908, w: 224, h: 32 },
      // Corridor ceiling
      { x: 352, y: 812, w: 224, h: 32 },
      // Crumble shortcut above
      { x: 384, y: 716, w: 128, h: 32, type: 'crumble' },

      // ============================================================
      // STRUCTURE 2 — processing room (x: 544–928)
      // Large room, two entries on each side
      // ============================================================
      // Floor
      { x: 544, y: 908, w: 384, h: 32 },
      // Left wall — lower portion only (gap at top for upper entry)
      { x: 544, y: 812, w: 32, h: 96 },
      // Right wall — lower portion only
      { x: 896, y: 812, w: 32, h: 96 },
      // Upper left wall
      { x: 544, y: 620, w: 32, h: 128 },
      // Upper right wall
      { x: 896, y: 620, w: 32, h: 128 },
      // Ceiling
      { x: 544, y: 620, w: 384, h: 32 },
      // Mid-level platform (creates two stories)
      { x: 608, y: 748, w: 256, h: 32 },
      // Jumpthrough in lower level
      { x: 576, y: 844, w: 320, h: 32, type: 'jumpthrough' },
      // Jumpthrough in upper level
      { x: 608, y: 684, w: 256, h: 32, type: 'jumpthrough' },
      // Interior pillar
      { x: 736, y: 748, w: 32, h: 160 },

      // ============================================================
      // CORRIDOR 2→3 (x: 928–1120)
      // Open corridor with speed pad on ground
      // ============================================================
      { x: 928, y: 908, w: 192, h: 32 },
      // Speed pad on ground between structures
      { x: 864, y: 1036, w: 352, h: 32, type: 'dash_block' },

      // ============================================================
      // STRUCTURE 3 — central tower (x: 1088–1408)
      // Tallest structure, multiple levels
      // ============================================================
      // Base floor
      { x: 1088, y: 908, w: 320, h: 32 },
      // Left wall
      { x: 1088, y: 524, w: 32, h: 384 },
      // Right wall — gap in middle (780-844 is open, 64px gap)
      { x: 1376, y: 524, w: 32, h: 192 },
      { x: 1376, y: 844, w: 32, h: 64 },
      // Ceiling
      { x: 1088, y: 524, w: 320, h: 32 },
      // Level 1 floor
      { x: 1120, y: 812, w: 256, h: 32 },
      // Level 2 floor
      { x: 1120, y: 716, w: 256, h: 32 },
      // Level 3 floor (jumpthrough for escape)
      { x: 1120, y: 620, w: 256, h: 32, type: 'jumpthrough' },
      // Pillar in tower
      { x: 1248, y: 620, w: 32, h: 192 },
      // Speed pad on top of tower
      { x: 1120, y: 492, w: 256, h: 32, type: 'dash_block' },

      // ============================================================
      // CORRIDOR 3→4 (x: 1408–1568)
      // ============================================================
      // Bridge
      { x: 1408, y: 812, w: 160, h: 32 },
      // Crumble at upper level
      { x: 1408, y: 620, w: 128, h: 32, type: 'crumble' },
      // Support wall
      { x: 1408, y: 812, w: 32, h: 96 },

      // ============================================================
      // STRUCTURE 4 — right processing bay (x: 1536–1856)
      // L-shaped structure
      // ============================================================
      // Lower floor
      { x: 1536, y: 908, w: 320, h: 32 },
      // Left wall — partial
      { x: 1536, y: 716, w: 32, h: 128 },
      // Right wall
      { x: 1824, y: 620, w: 32, h: 288 },
      // Upper floor
      { x: 1536, y: 716, w: 320, h: 32 },
      // L-extension ceiling
      { x: 1632, y: 620, w: 224, h: 32 },
      // Jumpthrough
      { x: 1568, y: 812, w: 256, h: 32, type: 'jumpthrough' },
      // Interior pillar
      { x: 1696, y: 716, w: 32, h: 192 },

      // ============================================================
      // STRUCTURE 5 — far right storage (x: 1824–1968)
      // Small enclosed room
      // ============================================================
      // Floor
      { x: 1824, y: 908, w: 144, h: 32 },
      // Right wall
      { x: 1936, y: 748, w: 32, h: 160 },
      // Ceiling
      { x: 1824, y: 748, w: 144, h: 32 },
      // Speed pad inside
      { x: 1824, y: 876, w: 144, h: 32, type: 'dash_block' },
      // Jumpthrough
      { x: 1824, y: 828, w: 112, h: 32, type: 'jumpthrough' },

      // ============================================================
      // UPPER LEVEL — catwalks above structures
      // ============================================================
      { x: 96, y: 588, w: 160, h: 32 },
      { x: 320, y: 556, w: 128, h: 32 },
      { x: 512, y: 492, w: 128, h: 32, type: 'oneway' },
      // Crumble catwalk
      { x: 704, y: 524, w: 128, h: 32, type: 'crumble' },
      { x: 928, y: 492, w: 128, h: 32 },
      // Far right upper
      { x: 1568, y: 524, w: 128, h: 32, type: 'oneway' },
      { x: 1792, y: 556, w: 128, h: 32 },

      // ============================================================
      // TOP LEVEL — overhead crane rails
      // ============================================================
      { x: 192, y: 396, w: 128, h: 32 },
      { x: 448, y: 364, w: 128, h: 32 },
      { x: 736, y: 332, w: 160, h: 32 },
      { x: 1024, y: 364, w: 128, h: 32 },
      { x: 1344, y: 396, w: 128, h: 32 },
      { x: 1632, y: 364, w: 128, h: 32 },
      { x: 1856, y: 396, w: 96, h: 32 },

      // ============================================================
      // GROUND LEVEL FEATURES
      // ============================================================
      // Speed pad on far left ground
      { x: 32, y: 1036, w: 320, h: 32, type: 'dash_block' },
      // Speed pad on far right ground
      { x: 1632, y: 1036, w: 320, h: 32, type: 'dash_block' },
      // Trampolines
      { x: 160, y: 1056, w: 64, h: 12, type: 'trampoline' },
      { x: 576, y: 1056, w: 64, h: 12, type: 'trampoline' },
      { x: 1024, y: 1056, w: 64, h: 12, type: 'trampoline' },
      { x: 1472, y: 1056, w: 64, h: 12, type: 'trampoline' },
      { x: 1888, y: 1056, w: 64, h: 12, type: 'trampoline' },
      // Trampoline inside structure 2
      { x: 704, y: 896, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // PILLARS — standalone wall-jump pillars
      // ============================================================
      { x: 448, y: 908, w: 32, h: 160 },
      { x: 1472, y: 812, w: 32, h: 256 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1100 },
      { x: 1980, y: 0, w: 20, h: 1100 },
    ],
    spawns: [
      { x: 80, y: 1028 }, { x: 320, y: 1028 }, { x: 580, y: 1028 },
      { x: 820, y: 1028 }, { x: 1100, y: 1028 }, { x: 1400, y: 1028 },
      { x: 1680, y: 1028 }, { x: 1900, y: 1028 },
    ],
  },
};

export const defaultMap = 'playground';
export const mapList = Object.keys(maps);
