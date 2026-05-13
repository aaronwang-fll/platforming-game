export const maps = {
  playground: {
    name: 'Playground',
    width: 2000,
    height: 1200,
    bg: '#7EC8E3',
    theme: 'sky',
    platforms: [
      // Ground — segmented with gaps for danger
      { x: 0, y: 1160, w: 420, h: 40 },
      { x: 520, y: 1160, w: 380, h: 40 },
      { x: 1000, y: 1160, w: 420, h: 40 },
      { x: 1520, y: 1160, w: 480, h: 40 },

      // Level 1 (y~1000) — easy platforms, spaced out
      { x: 100, y: 1000, w: 150, h: 16 },
      { x: 460, y: 1010, w: 140, h: 16 },
      { x: 800, y: 1000, w: 160, h: 16 },
      { x: 1200, y: 1010, w: 140, h: 16 },
      { x: 1600, y: 1000, w: 150, h: 16 },
      // Crumble shortcut across gap
      { x: 680, y: 1040, w: 100, h: 14, type: 'crumble' },

      // Level 2 (y~820) — mix with jumpthrough escapes
      { x: 60, y: 820, w: 140, h: 16 },
      { x: 380, y: 830, w: 130, h: 16 },
      { x: 650, y: 820, w: 150, h: 10, type: 'jumpthrough' },
      { x: 960, y: 830, w: 140, h: 16 },
      { x: 1280, y: 820, w: 130, h: 16 },
      { x: 1600, y: 830, w: 140, h: 10, type: 'jumpthrough' },
      // Dash block for tagger
      { x: 1820, y: 820, w: 60, h: 14, type: 'dash_block' },

      // Level 3 (y~640) — tighter, crumble bridges
      { x: 160, y: 640, w: 130, h: 16 },
      { x: 440, y: 650, w: 120, h: 14, type: 'crumble' },
      { x: 720, y: 640, w: 140, h: 16 },
      { x: 1040, y: 650, w: 130, h: 16 },
      { x: 1340, y: 640, w: 120, h: 10, type: 'jumpthrough' },
      { x: 1660, y: 650, w: 130, h: 16 },

      // Level 4 (y~460) — top route with oneway
      { x: 280, y: 460, w: 140, h: 16 },
      { x: 600, y: 470, w: 130, h: 10, type: 'oneway' },
      { x: 920, y: 460, w: 150, h: 16 },
      { x: 1260, y: 470, w: 130, h: 14, type: 'crumble' },
      { x: 1560, y: 460, w: 140, h: 16 },

      // Level 5 (y~300) — high escape route
      { x: 450, y: 300, w: 130, h: 16 },
      { x: 800, y: 290, w: 160, h: 10, type: 'oneway' },
      { x: 1200, y: 300, w: 130, h: 16 },

      // Trampolines — strategic vertical access
      { x: 250, y: 1120, w: 50, h: 12, type: 'trampoline' },
      { x: 1460, y: 1120, w: 50, h: 12, type: 'trampoline' },
      { x: 540, y: 780, w: 50, h: 12, type: 'trampoline' },
      { x: 1140, y: 600, w: 50, h: 12, type: 'trampoline' },

      // Dash blocks — tagger shortcuts
      { x: 380, y: 1120, w: 60, h: 14, type: 'dash_block' },
      { x: 1100, y: 790, w: 60, h: 14, type: 'dash_block' },

      // Walls
      { x: 0, y: 0, w: 20, h: 1200 },
      { x: 1980, y: 0, w: 20, h: 1200 },
    ],
    spawns: [
      { x: 80, y: 1120 }, { x: 250, y: 1120 }, { x: 580, y: 1120 }, { x: 750, y: 1120 },
      { x: 1080, y: 1120 }, { x: 1250, y: 1120 }, { x: 1580, y: 1120 }, { x: 1800, y: 1120 },
    ],
  },

  rooftops: {
    name: 'Rooftops',
    width: 2200,
    height: 1400,
    bg: '#0d1b2a',
    theme: 'rooftops',
    platforms: [
      // Ground — rooftop segments with wide gaps
      { x: 0, y: 1360, w: 350, h: 40 },
      { x: 500, y: 1360, w: 400, h: 40 },
      { x: 1050, y: 1360, w: 350, h: 40 },
      { x: 1550, y: 1360, w: 400, h: 40 },

      // Level 1 (y~1180) — rooftop edges
      { x: 80, y: 1180, w: 140, h: 16 },
      { x: 420, y: 1190, w: 130, h: 16 },
      { x: 720, y: 1180, w: 140, h: 14, type: 'crumble' },
      { x: 1060, y: 1190, w: 130, h: 16 },
      { x: 1400, y: 1180, w: 140, h: 16 },
      { x: 1740, y: 1190, w: 130, h: 10, type: 'jumpthrough' },

      // Level 2 (y~1000) — chase platforms
      { x: 180, y: 1000, w: 130, h: 16 },
      { x: 500, y: 1010, w: 140, h: 10, type: 'jumpthrough' },
      { x: 820, y: 1000, w: 120, h: 16 },
      { x: 1160, y: 1010, w: 130, h: 14, type: 'crumble' },
      { x: 1500, y: 1000, w: 140, h: 16 },
      { x: 1840, y: 1010, w: 120, h: 16 },

      // Level 3 (y~820) — vertical escape shafts
      { x: 60, y: 820, w: 120, h: 16 },
      { x: 360, y: 830, w: 130, h: 16 },
      { x: 660, y: 820, w: 120, h: 10, type: 'jumpthrough' },
      { x: 980, y: 830, w: 140, h: 16 },
      { x: 1300, y: 820, w: 120, h: 10, type: 'jumpthrough' },
      { x: 1620, y: 830, w: 130, h: 16 },
      { x: 1940, y: 820, w: 120, h: 16 },

      // Level 4 (y~640) — tighter with oneway
      { x: 200, y: 640, w: 130, h: 16 },
      { x: 540, y: 650, w: 120, h: 10, type: 'oneway' },
      { x: 880, y: 640, w: 140, h: 16 },
      { x: 1220, y: 650, w: 120, h: 14, type: 'crumble' },
      { x: 1560, y: 640, w: 130, h: 16 },
      { x: 1900, y: 650, w: 120, h: 10, type: 'oneway' },

      // Level 5 (y~460) — high route
      { x: 380, y: 460, w: 130, h: 16 },
      { x: 740, y: 470, w: 120, h: 16 },
      { x: 1100, y: 460, w: 140, h: 10, type: 'oneway' },
      { x: 1460, y: 470, w: 130, h: 16 },

      // Level 6 (y~300) — skyline escape
      { x: 600, y: 300, w: 120, h: 16 },
      { x: 1000, y: 290, w: 140, h: 16 },
      { x: 1400, y: 300, w: 120, h: 16 },

      // Trampolines
      { x: 350, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 1430, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 2060, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 780, y: 780, w: 50, h: 12, type: 'trampoline' },
      { x: 1680, y: 600, w: 50, h: 12, type: 'trampoline' },

      // Dash blocks
      { x: 140, y: 1320, w: 60, h: 14, type: 'dash_block' },
      { x: 960, y: 960, w: 60, h: 14, type: 'dash_block' },
      { x: 1800, y: 780, w: 60, h: 14, type: 'dash_block' },

      // Interior pillars for wall-jumping
      { x: 440, y: 1060, w: 18, h: 300 },
      { x: 1380, y: 860, w: 18, h: 300 },

      // Walls
      { x: 0, y: 0, w: 20, h: 1400 },
      { x: 2180, y: 0, w: 20, h: 1400 },
    ],
    spawns: [
      { x: 60, y: 1320 }, { x: 220, y: 1320 }, { x: 560, y: 1320 }, { x: 740, y: 1320 },
      { x: 1120, y: 1320 }, { x: 1280, y: 1320 }, { x: 1620, y: 1320 }, { x: 1840, y: 1320 },
    ],
  },

  sunset_park: {
    name: 'Sunset Park',
    width: 2000,
    height: 1200,
    bg: '#FF9A76',
    theme: 'sunset',
    platforms: [
      // Ground with wide gaps — forces platforming
      { x: 0, y: 1160, w: 360, h: 40 },
      { x: 500, y: 1160, w: 340, h: 40 },
      { x: 980, y: 1160, w: 360, h: 40 },
      { x: 1480, y: 1160, w: 520, h: 40 },

      // Level 1 (y~1000) — horizontal flow with crumble bridges
      { x: 80, y: 1000, w: 140, h: 16 },
      { x: 360, y: 1010, w: 120, h: 14, type: 'crumble' },
      { x: 620, y: 1000, w: 150, h: 16 },
      { x: 940, y: 1010, w: 120, h: 14, type: 'crumble' },
      { x: 1220, y: 1000, w: 140, h: 16 },
      { x: 1560, y: 1010, w: 130, h: 16 },
      { x: 1840, y: 1000, w: 120, h: 10, type: 'jumpthrough' },

      // Level 2 (y~820) — chase level
      { x: 160, y: 820, w: 130, h: 16 },
      { x: 460, y: 830, w: 120, h: 10, type: 'jumpthrough' },
      { x: 760, y: 820, w: 140, h: 16 },
      { x: 1080, y: 830, w: 130, h: 16 },
      { x: 1400, y: 820, w: 120, h: 10, type: 'jumpthrough' },
      { x: 1720, y: 830, w: 130, h: 16 },

      // Level 3 (y~640) — escape routes
      { x: 60, y: 640, w: 120, h: 16 },
      { x: 340, y: 650, w: 130, h: 14, type: 'crumble' },
      { x: 620, y: 640, w: 120, h: 10, type: 'oneway' },
      { x: 920, y: 650, w: 140, h: 16 },
      { x: 1240, y: 640, w: 120, h: 16 },
      { x: 1560, y: 650, w: 130, h: 10, type: 'oneway' },
      { x: 1860, y: 640, w: 120, h: 16 },

      // Level 4 (y~460) — top platforms
      { x: 240, y: 460, w: 140, h: 16 },
      { x: 580, y: 470, w: 120, h: 16 },
      { x: 920, y: 460, w: 140, h: 10, type: 'oneway' },
      { x: 1280, y: 470, w: 130, h: 16 },
      { x: 1620, y: 460, w: 120, h: 16 },

      // Level 5 (y~300) — high escape
      { x: 440, y: 300, w: 120, h: 16 },
      { x: 840, y: 290, w: 140, h: 16 },
      { x: 1280, y: 300, w: 120, h: 16 },

      // Trampolines — at gap edges for vertical access
      { x: 420, y: 1120, w: 50, h: 12, type: 'trampoline' },
      { x: 900, y: 1120, w: 50, h: 12, type: 'trampoline' },
      { x: 1420, y: 1120, w: 50, h: 12, type: 'trampoline' },
      { x: 320, y: 780, w: 50, h: 12, type: 'trampoline' },
      { x: 1120, y: 600, w: 50, h: 12, type: 'trampoline' },

      // Dash blocks — tagger tools
      { x: 740, y: 1120, w: 60, h: 14, type: 'dash_block' },
      { x: 1600, y: 960, w: 60, h: 14, type: 'dash_block' },
      { x: 480, y: 600, w: 60, h: 14, type: 'dash_block' },

      // Walls
      { x: 0, y: 0, w: 20, h: 1200 },
      { x: 1980, y: 0, w: 20, h: 1200 },
    ],
    spawns: [
      { x: 60, y: 1120 }, { x: 220, y: 1120 }, { x: 560, y: 1120 }, { x: 720, y: 1120 },
      { x: 1040, y: 1120 }, { x: 1240, y: 1120 }, { x: 1560, y: 1120 }, { x: 1800, y: 1120 },
    ],
  },

  factory: {
    name: 'Factory',
    width: 2400,
    height: 1400,
    bg: '#2C1810',
    theme: 'factory',
    platforms: [
      // Ground — industrial floor segments
      { x: 0, y: 1360, w: 380, h: 40 },
      { x: 520, y: 1360, w: 360, h: 40 },
      { x: 1020, y: 1360, w: 380, h: 40 },
      { x: 1540, y: 1360, w: 360, h: 40 },
      { x: 2040, y: 1360, w: 360, h: 40 },

      // Level 1 (y~1180) — catwalks
      { x: 100, y: 1180, w: 140, h: 16 },
      { x: 420, y: 1190, w: 120, h: 14, type: 'crumble' },
      { x: 700, y: 1180, w: 150, h: 16 },
      { x: 1040, y: 1190, w: 120, h: 10, type: 'jumpthrough' },
      { x: 1360, y: 1180, w: 140, h: 16 },
      { x: 1680, y: 1190, w: 120, h: 14, type: 'crumble' },
      { x: 1980, y: 1180, w: 150, h: 16 },
      { x: 2260, y: 1190, w: 120, h: 16 },

      // Level 2 (y~1000) — mid catwalks
      { x: 60, y: 1000, w: 130, h: 16 },
      { x: 360, y: 1010, w: 140, h: 16 },
      { x: 660, y: 1000, w: 120, h: 10, type: 'jumpthrough' },
      { x: 980, y: 1010, w: 130, h: 16 },
      { x: 1300, y: 1000, w: 120, h: 14, type: 'crumble' },
      { x: 1620, y: 1010, w: 140, h: 16 },
      { x: 1940, y: 1000, w: 120, h: 10, type: 'jumpthrough' },
      { x: 2240, y: 1010, w: 130, h: 16 },

      // Level 3 (y~820) — grate platforms
      { x: 180, y: 820, w: 130, h: 16 },
      { x: 500, y: 830, w: 120, h: 10, type: 'oneway' },
      { x: 820, y: 820, w: 140, h: 16 },
      { x: 1160, y: 830, w: 130, h: 16 },
      { x: 1480, y: 820, w: 120, h: 10, type: 'oneway' },
      { x: 1800, y: 830, w: 140, h: 16 },
      { x: 2120, y: 820, w: 120, h: 16 },

      // Level 4 (y~640) — upper catwalks
      { x: 100, y: 640, w: 120, h: 16 },
      { x: 400, y: 650, w: 130, h: 14, type: 'crumble' },
      { x: 720, y: 640, w: 120, h: 16 },
      { x: 1060, y: 650, w: 120, h: 10, type: 'oneway' },
      { x: 1380, y: 640, w: 140, h: 16 },
      { x: 1700, y: 650, w: 120, h: 14, type: 'crumble' },
      { x: 2020, y: 640, w: 130, h: 16 },

      // Level 5 (y~460) — high route
      { x: 300, y: 460, w: 130, h: 16 },
      { x: 660, y: 470, w: 120, h: 16 },
      { x: 1020, y: 460, w: 140, h: 16 },
      { x: 1400, y: 470, w: 120, h: 16 },
      { x: 1760, y: 460, w: 130, h: 16 },
      { x: 2100, y: 470, w: 120, h: 16 },

      // Level 6 (y~300) — top escape
      { x: 540, y: 300, w: 120, h: 16 },
      { x: 960, y: 290, w: 140, h: 16 },
      { x: 1400, y: 300, w: 120, h: 16 },
      { x: 1840, y: 290, w: 130, h: 16 },

      // Trampolines — vertical shortcuts
      { x: 440, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 960, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 1480, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 2000, y: 1320, w: 50, h: 12, type: 'trampoline' },
      { x: 340, y: 780, w: 50, h: 12, type: 'trampoline' },
      { x: 1240, y: 780, w: 50, h: 12, type: 'trampoline' },
      { x: 2180, y: 780, w: 50, h: 12, type: 'trampoline' },

      // Dash blocks — tagger advantage
      { x: 780, y: 1320, w: 60, h: 14, type: 'dash_block' },
      { x: 1780, y: 1320, w: 60, h: 14, type: 'dash_block' },
      { x: 600, y: 960, w: 60, h: 14, type: 'dash_block' },
      { x: 1560, y: 780, w: 60, h: 14, type: 'dash_block' },

      // Interior pillars for wall-jumping
      { x: 480, y: 1040, w: 18, h: 320 },
      { x: 1200, y: 840, w: 18, h: 320 },
      { x: 1900, y: 1040, w: 18, h: 320 },

      // Walls
      { x: 0, y: 0, w: 20, h: 1400 },
      { x: 2380, y: 0, w: 20, h: 1400 },
    ],
    spawns: [
      { x: 80, y: 1320 }, { x: 300, y: 1320 }, { x: 600, y: 1320 }, { x: 860, y: 1320 },
      { x: 1100, y: 1320 }, { x: 1380, y: 1320 }, { x: 1620, y: 1320 }, { x: 2120, y: 1320 },
    ],
  },
};

export const defaultMap = 'playground';
export const mapList = Object.keys(maps);
