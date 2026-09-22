const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const healthRoutes = require('./routes/health.routes');
const sessionRoutes = require('./routes/session.routes');
const { notFound, onError } = require('./middleware/error.middleware');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '64kb' }));
  app.use('/health', healthRoutes);
  app.use('/sessions', sessionRoutes);
  app.use(notFound);
  app.use(onError);
  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`signaling server on ${config.port}`);
  });
}

module.exports = { createApp };
