const config = require('../config/config');
const { randomId } = require('../utils/ids');

const sessions = new Map();

function sweep(now = Date.now()) {
  for (const session of sessions.values()) {
    if (session.status !== 'closed' && session.status !== 'expired' && session.expiresAtMs <= now) {
      session.status = 'expired';
    }
  }
}

function createSession(now = Date.now()) {
  sweep(now);
  const sessionId = randomId(16);
  const token = randomId(32);
  const browserId = randomId(16);
  const session = {
    sessionId,
    browserId,
    token,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + config.sessionTtlMs).toISOString(),
    expiresAtMs: now + config.sessionTtlMs,
    status: 'pending',
    device: null,
    signals: [],
  };
  sessions.set(sessionId, session);
  return session;
}

function requireSession(sessionId, token, now = Date.now()) {
  sweep(now);
  const session = sessions.get(sessionId);
  if (!session || session.token !== token) {
    const error = new Error('Session not found.');
    error.status = 404;
    throw error;
  }
  if (session.status === 'expired' || session.expiresAtMs <= now) {
    session.status = 'expired';
    const error = new Error('Session expired.');
    error.status = 410;
    throw error;
  }
  if (session.status === 'closed') {
    const error = new Error('Session closed.');
    error.status = 410;
    throw error;
  }
  return session;
}

function publicView(session) {
  return {
    sessionId: session.sessionId,
    browserId: session.browserId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status,
    device: session.device
      ? {
          deviceId: session.device.deviceId,
          name: session.device.name,
          platform: session.device.platform,
          connectionStatus: session.status,
        }
      : null,
  };
}

function qrPayload(session) {
  return {
    version: 1,
    sessionId: session.sessionId,
    token: session.token,
    expiresAt: session.expiresAt,
    signalingUrl: config.publicSignalingUrl,
  };
}

function pair(sessionId, token, device, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  if (!device || typeof device.deviceId !== 'string' || typeof device.name !== 'string') {
    const error = new Error('Device identity is required.');
    error.status = 400;
    throw error;
  }
  session.device = {
    deviceId: device.deviceId,
    name: device.name,
    platform: device.platform || 'android',
  };
  if (session.status === 'pending') {
    session.status = 'paired';
  }
  return session;
}

function heartbeat(sessionId, token, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  session.lastSeenAt = new Date(now).toISOString();
  return session;
}

function close(sessionId, token, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  session.status = 'closed';
  return session;
}

function markConnected(sessionId, token, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  if (session.status !== 'paired' && session.status !== 'connected') {
    const error = new Error('The phone has not paired yet.');
    error.status = 409;
    throw error;
  }
  session.status = 'connected';
  return session;
}

function pushSignal(sessionId, token, signal, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  if (signal.type === 'offer' || signal.type === 'answer') {
    session.signals = session.signals.filter((entry) => entry.role !== signal.role);
  }
  const entry = {
    id: session.signals.length + 1,
    role: signal.role,
    type: signal.type,
    payload: signal.payload,
    at: new Date(now).toISOString(),
  };
  session.signals.push(entry);
  return entry;
}

function readSignals(sessionId, token, after, now = Date.now()) {
  const session = requireSession(sessionId, token, now);
  const cursor = Number(after) || 0;
  return session.signals.filter((entry) => entry.id > cursor);
}

module.exports = {
  createSession,
  requireSession,
  publicView,
  qrPayload,
  pair,
  heartbeat,
  close,
  markConnected,
  pushSignal,
  readSignals,
};
