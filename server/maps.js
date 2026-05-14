// Platform height unit: 32px (square blocks)
// All platforms 32px tall unless trampoline (12px)
// No death pits — floor is always continuous
// Speed pads are long (256-384px) for actual boost
// Jump-through platforms placed ABOVE reachable platforms
// Structures use walls connecting levels

export const maps = {
  playground: {
    name: 'Playground',
    width: 1800,
    height: 1000,
    bg: '#7EC8E3',
    theme: 'sky',
    platforms: [
      // === FLOOR (continuous) ===
      { x: 0, y: 968, w: 1800, h: 32 },

      // === LEFT STRUCTURE (x: 30-350) ===
      { x: 32, y: 840, w: 192, h: 32 },                // shelf
      { x: 192, y: 712, w: 32, h: 160 },                // wall connecting shelf to upper
      { x: 32, y: 712, w: 192, h: 32 },                 // upper shelf
      { x: 32, y: 584, w: 128, h: 32 },                 // top shelf

      // === LEFT-CENTER SPEED PAD ===
      { x: 288, y: 904, w: 320, h: 32, type: 'dash_block' },  // long speed pad on floor

      // === CENTER STRUCTURE (x: 650-1050) ===
      { x: 672, y: 840, w: 288, h: 32 },                // base platform
      { x: 672, y: 712, w: 32, h: 128 },                // left wall
      { x: 928, y: 712, w: 32, h: 128 },                // right wall
      { x: 672, y: 712, w: 288, h: 32 },                // upper platform

      // === JUMPTHROUGH spanning center (reachable from center structure) ===
      { x: 448, y: 584, w: 320, h: 32, type: 'jumpthrough' },
      { x: 928, y: 584, w: 256, h: 32, type: 'jumpthrough' },

      // === RIGHT-CENTER SPEED PAD ===
      { x: 1120, y: 904, w: 320, h: 32, type: 'dash_block' }, // long speed pad on floor

      // === RIGHT STRUCTURE (x: 1400-1780) ===
      { x: 1472, y: 840, w: 192, h: 32 },              // shelf
      { x: 1472, y: 712, w: 32, h: 160 },               // wall
      { x: 1472, y: 712, w: 192, h: 32 },               // upper shelf
      { x: 1536, y: 584, w: 128, h: 32 },               // top shelf

      // === CRUMBLE BRIDGES ===
      { x: 288, y: 712, w: 128, h: 32, type: 'crumble' },  // left to center
      { x: 1248, y: 712, w: 128, h: 32, type: 'crumble' }, // center to right

      // === MID-HIGH PLATFORMS ===
      { x: 288, y: 456, w: 160, h: 32 },
      { x: 640, y: 456, w: 192, h: 32 },
      { x: 1024, y: 456, w: 160, h: 32 },
      { x: 1344, y: 456, w: 160, h: 32 },

      // === ONEWAY at top ===
      { x: 480, y: 328, w: 192, h: 32, type: 'oneway' },
      { x: 864, y: 328, w: 192, h: 32 },
      { x: 1216, y: 328, w: 192, h: 32, type: 'oneway' },

      // === TRAMPOLINES ===
      { x: 160, y: 928, w: 64, h: 12, type: 'trampoline' },   // left ground
      { x: 1568, y: 928, w: 64, h: 12, type: 'trampoline' },  // right ground
      { x: 800, y: 672, w: 48, h: 12, type: 'trampoline' },   // center mid
      { x: 1200, y: 544, w: 48, h: 12, type: 'trampoline' },  // right mid-high

      // === WALLS (boundary) ===
      { x: 0, y: 0, w: 20, h: 1000 },
      { x: 1780, y: 0, w: 20, h: 1000 },
    ],
    spawns: [
      { x: 80, y: 928 }, { x: 240, y: 928 }, { x: 500, y: 928 }, { x: 700, y: 928 },
      { x: 1000, y: 928 }, { x: 1200, y: 928 }, { x: 1500, y: 928 }, { x: 1700, y: 928 },
    ],
  },

  rooftops: {
    name: 'Rooftops',
    width: 2000,
    height: 1100,
    bg: '#0d1b2a',
    theme: 'rooftops',
    platforms: [
      // === FLOOR ===
      { x: 0, y: 1068, w: 2000, h: 32 },

      // === LEFT BUILDING (x: 32-400) ===
      { x: 32, y: 940, w: 224, h: 32 },
      { x: 224, y: 812, w: 32, h: 160 },
      { x: 32, y: 812, w: 224, h: 32 },
      { x: 32, y: 684, w: 160, h: 32 },

      // === LEFT-CENTER CORRIDOR ===
      { x: 320, y: 940, w: 256, h: 32, type: 'dash_block' },  // speed pad
      { x: 384, y: 812, w: 128, h: 32, type: 'crumble' },     // crumble bridge

      // === CENTER TOWER (x: 700-1100) ===
      { x: 672, y: 940, w: 256, h: 32 },
      { x: 672, y: 812, w: 32, h: 128 },
      { x: 896, y: 812, w: 32, h: 128 },
      { x: 672, y: 812, w: 256, h: 32 },
      { x: 704, y: 684, w: 192, h: 32 },
      { x: 736, y: 556, w: 128, h: 32 },

      // === JUMPTHROUGH (above tower, reachable from walls) ===
      { x: 544, y: 684, w: 192, h: 32, type: 'jumpthrough' },
      { x: 928, y: 684, w: 224, h: 32, type: 'jumpthrough' },

      // === RIGHT-CENTER CORRIDOR ===
      { x: 1056, y: 940, w: 256, h: 32, type: 'dash_block' }, // speed pad
      { x: 1120, y: 812, w: 128, h: 32, type: 'crumble' },    // crumble bridge

      // === RIGHT BUILDING (x: 1400-1968) ===
      { x: 1440, y: 940, w: 224, h: 32 },
      { x: 1440, y: 812, w: 32, h: 160 },
      { x: 1440, y: 812, w: 224, h: 32 },
      { x: 1504, y: 684, w: 160, h: 32 },

      // === UPPER LEVEL ===
      { x: 192, y: 556, w: 160, h: 32 },
      { x: 448, y: 556, w: 128, h: 32, type: 'crumble' },
      { x: 1024, y: 556, w: 128, h: 32, type: 'crumble' },
      { x: 1280, y: 556, w: 160, h: 32 },
      { x: 1568, y: 556, w: 128, h: 32 },

      // === TOP LEVEL ===
      { x: 384, y: 428, w: 192, h: 32, type: 'oneway' },
      { x: 768, y: 428, w: 160, h: 32 },
      { x: 1120, y: 428, w: 192, h: 32, type: 'oneway' },

      // === SKY PLATFORMS ===
      { x: 608, y: 300, w: 128, h: 32 },
      { x: 928, y: 300, w: 128, h: 32 },
      { x: 1280, y: 300, w: 128, h: 32 },

      // === TRAMPOLINES ===
      { x: 128, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 1744, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 800, y: 772, w: 48, h: 12, type: 'trampoline' },
      { x: 1440, y: 644, w: 48, h: 12, type: 'trampoline' },
      { x: 400, y: 644, w: 48, h: 12, type: 'trampoline' },

      // === PILLAR (wall-jump) ===
      { x: 576, y: 812, w: 32, h: 256 },
      { x: 1360, y: 812, w: 32, h: 256 },

      // === WALLS ===
      { x: 0, y: 0, w: 20, h: 1100 },
      { x: 1980, y: 0, w: 20, h: 1100 },
    ],
    spawns: [
      { x: 80, y: 1028 }, { x: 250, y: 1028 }, { x: 500, y: 1028 }, { x: 750, y: 1028 },
      { x: 1000, y: 1028 }, { x: 1250, y: 1028 }, { x: 1500, y: 1028 }, { x: 1800, y: 1028 },
    ],
  },

  sunset_park: {
    name: 'Sunset Park',
    width: 1800,
    height: 1000,
    bg: '#FF9A76',
    theme: 'sunset',
    platforms: [
      // === FLOOR ===
      { x: 0, y: 968, w: 1800, h: 32 },

      // === LEFT WING ===
      { x: 32, y: 840, w: 160, h: 32 },
      { x: 160, y: 712, w: 32, h: 160 },
      { x: 32, y: 712, w: 160, h: 32 },

      // === LEFT SPEED RUN ===
      { x: 256, y: 840, w: 288, h: 32, type: 'dash_block' },

      // === CENTER-LEFT PLATFORM ===
      { x: 416, y: 712, w: 160, h: 32 },
      { x: 288, y: 584, w: 192, h: 32 },

      // === JUMPTHROUGH (above left area) ===
      { x: 64, y: 584, w: 192, h: 32, type: 'jumpthrough' },

      // === CENTER STRUCTURE ===
      { x: 640, y: 840, w: 256, h: 32 },
      { x: 640, y: 712, w: 32, h: 128 },
      { x: 864, y: 712, w: 32, h: 128 },
      { x: 640, y: 712, w: 256, h: 32 },
      { x: 704, y: 584, w: 160, h: 32 },

      // === CRUMBLE BRIDGES ===
      { x: 544, y: 840, w: 96, h: 32, type: 'crumble' },
      { x: 896, y: 840, w: 96, h: 32, type: 'crumble' },
      { x: 576, y: 456, w: 96, h: 32, type: 'crumble' },

      // === RIGHT SPEED RUN ===
      { x: 1056, y: 840, w: 288, h: 32, type: 'dash_block' },

      // === RIGHT WING ===
      { x: 1408, y: 840, w: 192, h: 32 },
      { x: 1408, y: 712, w: 32, h: 160 },
      { x: 1408, y: 712, w: 192, h: 32 },

      // === RIGHT PLATFORMS ===
      { x: 1120, y: 712, w: 160, h: 32 },
      { x: 1248, y: 584, w: 192, h: 32 },

      // === JUMPTHROUGH (above right area) ===
      { x: 1440, y: 584, w: 192, h: 32, type: 'jumpthrough' },

      // === UPPER LEVEL ===
      { x: 128, y: 456, w: 160, h: 32 },
      { x: 416, y: 456, w: 128, h: 32 },
      { x: 736, y: 456, w: 160, h: 32 },
      { x: 1024, y: 456, w: 128, h: 32 },
      { x: 1344, y: 456, w: 160, h: 32 },

      // === TOP LEVEL ===
      { x: 320, y: 328, w: 192, h: 32, type: 'oneway' },
      { x: 736, y: 328, w: 160, h: 32 },
      { x: 1152, y: 328, w: 192, h: 32, type: 'oneway' },
      { x: 1536, y: 328, w: 128, h: 32 },

      // === TRAMPOLINES ===
      { x: 192, y: 928, w: 64, h: 12, type: 'trampoline' },
      { x: 992, y: 928, w: 64, h: 12, type: 'trampoline' },
      { x: 1600, y: 928, w: 64, h: 12, type: 'trampoline' },
      { x: 512, y: 672, w: 48, h: 12, type: 'trampoline' },
      { x: 1056, y: 544, w: 48, h: 12, type: 'trampoline' },

      // === DASH BLOCK (upper) ===
      { x: 864, y: 584, w: 256, h: 32, type: 'dash_block' },

      // === WALLS ===
      { x: 0, y: 0, w: 20, h: 1000 },
      { x: 1780, y: 0, w: 20, h: 1000 },
    ],
    spawns: [
      { x: 80, y: 928 }, { x: 280, y: 928 }, { x: 500, y: 928 }, { x: 700, y: 928 },
      { x: 950, y: 928 }, { x: 1200, y: 928 }, { x: 1450, y: 928 }, { x: 1700, y: 928 },
    ],
  },

  factory: {
    name: 'Factory',
    width: 2200,
    height: 1100,
    bg: '#2C1810',
    theme: 'factory',
    platforms: [
      // === FLOOR ===
      { x: 0, y: 1068, w: 2200, h: 32 },

      // === LEFT STRUCTURE ===
      { x: 32, y: 940, w: 192, h: 32 },
      { x: 192, y: 812, w: 32, h: 160 },
      { x: 32, y: 812, w: 192, h: 32 },
      { x: 64, y: 684, w: 128, h: 32 },

      // === SPEED PAD LEFT ===
      { x: 288, y: 940, w: 320, h: 32, type: 'dash_block' },

      // === LEFT-CENTER ===
      { x: 448, y: 812, w: 160, h: 32 },
      { x: 352, y: 684, w: 192, h: 32, type: 'jumpthrough' },

      // === CENTER-LEFT STRUCTURE ===
      { x: 704, y: 940, w: 224, h: 32 },
      { x: 704, y: 812, w: 32, h: 128 },
      { x: 896, y: 812, w: 32, h: 128 },
      { x: 704, y: 812, w: 224, h: 32 },

      // === CRUMBLE CATWALKS ===
      { x: 608, y: 940, w: 96, h: 32, type: 'crumble' },
      { x: 928, y: 940, w: 96, h: 32, type: 'crumble' },
      { x: 608, y: 684, w: 96, h: 32, type: 'crumble' },
      { x: 1280, y: 684, w: 96, h: 32, type: 'crumble' },

      // === SPEED PAD CENTER ===
      { x: 1024, y: 940, w: 352, h: 32, type: 'dash_block' },

      // === CENTER-RIGHT STRUCTURE ===
      { x: 1120, y: 812, w: 192, h: 32 },
      { x: 1120, y: 684, w: 32, h: 128 },

      // === JUMPTHROUGH CENTER ===
      { x: 768, y: 684, w: 256, h: 32, type: 'jumpthrough' },

      // === RIGHT STRUCTURE ===
      { x: 1440, y: 940, w: 224, h: 32 },
      { x: 1632, y: 812, w: 32, h: 160 },
      { x: 1440, y: 812, w: 224, h: 32 },
      { x: 1504, y: 684, w: 128, h: 32 },

      // === SPEED PAD RIGHT ===
      { x: 1728, y: 940, w: 320, h: 32, type: 'dash_block' },

      // === FAR RIGHT ===
      { x: 1824, y: 812, w: 192, h: 32 },
      { x: 1888, y: 684, w: 128, h: 32 },
      { x: 1760, y: 684, w: 128, h: 32, type: 'jumpthrough' },

      // === UPPER LEVEL ===
      { x: 192, y: 556, w: 160, h: 32 },
      { x: 480, y: 556, w: 160, h: 32 },
      { x: 768, y: 556, w: 192, h: 32 },
      { x: 1088, y: 556, w: 192, h: 32, type: 'oneway' },
      { x: 1408, y: 556, w: 160, h: 32 },
      { x: 1696, y: 556, w: 160, h: 32 },

      // === TOP LEVEL ===
      { x: 320, y: 428, w: 192, h: 32 },
      { x: 672, y: 428, w: 160, h: 32, type: 'oneway' },
      { x: 1024, y: 428, w: 192, h: 32 },
      { x: 1376, y: 428, w: 160, h: 32, type: 'oneway' },
      { x: 1728, y: 428, w: 160, h: 32 },

      // === SKY ===
      { x: 544, y: 300, w: 128, h: 32 },
      { x: 928, y: 300, w: 160, h: 32 },
      { x: 1280, y: 300, w: 128, h: 32 },
      { x: 1600, y: 300, w: 128, h: 32 },

      // === TRAMPOLINES ===
      { x: 128, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 576, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 1376, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 2048, y: 1028, w: 64, h: 12, type: 'trampoline' },
      { x: 480, y: 772, w: 48, h: 12, type: 'trampoline' },
      { x: 1152, y: 644, w: 48, h: 12, type: 'trampoline' },
      { x: 1808, y: 644, w: 48, h: 12, type: 'trampoline' },

      // === PILLARS ===
      { x: 416, y: 812, w: 32, h: 256 },
      { x: 1376, y: 812, w: 32, h: 256 },
      { x: 1984, y: 812, w: 32, h: 256 },

      // === WALLS ===
      { x: 0, y: 0, w: 20, h: 1100 },
      { x: 2180, y: 0, w: 20, h: 1100 },
    ],
    spawns: [
      { x: 80, y: 1028 }, { x: 350, y: 1028 }, { x: 650, y: 1028 }, { x: 950, y: 1028 },
      { x: 1250, y: 1028 }, { x: 1500, y: 1028 }, { x: 1800, y: 1028 }, { x: 2080, y: 1028 },
    ],
  },
};

export const defaultMap = 'playground';
export const mapList = Object.keys(maps);
