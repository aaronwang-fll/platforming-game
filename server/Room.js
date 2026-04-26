import { Player } from './Player.js';
import { GameState } from './GameState.js';
import { maps, defaultMap } from './maps.js';
import { S, MODES } from '../shared/protocol.js';
import { PLAYER_COLORS, MAX_PLAYERS } from '../shared/constants.js';

export class Room {
  constructor(code) {
    this.code = code;
    this.players = new Map(); // id -> Player
    this.sockets = new Map(); // id -> ws
    this.hostId = null;
    this.mode = MODES.CLASSIC;
    this.mapName = defaultMap;
    this.state = 'lobby'; // lobby | playing | ended
    this.game = null;
    this.nextPlayerId = 1;
  }

  addPlayer(ws, name, color) {
    if (this.players.size >= MAX_PLAYERS) {
      this.send(ws, { type: S.ERROR, message: 'Room is full' });
      return null;
    }
    if (this.state === 'playing') {
      this.send(ws, { type: S.ERROR, message: 'Game already in progress' });
      return null;
    }

    const id = String(this.nextPlayerId++);
    // Validate color or assign one
    if (!color || typeof color !== 'string') {
      color = PLAYER_COLORS[(this.players.size) % PLAYER_COLORS.length];
    }
    const player = new Player(id, name || `Player ${id}`, color);
    this.players.set(id, player);
    this.sockets.set(id, ws);
    ws._playerId = id;
    ws._roomCode = this.code;

    if (!this.hostId) this.hostId = id;

    // Tell the new player about the room
    this.send(ws, {
      type: S.ROOM_JOINED,
      code: this.code,
      yourId: id,
      hostId: this.hostId,
      mode: this.mode,
      mapName: this.mapName,
      players: [...this.players.values()].map(p => p.toLobbyInfo()),
    });

    // Tell everyone else
    this.broadcastExcept(id, {
      type: S.PLAYER_JOINED,
      ...player.toLobbyInfo(),
    });

    return id;
  }

  removePlayer(id) {
    this.players.delete(id);
    this.sockets.delete(id);

    this.broadcastAll({ type: S.PLAYER_LEFT, id });

    if (this.players.size === 0) {
      if (this.game) this.game.stop();
      return true; // room is empty, delete it
    }

    // Reassign host
    if (this.hostId === id) {
      this.hostId = [...this.players.keys()][0];
      this.broadcastAll({ type: S.HOST_CHANGED, hostId: this.hostId });
    }

    // If game was playing and too few players, end it
    if (this.state === 'playing' && this.players.size < 2) {
      this.endGame([]);
    }

    return false;
  }

  setMode(id, mode) {
    if (id !== this.hostId) return;
    if (!Object.values(MODES).includes(mode)) return;
    this.mode = mode;
    this.broadcastAll({ type: S.MODE_CHANGED, mode });
  }

  setMap(id, mapName) {
    if (id !== this.hostId) return;
    if (!maps[mapName]) return;
    this.mapName = mapName;
    this.broadcastAll({ type: S.MAP_CHANGED, mapName });
  }

  startGame(id) {
    if (id !== this.hostId) return;
    if (this.state !== 'lobby') return;
    if (this.players.size < 2) {
      const ws = this.sockets.get(id);
      if (ws) this.send(ws, { type: S.ERROR, message: 'Need at least 2 players' });
      return;
    }

    this.state = 'playing';
    const map = maps[this.mapName];

    this.game = new GameState(
      this.players,
      map,
      this.mode,
      (msg) => this.broadcastAll(msg)
    );

    // Tell everyone the game started
    this.broadcastAll({
      type: S.GAME_STARTED,
      mode: this.mode,
      map: map,
      players: [...this.players.values()].map(p => ({
        ...p.toLobbyInfo(),
        ...p.toSnapshot(),
      })),
      ...this.game.modeStartInfo,
    });

    this.game.start((results) => this.endGame(results));
  }

  endGame(results) {
    this.state = 'ended';
    if (this.game) {
      this.game.stop();
      this.game = null;
    }
    this.broadcastAll({ type: S.GAME_OVER, results });
  }

  returnToLobby(id) {
    if (id !== this.hostId) return;
    this.state = 'lobby';
    this.broadcastAll({ type: S.RETURN_TO_LOBBY });
  }

  handleInput(id, input) {
    const player = this.players.get(id);
    if (!player || this.state !== 'playing') return;
    player.input = {
      left: !!input.left,
      right: !!input.right,
      jump: !!input.jump,
    };
  }

  // --- Helpers ---

  send(ws, msg) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    }
  }

  broadcastAll(msg) {
    const data = JSON.stringify(msg);
    for (const ws of this.sockets.values()) {
      if (ws.readyState === 1) ws.send(data);
    }
  }

  broadcastExcept(excludeId, msg) {
    const data = JSON.stringify(msg);
    for (const [id, ws] of this.sockets) {
      if (id !== excludeId && ws.readyState === 1) ws.send(data);
    }
  }
}
