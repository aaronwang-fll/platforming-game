// Physics
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;
export const SNAPSHOT_INTERVAL = 3; // send snapshot every N ticks

export const GRAVITY = 0.6;
export const MOVE_SPEED = 4;
export const JUMP_FORCE = -12;
export const MAX_FALL_SPEED = 10;

export const PLAYER_WIDTH = 36;
export const PLAYER_HEIGHT = 36;

export const TAG_RADIUS = 40;
export const TAG_IMMUNITY_MS = 1000;
export const IT_SPEED_BOOST = 1.15;

export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_FORCE_X = 6;
export const WALL_JUMP_FORCE_Y = -10;

// Game
export const MAX_PLAYERS = 8;
export const CLASSIC_ROUND_TIME = 120; // seconds
export const FREEZE_ROUND_TIME = 180;
export const INFECTION_ROUND_TIME = 180;
export const UNFREEZE_TIME = 1.5; // seconds standing near to unfreeze

// Rendering
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Player colors
export const PLAYER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#ecf0f1'
];
