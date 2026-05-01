// Physics
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;
export const SNAPSHOT_INTERVAL = 3;

export const GRAVITY = 0.55;
export const MOVE_SPEED = 4.5;
export const JUMP_FORCE = -11.5;
export const MAX_FALL_SPEED = 10;

export const PLAYER_WIDTH = 34;
export const PLAYER_HEIGHT = 34;

export const TAG_RADIUS = 42;
export const TAG_IMMUNITY_MS = 3000;
export const IT_SPEED_BOOST = 1.15;

export const WALL_SLIDE_SPEED = 2;
export const WALL_JUMP_FORCE_X = 6;
export const WALL_JUMP_FORCE_Y = -10;

// Smooth movement
export const MOVE_ACCEL = 0.45;     // lerp factor toward target speed
export const MOVE_FRICTION = 0.72;  // multiplier when no input (deceleration)

// Double jump (replaces wall-jump cooldown)
export const DOUBLE_JUMP_FORCE = -10; // slightly weaker than ground jump

// Trampoline
export const TRAMPOLINE_FORCE = -16;

// Dash
export const DASH_CHARGE_RATE = 1 / (5 * 60); // fills in 5 seconds (per tick)
export const DASH_SPEED = 14;
export const DASH_DURATION = 8; // ticks

// Game
export const MAX_PLAYERS = 8;
export const CLASSIC_ROUND_TIME = 120;
export const FREEZE_ROUND_TIME = 180;
export const INFECTION_ROUND_TIME = 180;
export const UNFREEZE_TIME = 1.5;

// Rendering
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

// Vibrant .io-style player colors
export const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA'
];
