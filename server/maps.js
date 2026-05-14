// Map design for multiplayer tag platformer
// Physics: single jump 117px, double jump 203px, trampoline 211px
// Player 26x26, move speed 3.5 px/tick
// All platforms 32px tall, walls 32px wide, trampolines 64x12
// Max 100px vertical gap between adjacent reachable surfaces
// Ground is always continuous — no death pits

export const maps = {
  playground: {
    name: 'Playground',
    width: 2000,
    height: 1200,
    bg: '#7EC8E3',
    theme: 'sky',
    platforms: [
      // ============================================================
      // GROUND FLOOR — continuous, y = 1168
      // ============================================================
      { x: 0, y: 1168, w: 2000, h: 32 },

      // ============================================================
      // GROUND-LEVEL SPEED PADS — long corridors for chasing
      // ============================================================
      // Left speed pad
      { x: 40, y: 1136, w: 380, h: 32, type: 'dash_block' },
      // Right speed pad
      { x: 1580, y: 1136, w: 380, h: 32, type: 'dash_block' },

      // ============================================================
      // LEVEL 1 — y = 1068 (100px above ground)
      // Left staircase entry, right staircase entry, center trampoline shortcut
      // ============================================================

      // -- Left staircase: 3 stepping stones from ground to L1 --
      { x: 40, y: 1118, w: 128, h: 32 },       // step 1 (50px up from ground)
      { x: 40, y: 1068, w: 200, h: 32 },        // L1 left platform

      // -- Left L1 main platform --
      { x: 200, y: 1068, w: 400, h: 32 },

      // -- Center gap bridged by jumpthrough --
      // Trampoline on ground, directly below this jumpthrough
      { x: 700, y: 1068, w: 300, h: 32, type: 'jumpthrough' },

      // -- Right L1 main platform --
      { x: 1100, y: 1068, w: 500, h: 32 },

      // -- Right staircase entry --
      { x: 1760, y: 1068, w: 200, h: 32 },
      { x: 1830, y: 1118, w: 128, h: 32 },      // step from ground

      // -- Crumble bridge connecting left and right L1 across center --
      { x: 880, y: 1068, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // LEVEL 2 — y = 968 (100px above L1)
      // Accessible by single jump from L1
      // ============================================================

      // -- Left L2 platform (above left staircase area) --
      { x: 40, y: 968, w: 300, h: 32 },
      // Left wall forming structure with L1
      { x: 40, y: 968, w: 32, h: 100 },

      // -- Center-left L2 platform --
      { x: 440, y: 968, w: 250, h: 32 },

      // -- Center L2 — wide jumpthrough (can jump up from L1 jumpthrough below) --
      { x: 750, y: 968, w: 280, h: 32, type: 'jumpthrough' },

      // -- Center-right L2 platform --
      { x: 1100, y: 968, w: 250, h: 32 },

      // -- Right L2 platform --
      { x: 1500, y: 968, w: 300, h: 32 },
      // Right wall forming structure with L1
      { x: 1768, y: 968, w: 32, h: 100 },

      // -- Speed pad on L2 left --
      { x: 60, y: 936, w: 260, h: 32, type: 'dash_block' },

      // ============================================================
      // LEVEL 3 — y = 868 (100px above L2)
      // Single jump from L2
      // ============================================================

      // -- Left L3 —  upper left room roof --
      { x: 80, y: 868, w: 200, h: 32 },

      // -- Center-left L3 stepping stone --
      { x: 380, y: 868, w: 160, h: 32 },

      // -- Center L3 — main crossing platform --
      { x: 640, y: 868, w: 400, h: 32 },
      // Walls on center platform creating an open room
      { x: 640, y: 768, w: 32, h: 100 },
      { x: 1008, y: 768, w: 32, h: 100 },

      // -- Center-right L3 stepping stone --
      { x: 1140, y: 868, w: 160, h: 32 },

      // -- Right L3 — upper right room roof --
      { x: 1500, y: 868, w: 200, h: 32 },

      // -- Oneway drops on L3 edges --
      { x: 340, y: 868, w: 80, h: 32, type: 'oneway' },
      { x: 1360, y: 868, w: 80, h: 32, type: 'oneway' },

      // ============================================================
      // LEVEL 4 — y = 768 (100px above L3)
      // Requires single jump from L3; trampolines help from lower
      // ============================================================

      // -- Left L4 platform --
      { x: 120, y: 768, w: 220, h: 32 },

      // -- Center L4 — ceiling of center room, wide crossing --
      { x: 640, y: 768, w: 400, h: 32 },

      // -- Right L4 platform --
      { x: 1440, y: 768, w: 220, h: 32 },

      // -- Crumble bridge connecting left L4 to center L4 --
      { x: 420, y: 768, w: 120, h: 32, type: 'crumble' },

      // -- Crumble bridge connecting center L4 to right L4 --
      { x: 1140, y: 768, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // LEVEL 5 — y = 668 (100px above L4) — top level
      // Requires trampolines or wall-jump to reach from L4
      // ============================================================

      // -- Left top platform --
      { x: 200, y: 668, w: 200, h: 32 },

      // -- Center top platform (king of the hill) --
      { x: 800, y: 668, w: 200, h: 32 },

      // -- Right top platform --
      { x: 1400, y: 668, w: 200, h: 32 },

      // -- Oneway drop platforms connecting top level --
      { x: 500, y: 668, w: 100, h: 32, type: 'oneway' },
      { x: 1200, y: 668, w: 100, h: 32, type: 'oneway' },

      // ============================================================
      // TRAMPOLINES
      // ============================================================
      // Ground-level center trampoline — launches up through L1 jumpthrough
      { x: 818, y: 1156, w: 64, h: 12, type: 'trampoline' },
      // Ground-level left trampoline
      { x: 500, y: 1156, w: 64, h: 12, type: 'trampoline' },
      // Ground-level right trampoline
      { x: 1436, y: 1156, w: 64, h: 12, type: 'trampoline' },

      // L1 trampoline — launches up through L2 jumpthrough
      { x: 850, y: 1056, w: 64, h: 12, type: 'trampoline' },

      // L3 center room trampoline — launches to L5
      { x: 870, y: 856, w: 64, h: 12, type: 'trampoline' },

      // L4 trampoline on left — launches to L5
      { x: 250, y: 756, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // WALL-JUMP PILLARS
      // ============================================================
      // Left pillar (ground to L2 area)
      { x: 460, y: 968, w: 32, h: 200 },
      // Right pillar (ground to L2 area)
      { x: 1380, y: 968, w: 32, h: 200 },
      // Center-left pillar (L2 to L4)
      { x: 560, y: 768, w: 32, h: 200 },
      // Center-right pillar (L2 to L4)
      { x: 1080, y: 768, w: 32, h: 200 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1200 },
      { x: 1980, y: 0, w: 20, h: 1200 },
    ],
    spawns: [
      { x: 100, y: 1128 }, { x: 300, y: 1128 }, { x: 520, y: 1128 },
      { x: 750, y: 1128 }, { x: 1000, y: 1128 }, { x: 1250, y: 1128 },
      { x: 1500, y: 1128 }, { x: 1750, y: 1128 },
    ],
  },

  rooftops: {
    name: 'Rooftops',
    width: 2200,
    height: 1300,
    bg: '#0d1b2a',
    theme: 'rooftops',
    platforms: [
      // ============================================================
      // GROUND — continuous street level, y = 1268
      // ============================================================
      { x: 0, y: 1268, w: 2200, h: 32 },

      // ============================================================
      // GROUND SPEED PADS — street-level running
      // ============================================================
      { x: 50, y: 1236, w: 400, h: 32, type: 'dash_block' },
      { x: 1750, y: 1236, w: 400, h: 32, type: 'dash_block' },

      // ============================================================
      // BUILDING 1 — short left building (x: 40–420)
      // Roof at L2 = y:1068, internal floor at L1 = y:1168
      // ============================================================
      // Left wall
      { x: 40, y: 1068, w: 32, h: 200 },
      // Right wall — gap at bottom for ground entry
      { x: 388, y: 1068, w: 32, h: 100 },
      // Internal floor (L1 = 100px above ground)
      { x: 40, y: 1168, w: 380, h: 32 },
      // Jumpthrough mid-level (fire escape)
      { x: 72, y: 1118, w: 280, h: 32, type: 'jumpthrough' },
      // Roof
      { x: 40, y: 1068, w: 380, h: 32 },
      // Speed pad on roof
      { x: 60, y: 1036, w: 340, h: 32, type: 'dash_block' },

      // ============================================================
      // FIRE ESCAPE — Building 1 exterior right (staircase up)
      // Steps from ground to roof, 50-80px gaps
      // ============================================================
      { x: 420, y: 1198, w: 96, h: 32 },      // step 1 (70px above ground)
      { x: 420, y: 1128, w: 96, h: 32 },      // step 2 (70px up)
      { x: 420, y: 1068, w: 96, h: 32 },      // step 3 reaches roof level

      // ============================================================
      // SKYBRIDGE 1→2 (x: 420–620)
      // ============================================================
      { x: 516, y: 1068, w: 104, h: 32 },
      // Crumble shortcut above skybridge
      { x: 480, y: 968, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // BUILDING 2 — tall center-left building (x: 580–920)
      // Roof at L3 = y:968, floors at L2 and L1
      // ============================================================
      // Left wall
      { x: 580, y: 968, w: 32, h: 300 },
      // Right wall — gap in middle for entry
      { x: 888, y: 968, w: 32, h: 140 },
      { x: 888, y: 1188, w: 32, h: 80 },
      // Internal floor 1 (L1 = y:1168)
      { x: 580, y: 1168, w: 340, h: 32 },
      // Jumpthrough internal (L1.5 = y:1068)
      { x: 612, y: 1068, w: 280, h: 32, type: 'jumpthrough' },
      // Roof (L3)
      { x: 580, y: 968, w: 340, h: 32 },
      // Trampoline inside building on floor — launches through jumpthrough
      { x: 720, y: 1156, w: 64, h: 12, type: 'trampoline' },

      // -- Fire escape exterior right of Building 2 --
      { x: 920, y: 1168, w: 96, h: 32 },
      { x: 920, y: 1068, w: 96, h: 32 },
      { x: 920, y: 968, w: 96, h: 32 },

      // ============================================================
      // SKYBRIDGE 2→3 (x: 1016–1160)
      // ============================================================
      { x: 1016, y: 1068, w: 144, h: 32 },
      // Upper walkway
      { x: 1016, y: 968, w: 144, h: 32, type: 'oneway' },

      // ============================================================
      // BUILDING 3 — wide center building (x: 1120–1560)
      // Roof at L3 = y:968, tallest main building
      // ============================================================
      // Left wall
      { x: 1120, y: 868, w: 32, h: 300 },
      // Right wall — gap at bottom
      { x: 1528, y: 868, w: 32, h: 200 },
      // Internal floor 1 (y:1168)
      { x: 1120, y: 1168, w: 440, h: 32 },
      // Jumpthrough mid (y:1068)
      { x: 1152, y: 1068, w: 380, h: 32, type: 'jumpthrough' },
      // Internal solid floor (y:968)
      { x: 1120, y: 968, w: 440, h: 32 },
      // Roof (L4 = y:868)
      { x: 1120, y: 868, w: 440, h: 32 },
      // Speed pad on roof
      { x: 1160, y: 836, w: 360, h: 32, type: 'dash_block' },
      // Interior pillar for wall-jump
      { x: 1340, y: 968, w: 32, h: 200 },
      // Trampoline on internal floor 1 — launches through jumpthrough
      { x: 1300, y: 1156, w: 64, h: 12, type: 'trampoline' },

      // -- Fire escape exterior right of Building 3 --
      { x: 1560, y: 1198, w: 96, h: 32 },
      { x: 1560, y: 1098, w: 96, h: 32 },
      { x: 1560, y: 998, w: 96, h: 32 },

      // ============================================================
      // SKYBRIDGE 3→4 (x: 1560–1700)
      // ============================================================
      { x: 1656, y: 1068, w: 100, h: 32 },
      // Crumble shortcut
      { x: 1620, y: 868, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // BUILDING 4 — right building (x: 1720–2060)
      // Roof at L2 = y:1068
      // ============================================================
      // Left wall — gap at bottom
      { x: 1720, y: 1068, w: 32, h: 100 },
      // Right wall
      { x: 2028, y: 1068, w: 32, h: 200 },
      // Internal floor (y:1168)
      { x: 1720, y: 1168, w: 340, h: 32 },
      // Jumpthrough inside (y:1118)
      { x: 1752, y: 1118, w: 260, h: 32, type: 'jumpthrough' },
      // Roof
      { x: 1720, y: 1068, w: 340, h: 32 },
      // Speed pad on roof
      { x: 1740, y: 1036, w: 300, h: 32, type: 'dash_block' },

      // -- Fire escape left of Building 4 --
      { x: 1656, y: 1168, w: 96, h: 32 },

      // ============================================================
      // UPPER ROOFTOP LEVEL — y:868 and above
      // Above buildings, connected platforms
      // ============================================================
      // Above Building 1 — ladder up from roof
      { x: 80, y: 968, w: 180, h: 32 },
      // Above skybridge 1-2
      { x: 360, y: 868, w: 160, h: 32 },
      // Above Building 2
      { x: 620, y: 868, w: 200, h: 32 },
      // Stepping stones across upper level
      { x: 900, y: 868, w: 120, h: 32, type: 'oneway' },
      // Above Building 4
      { x: 1780, y: 968, w: 180, h: 32 },

      // ============================================================
      // TOP LEVEL — antenna platforms y:768
      // 100px above L4
      // ============================================================
      { x: 200, y: 768, w: 160, h: 32 },
      { x: 500, y: 768, w: 160, h: 32 },
      { x: 850, y: 768, w: 160, h: 32 },
      { x: 1200, y: 768, w: 200, h: 32 },
      { x: 1600, y: 768, w: 160, h: 32 },
      { x: 1900, y: 768, w: 160, h: 32, type: 'oneway' },

      // ============================================================
      // TRAMPOLINES
      // ============================================================
      // Ground-level trampolines
      { x: 100, y: 1256, w: 64, h: 12, type: 'trampoline' },
      { x: 1050, y: 1256, w: 64, h: 12, type: 'trampoline' },
      { x: 2000, y: 1256, w: 64, h: 12, type: 'trampoline' },

      // Roof of Building 1 — launches to upper level
      { x: 200, y: 1056, w: 64, h: 12, type: 'trampoline' },
      // Roof of Building 3 — launches to top level
      { x: 1280, y: 856, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // WALL-JUMP PILLARS
      // ============================================================
      { x: 540, y: 1068, w: 32, h: 200 },
      { x: 1680, y: 968, w: 32, h: 300 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1300 },
      { x: 2180, y: 0, w: 20, h: 1300 },
    ],
    spawns: [
      { x: 100, y: 1228 }, { x: 350, y: 1228 }, { x: 600, y: 1228 },
      { x: 880, y: 1228 }, { x: 1100, y: 1228 }, { x: 1400, y: 1228 },
      { x: 1700, y: 1228 }, { x: 1950, y: 1228 },
    ],
  },

  sunset_park: {
    name: 'Sunset Park',
    width: 2000,
    height: 1200,
    bg: '#FF9A76',
    theme: 'sunset',
    platforms: [
      // ============================================================
      // GROUND — continuous, y = 1168
      // ============================================================
      { x: 0, y: 1168, w: 2000, h: 32 },

      // ============================================================
      // GROUND SPEED PADS — race track feel (3 segments)
      // ============================================================
      { x: 40, y: 1136, w: 400, h: 32, type: 'dash_block' },
      { x: 800, y: 1136, w: 400, h: 32, type: 'dash_block' },
      { x: 1560, y: 1136, w: 400, h: 32, type: 'dash_block' },

      // ============================================================
      // AREA 1 — LEFT PAVILION (x: 40–600)
      // Open structure with multiple levels, loop-friendly
      // ============================================================

      // -- L1 floor (y:1068, 100px above ground) --
      { x: 40, y: 1068, w: 280, h: 32 },
      { x: 400, y: 1068, w: 200, h: 32 },
      // Jumpthrough bridge between L1 sections
      { x: 280, y: 1068, w: 160, h: 32, type: 'jumpthrough' },
      // Left wall
      { x: 40, y: 968, w: 32, h: 100 },
      // Staircase step from ground to L1
      { x: 40, y: 1118, w: 100, h: 32 },

      // -- L2 floor (y:968) --
      { x: 40, y: 968, w: 200, h: 32 },
      { x: 340, y: 968, w: 260, h: 32 },
      // Crumble bridge between L2 sections
      { x: 200, y: 968, w: 100, h: 32, type: 'crumble' },

      // -- L3 (y:868) — pavilion roof --
      { x: 100, y: 868, w: 300, h: 32 },
      { x: 460, y: 868, w: 140, h: 32, type: 'oneway' },

      // -- Interior features --
      // Trampoline on L1 floor — launches through jumpthrough area
      { x: 320, y: 1056, w: 64, h: 12, type: 'trampoline' },
      // Wall-jump pillar inside pavilion
      { x: 260, y: 968, w: 32, h: 100 },

      // ============================================================
      // CORRIDOR 1→2 (x: 600–780)
      // Ground-level connecting path with overhead cover
      // ============================================================
      // L1 overhead cover
      { x: 600, y: 1068, w: 180, h: 32 },
      // Stepping stone mid-corridor
      { x: 640, y: 968, w: 120, h: 32 },

      // ============================================================
      // AREA 2 — CENTER HUB (x: 740–1280)
      // Largest area — vertical tower with surrounding platforms
      // Loop: left side up, across top, right side down
      // ============================================================

      // -- L1 floor (y:1068) --
      { x: 740, y: 1068, w: 540, h: 32 },

      // -- L2 (y:968) -- two platforms with gap --
      { x: 740, y: 968, w: 200, h: 32 },
      { x: 1060, y: 968, w: 220, h: 32 },
      // Jumpthrough spanning the gap
      { x: 900, y: 968, w: 200, h: 32, type: 'jumpthrough' },

      // -- L3 (y:868) -- wide crossing --
      { x: 780, y: 868, w: 460, h: 32 },
      // Walls creating an open room
      { x: 780, y: 768, w: 32, h: 100 },
      { x: 1208, y: 768, w: 32, h: 100 },

      // -- L4 (y:768) -- room ceiling --
      { x: 780, y: 768, w: 460, h: 32 },

      // -- L5 (y:668) -- top of hub --
      { x: 860, y: 668, w: 300, h: 32 },

      // -- Speed pad on L3 --
      { x: 820, y: 836, w: 380, h: 32, type: 'dash_block' },

      // -- Left staircase up hub (outside left wall) --
      { x: 680, y: 1068, w: 100, h: 32 },
      { x: 680, y: 968, w: 100, h: 32 },
      { x: 680, y: 868, w: 100, h: 32 },

      // -- Right staircase down hub --
      { x: 1240, y: 968, w: 100, h: 32 },
      { x: 1280, y: 868, w: 100, h: 32 },
      { x: 1240, y: 768, w: 100, h: 32 },

      // -- Trampolines in hub --
      // On L1 floor, launches through L2 jumpthrough
      { x: 960, y: 1056, w: 64, h: 12, type: 'trampoline' },
      // On L3 floor, launches toward L5
      { x: 980, y: 856, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // CORRIDOR 2→3 (x: 1280–1440)
      // ============================================================
      // L1 level bridge
      { x: 1280, y: 1068, w: 160, h: 32 },
      // Crumble at L2 level
      { x: 1300, y: 968, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // AREA 3 — RIGHT GARDENS (x: 1400–1960)
      // Alternating levels with jumpthroughs for vertical flexibility
      // ============================================================

      // -- L1 (y:1068) --
      { x: 1400, y: 1068, w: 560, h: 32 },
      // Step from ground
      { x: 1900, y: 1118, w: 100, h: 32 },

      // -- L2 (y:968) --
      { x: 1440, y: 968, w: 240, h: 32 },
      { x: 1760, y: 968, w: 200, h: 32 },
      // Jumpthrough connecting
      { x: 1640, y: 968, w: 160, h: 32, type: 'jumpthrough' },

      // -- L3 (y:868) --
      { x: 1500, y: 868, w: 300, h: 32 },
      { x: 1860, y: 868, w: 100, h: 32, type: 'oneway' },
      // Right wall
      { x: 1928, y: 868, w: 32, h: 100 },

      // -- L4 (y:768) --
      { x: 1560, y: 768, w: 200, h: 32 },
      // Crumble bridge to right
      { x: 1820, y: 768, w: 100, h: 32, type: 'crumble' },

      // -- L5 (y:668) --
      { x: 1600, y: 668, w: 160, h: 32 },

      // -- Trampoline on L1 launches through L2 jumpthrough --
      { x: 1700, y: 1056, w: 64, h: 12, type: 'trampoline' },

      // -- Interior pillar for wall-jump --
      { x: 1700, y: 868, w: 32, h: 100 },

      // ============================================================
      // UPPER LOOP CONNECTIONS — connect all three areas at top
      // ============================================================
      // Left to center (L4-L5 level)
      { x: 500, y: 768, w: 160, h: 32 },
      { x: 500, y: 668, w: 160, h: 32, type: 'oneway' },

      // Center to right (L5 level)
      { x: 1200, y: 668, w: 160, h: 32 },
      { x: 1400, y: 668, w: 120, h: 32, type: 'oneway' },

      // ============================================================
      // GROUND TRAMPOLINES
      // ============================================================
      { x: 150, y: 1156, w: 64, h: 12, type: 'trampoline' },
      { x: 600, y: 1156, w: 64, h: 12, type: 'trampoline' },
      { x: 1450, y: 1156, w: 64, h: 12, type: 'trampoline' },
      { x: 1880, y: 1156, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // WALL-JUMP PILLARS
      // ============================================================
      { x: 620, y: 1068, w: 32, h: 200 },
      { x: 1360, y: 868, w: 32, h: 300 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1200 },
      { x: 1980, y: 0, w: 20, h: 1200 },
    ],
    spawns: [
      { x: 100, y: 1128 }, { x: 300, y: 1128 }, { x: 550, y: 1128 },
      { x: 780, y: 1128 }, { x: 1000, y: 1128 }, { x: 1300, y: 1128 },
      { x: 1600, y: 1128 }, { x: 1850, y: 1128 },
    ],
  },

  factory: {
    name: 'Factory',
    width: 2400,
    height: 1400,
    bg: '#2C1810',
    theme: 'factory',
    platforms: [
      // ============================================================
      // GROUND — continuous, y = 1368
      // ============================================================
      { x: 0, y: 1368, w: 2400, h: 32 },

      // ============================================================
      // GROUND SPEED PADS — conveyor belts
      // ============================================================
      { x: 40, y: 1336, w: 400, h: 32, type: 'dash_block' },
      { x: 1000, y: 1336, w: 400, h: 32, type: 'dash_block' },
      { x: 1960, y: 1336, w: 400, h: 32, type: 'dash_block' },

      // ============================================================
      // ZONE 1 — LEFT INTAKE (x: 40–520)
      // U-shaped intake bay with internal floors
      // ============================================================

      // -- L1 (y:1268, 100px above ground) --
      { x: 40, y: 1268, w: 480, h: 32 },
      // Left wall
      { x: 40, y: 1068, w: 32, h: 200 },
      // Right wall — gap at bottom for entry
      { x: 488, y: 1068, w: 32, h: 120 },
      // Step from ground to L1
      { x: 40, y: 1318, w: 100, h: 32 },

      // -- L2 (y:1168) --
      { x: 72, y: 1168, w: 416, h: 32 },
      // Jumpthrough at L1.5 for flexibility
      { x: 100, y: 1218, w: 300, h: 32, type: 'jumpthrough' },

      // -- L3 (y:1068) — roof --
      { x: 40, y: 1068, w: 480, h: 32 },

      // -- Speed pad on L2 --
      { x: 100, y: 1136, w: 360, h: 32, type: 'dash_block' },

      // -- Interior pillar for wall-jump --
      { x: 260, y: 1168, w: 32, h: 100 },

      // -- Trampoline on L1, launches through jumpthrough to L2 --
      { x: 180, y: 1256, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // ESCAPE SHAFT 1 (x: 480–580)
      // Vertical shaft with jumpthrough — trampoline launch
      // ============================================================
      // Jumpthrough above intake roof
      { x: 480, y: 968, w: 120, h: 32, type: 'jumpthrough' },
      // Trampoline on intake roof
      { x: 500, y: 1056, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // ZONE 2 — PROCESSING HALL (x: 520–1000)
      // Wide room, multiple stories, central pillar
      // ============================================================

      // -- L1 (y:1268) --
      { x: 520, y: 1268, w: 480, h: 32 },

      // -- L2 (y:1168) --
      { x: 560, y: 1168, w: 200, h: 32 },
      { x: 840, y: 1168, w: 160, h: 32 },
      // Jumpthrough connecting L2 sections
      { x: 720, y: 1168, w: 160, h: 32, type: 'jumpthrough' },

      // -- L3 (y:1068) --
      { x: 520, y: 1068, w: 480, h: 32 },
      // Left wall
      { x: 520, y: 1068, w: 32, h: 200 },
      // Right wall — gap for entry
      { x: 968, y: 1068, w: 32, h: 100 },

      // -- L4 (y:968) — roof --
      { x: 560, y: 968, w: 400, h: 32 },

      // -- Central pillar --
      { x: 740, y: 1068, w: 32, h: 200 },

      // -- Jumpthrough escape from L3 to L4 --
      { x: 600, y: 1018, w: 240, h: 32, type: 'jumpthrough' },

      // -- Trampoline on L1 --
      { x: 750, y: 1256, w: 64, h: 12, type: 'trampoline' },

      // -- Speed pad on L3 --
      { x: 560, y: 1036, w: 380, h: 32, type: 'dash_block' },

      // ============================================================
      // CORRIDOR 2→3 (x: 1000–1200)
      // Multi-level corridor
      // ============================================================
      // L1 floor
      { x: 1000, y: 1268, w: 200, h: 32 },
      // L3 bridge
      { x: 1000, y: 1068, w: 200, h: 32 },
      // Crumble at L2 level
      { x: 1020, y: 1168, w: 120, h: 32, type: 'crumble' },
      // L4 stepping stone
      { x: 1040, y: 968, w: 120, h: 32, type: 'oneway' },

      // ============================================================
      // ZONE 3 — CENTRAL TOWER (x: 1160–1560)
      // Tallest structure, many levels, escape shafts
      // ============================================================

      // -- L1 (y:1268) --
      { x: 1160, y: 1268, w: 400, h: 32 },

      // -- L2 (y:1168) --
      { x: 1200, y: 1168, w: 320, h: 32 },

      // -- L3 (y:1068) --
      { x: 1160, y: 1068, w: 400, h: 32 },

      // -- L4 (y:968) --
      { x: 1200, y: 968, w: 320, h: 32 },

      // -- L5 (y:868) — tower top --
      { x: 1160, y: 868, w: 400, h: 32 },

      // -- Walls --
      // Left wall (full height)
      { x: 1160, y: 868, w: 32, h: 400 },
      // Right wall — gaps for entries at L1 and L3
      { x: 1528, y: 868, w: 32, h: 140 },
      { x: 1528, y: 1108, w: 32, h: 60 },
      { x: 1528, y: 1228, w: 32, h: 40 },

      // -- Jumpthroughs for vertical escape --
      { x: 1220, y: 1118, w: 280, h: 32, type: 'jumpthrough' },
      { x: 1220, y: 918, w: 280, h: 32, type: 'jumpthrough' },

      // -- Interior pillar --
      { x: 1360, y: 1068, w: 32, h: 200 },

      // -- Speed pad on top --
      { x: 1200, y: 836, w: 320, h: 32, type: 'dash_block' },

      // -- Trampolines --
      // On L1, launches through L2 jumpthrough
      { x: 1320, y: 1256, w: 64, h: 12, type: 'trampoline' },
      // On L3, launches through L4 jumpthrough
      { x: 1320, y: 1056, w: 64, h: 12, type: 'trampoline' },
      // On L5 top, launches to upper platforms
      { x: 1340, y: 856, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // CORRIDOR 3→4 (x: 1560–1740)
      // ============================================================
      // L1 floor
      { x: 1560, y: 1268, w: 180, h: 32 },
      // L3 bridge
      { x: 1560, y: 1068, w: 180, h: 32 },
      // Crumble at L4
      { x: 1580, y: 968, w: 120, h: 32, type: 'crumble' },

      // ============================================================
      // ZONE 4 — RIGHT ASSEMBLY BAY (x: 1700–2100)
      // L-shaped structure, multiple entries
      // ============================================================

      // -- L1 (y:1268) --
      { x: 1700, y: 1268, w: 400, h: 32 },
      // Step from ground
      { x: 2060, y: 1318, w: 100, h: 32 },

      // -- L2 (y:1168) --
      { x: 1740, y: 1168, w: 320, h: 32 },
      // Jumpthrough
      { x: 1760, y: 1218, w: 260, h: 32, type: 'jumpthrough' },

      // -- L3 (y:1068) --
      { x: 1700, y: 1068, w: 400, h: 32 },
      // Left wall
      { x: 1700, y: 1068, w: 32, h: 200 },
      // Right wall
      { x: 2068, y: 968, w: 32, h: 300 },

      // -- L4 (y:968) — upper floor --
      { x: 1740, y: 968, w: 328, h: 32 },

      // -- Speed pad on L2 --
      { x: 1760, y: 1136, w: 280, h: 32, type: 'dash_block' },

      // -- Interior pillar --
      { x: 1900, y: 1068, w: 32, h: 200 },

      // -- Trampoline on L1 --
      { x: 1840, y: 1256, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // ZONE 5 — FAR RIGHT STORAGE (x: 2100–2360)
      // Small room, speed pad, escape options
      // ============================================================

      // -- L1 (y:1268) --
      { x: 2100, y: 1268, w: 260, h: 32 },

      // -- L2 (y:1168) --
      { x: 2140, y: 1168, w: 180, h: 32 },
      // Jumpthrough
      { x: 2140, y: 1218, w: 180, h: 32, type: 'jumpthrough' },

      // -- L3 (y:1068) — roof --
      { x: 2100, y: 1068, w: 260, h: 32 },
      // Right wall
      { x: 2328, y: 1068, w: 32, h: 200 },

      // -- Speed pad --
      { x: 2140, y: 1136, w: 180, h: 32, type: 'dash_block' },

      // ============================================================
      // UPPER CATWALKS — above all structures
      // Connected path across the top of the factory
      // ============================================================

      // Above Zone 1 (L4 = y:968)
      { x: 80, y: 968, w: 200, h: 32 },

      // Stepping stone
      { x: 360, y: 868, w: 140, h: 32 },

      // Above corridor 2-3
      { x: 1040, y: 868, w: 140, h: 32 },

      // Above Zone 4
      { x: 1740, y: 868, w: 200, h: 32 },

      // Above Zone 5
      { x: 2140, y: 968, w: 180, h: 32 },

      // ============================================================
      // TOP LEVEL — crane rail platforms (y:768)
      // 100px above L5
      // ============================================================
      { x: 160, y: 768, w: 160, h: 32 },
      { x: 500, y: 768, w: 160, h: 32 },
      { x: 840, y: 768, w: 160, h: 32 },
      { x: 1160, y: 768, w: 200, h: 32 },
      { x: 1560, y: 768, w: 160, h: 32 },
      { x: 1900, y: 768, w: 160, h: 32 },
      { x: 2200, y: 768, w: 160, h: 32, type: 'oneway' },

      // ============================================================
      // GROUND TRAMPOLINES
      // ============================================================
      { x: 80, y: 1356, w: 64, h: 12, type: 'trampoline' },
      { x: 600, y: 1356, w: 64, h: 12, type: 'trampoline' },
      { x: 1100, y: 1356, w: 64, h: 12, type: 'trampoline' },
      { x: 1650, y: 1356, w: 64, h: 12, type: 'trampoline' },
      { x: 2200, y: 1356, w: 64, h: 12, type: 'trampoline' },

      // ============================================================
      // WALL-JUMP PILLARS — standalone
      // ============================================================
      { x: 480, y: 1168, w: 32, h: 200 },
      { x: 1140, y: 968, w: 32, h: 300 },
      { x: 1700, y: 868, w: 32, h: 200 },
      { x: 2100, y: 1168, w: 32, h: 200 },

      // ============================================================
      // BOUNDARY WALLS
      // ============================================================
      { x: 0, y: 0, w: 20, h: 1400 },
      { x: 2380, y: 0, w: 20, h: 1400 },
    ],
    spawns: [
      { x: 100, y: 1328 }, { x: 380, y: 1328 }, { x: 660, y: 1328 },
      { x: 940, y: 1328 }, { x: 1220, y: 1328 }, { x: 1500, y: 1328 },
      { x: 1800, y: 1328 }, { x: 2100, y: 1328 },
    ],
  },
};

export const defaultMap = 'playground';
export const mapList = Object.keys(maps);
