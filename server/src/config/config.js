module.exports = {
  port: Number(process.env.PORT) || 4000,
  sessionTtlMs: Number(process.env.SESSION_TTL_MS) || 5 * 60 * 1000,
  publicSignalingUrl: process.env.PUBLIC_SIGNALING_URL || 'http://127.0.0.1:4000',
};
