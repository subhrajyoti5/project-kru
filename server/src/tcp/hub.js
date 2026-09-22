const { WebSocketServer } = require('ws');
const sessions = require('../services/session.service');

const CONTROL_LIMIT = 8192;

function attachTcp(httpServer, udpPort) {
  const wss = new WebSocketServer({ noServer: true });
  const peers = new Map();

  httpServer.on('upgrade', (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url, 'http://127.0.0.1');
    } catch {
      socket.destroy();
      return;
    }
    const match = url.pathname.match(/^\/sessions\/([a-f0-9]+)\/tcp$/);
    if (!match) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.sessionId = match[1];
      wss.emit('connection', ws);
    });
  });

  wss.on('connection', (ws) => {
    ws.on('message', (data, isBinary) => {
      if (isBinary || data.length > CONTROL_LIMIT) {
        ws.close(1009, 'TCP carries session control only');
        return;
      }
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch {
        ws.close(1003, 'JSON control messages only');
        return;
      }
      if (message.type === 'file' || message.bytes) {
        ws.close(1008, 'File bytes belong on UDP');
        return;
      }
      if (message.type === 'join') {
        join(ws, message, udpPort, peers);
        return;
      }
      const room = peers.get(ws.sessionId);
      if (!room || (ws !== room.browser && ws !== room.android)) return;
      const other = ws === room.browser ? room.android : room.browser;
      if (other && other.readyState === 1) other.send(data.toString());
    });

    ws.on('close', () => {
      const room = peers.get(ws.sessionId);
      if (!room) return;
      if (room.browser === ws) room.browser = null;
      if (room.android === ws) room.android = null;
      if (!room.browser && !room.android) peers.delete(ws.sessionId);
    });
  });
}

function join(ws, message, udpPort, peers) {
  if (message.role !== 'browser' && message.role !== 'android') {
    ws.close(1008, 'Unknown role');
    return;
  }
  try {
    sessions.requireSession(ws.sessionId, message.token);
  } catch (error) {
    ws.close(1008, error.message);
    return;
  }
  const room = peers.get(ws.sessionId) || { browser: null, android: null, token: message.token };
  room.token = message.token;
  room[message.role] = ws;
  peers.set(ws.sessionId, room);
  if (message.role === 'android') {
    sessions.setDeviceAddress(ws.sessionId, ws._socket?.remoteAddress);
  }
  if (room.browser && room.android) {
    try {
      sessions.markConnected(ws.sessionId, room.token);
    } catch {
      // Already connected or no longer pairable. The sockets stay up.
    }
    const established = JSON.stringify({ type: 'established', udpPort });
    room.browser.send(established);
    room.android.send(established);
  }
}

module.exports = { attachTcp };
