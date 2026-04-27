import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Room } from './Room.js';
import { C } from '../shared/protocol.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const app = express();
app.use('/client', express.static(join(root, 'client')));
app.use('/shared', express.static(join(root, 'shared')));
app.get('/', (_req, res) => res.sendFile(join(root, 'client', 'index.html')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

// --- Room management ---
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room && room.game) room.game.stop();
  rooms.delete(code);
  console.log(`Room ${code} deleted (${rooms.size} rooms active)`);
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case C.CREATE_ROOM: {
        const code = generateCode();
        const room = new Room(code);
        rooms.set(code, room);
        room.addPlayer(ws, msg.name, msg.color);
        console.log(`Room ${code} created (${rooms.size} rooms active)`);
        break;
      }

      case C.JOIN_ROOM: {
        const code = (msg.code || '').toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        room.addPlayer(ws, msg.name, msg.color);
        break;
      }

      case C.SET_MODE: {
        const room = rooms.get(ws._roomCode);
        if (room) room.setMode(ws._playerId, msg.mode);
        break;
      }

      case C.SET_MAP: {
        const room = rooms.get(ws._roomCode);
        if (room) room.setMap(ws._playerId, msg.mapName);
        break;
      }

      case C.START_GAME: {
        const room = rooms.get(ws._roomCode);
        if (room) room.startGame(ws._playerId);
        break;
      }

      case C.INPUT: {
        const room = rooms.get(ws._roomCode);
        if (room) room.handleInput(ws._playerId, msg.keys);
        break;
      }

      case C.LEAVE: {
        handleDisconnect(ws);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        const room = rooms.get(ws._roomCode);
        if (room) room.returnToLobby(ws._playerId);
        break;
      }

      case 'END_GAME': {
        const room = rooms.get(ws._roomCode);
        if (room && ws._playerId === room.hostId) {
          room.endGame([]);
        }
        break;
      }
    }
  });

  ws.on('close', () => handleDisconnect(ws));
});

function handleDisconnect(ws) {
  const code = ws._roomCode;
  const id = ws._playerId;
  if (!code || !id) return;
  const room = rooms.get(code);
  if (!room) return;
  const empty = room.removePlayer(id);
  if (empty) deleteRoom(code);
  ws._roomCode = null;
  ws._playerId = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Tag Platformer running at http://localhost:${PORT}`);
});
