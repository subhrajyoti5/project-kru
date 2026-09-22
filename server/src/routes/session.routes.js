const express = require('express');
const controller = require('../controllers/session.controller');

const router = express.Router();

function bearer(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Bearer token required.' });
    return;
  }
  req.token = token;
  next();
}

router.post('/', controller.create);
router.get('/:sessionId', bearer, controller.read);
router.post('/:sessionId/pair', controller.pair);
router.post('/:sessionId/heartbeat', bearer, controller.heartbeat);
router.post('/:sessionId/close', bearer, controller.close);
router.post('/:sessionId/connected', bearer, controller.markConnected);
router.post('/:sessionId/signals', bearer, controller.pushSignal);
router.get('/:sessionId/signals', bearer, controller.readSignals);

module.exports = router;
