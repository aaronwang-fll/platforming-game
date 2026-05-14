// Physics — deliberately slower paced
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;
export const SNAPSHOT_INTERVAL = 3;

export const GRAVITY = 0.45;
export const MOVE_SPEED = 3.5;
export const JUMP_FORCE = -10.5;
export const MAX_FALL_SPEED = 8;

export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 26;

export const TAG_RADIUS = 34;
export const TAG_IMMUNITY_MS = 3000;
export const IT_SPEED_BOOST = 1.15;

export const WALL_SLIDE_SPEED = 1.8;
export const WALL_JUMP_FORCE_X = 5;
export const WALL_JUMP_FORCE_Y = -9;

// Smooth movement
export const MOVE_ACCEL = 0.4;
export const MOVE_FRICTION = 0.7;

// Double jump
export const DOUBLE_JUMP_FORCE = -9;

// Trampoline / Bounce
export const TRAMPOLINE_FORCE = -14;

// Speed pad — actual velocity boost while standing on it
export const SPEED_PAD_MULTIPLIER = 2.2;

// Crumble blocks
export const CRUMBLE_DELAY = 12;
export const CRUMBLE_GONE_TIME = 180;

// Dash
export const DASH_CHARGE_RATE = 1 / (5 * 60);
export const DASH_SPEED = 11;
export const DASH_DURATION = 8;

// Game
export const MAX_PLAYERS = 8;
export const CLASSIC_ROUND_TIME = 120;
export const FREEZE_ROUND_TIME = 180;
export const INFECTION_ROUND_TIME = 180;
export const UNFREEZE_TIME = 1.5;

// Rendering
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

// Vibrant player colors
export const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA'
];
