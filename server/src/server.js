const http = require('http');
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const healthRoutes = require('./routes/health.routes');
const sessionRoutes = require('./routes/session.routes');
const { notFound, onError } = require('./middleware/error.middleware');
const { attachTcp } = require('./tcp/hub');
const { startUdp } = require('./udp/files');

function createApp() {
  const app = express();
  app.use(cors());
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use('/health', healthRoutes);
  app.use('/sessions', sessionRoutes);
  app.use(notFound);
  app.use(onError);
  return app;
}

async function listen() {
  const udp = startUdp();
  const udpPort = await udp.ready;
  const server = http.createServer(createApp());
  attachTcp(server, udpPort);
  server.on('close', () => udp.close());
  await new Promise((resolve) => server.listen(config.port, '0.0.0.0', resolve));
  console.log(`signaling tcp on 0.0.0.0:${config.port}`);
  console.log(`file udp on 0.0.0.0:${udpPort}`);
  console.log(`phone signaling url ${config.publicSignalingUrl}`);
  return server;
}

if (require.main === module) {
  listen().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { createApp, listen };
