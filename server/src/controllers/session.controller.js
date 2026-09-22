const sessions = require('../services/session.service');
const { assertAllowedNetwork } = require('../network/place');

function create(req, res) {
  assertAllowedNetwork();
  const session = sessions.createSession();
  res.status(201).json({
    session: sessions.publicView(session),
    qrPayload: sessions.qrPayload(session),
  });
}

function read(req, res) {
  const session = sessions.requireSession(req.params.sessionId, req.token);
  res.json({ session: sessions.publicView(session) });
}

function pair(req, res) {
  const session = sessions.pair(req.params.sessionId, req.body?.token, req.body?.device);
  res.json({ session: sessions.publicView(session) });
}

function heartbeat(req, res) {
  const session = sessions.heartbeat(req.params.sessionId, req.token);
  res.json({ session: sessions.publicView(session) });
}

function close(req, res) {
  const session = sessions.close(req.params.sessionId, req.token);
  res.json({ session: sessions.publicView(session) });
}

function markConnected(req, res) {
  const session = sessions.markConnected(req.params.sessionId, req.token);
  res.json({ session: sessions.publicView(session) });
}

function pushSignal(req, res) {
  const { role, type, payload } = req.body || {};
  if (role !== 'browser' && role !== 'android') {
    const error = new Error('Signal role must be browser or android.');
    error.status = 400;
    throw error;
  }
  if (type !== 'offer' && type !== 'answer' && type !== 'ice' && type !== 'bye') {
    const error = new Error('Signal type is not recognized.');
    error.status = 400;
    throw error;
  }
  const entry = sessions.pushSignal(req.params.sessionId, req.token, { role, type, payload });
  res.status(201).json({ signal: entry });
}

function readSignals(req, res) {
  const signals = sessions.readSignals(req.params.sessionId, req.token, req.query.after);
  res.json({ signals });
}

module.exports = { create, read, pair, heartbeat, close, markConnected, pushSignal, readSignals };
