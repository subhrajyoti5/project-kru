const fs = require('fs');
const path = require('path');
const os = require('os');

// Load .env file if present
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const port = Number(process.env.PORT) || 4000;

function lanIPv4() {
  const ranked = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      const isV4 = entry.family === 'IPv4' || entry.family === 4;
      if (!isV4 || entry.internal) continue;
      const lower = name.toLowerCase();
      let score = 0;
      if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan')) score += 50;
      if (lower.includes('ethernet') && !lower.includes('vethernet')) score += 30;
      if (/virtual|vethernet|wsl|hyper-v|vmware|vbox|bluetooth/.test(lower)) score -= 40;
      if (entry.address.startsWith('192.168.')) score += 20;
      else if (entry.address.startsWith('10.')) score += 10;
      ranked.push({ address: entry.address, score });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.address || null;
}

function publicSignalingUrl() {
  const explicit = process.env.PUBLIC_SIGNALING_URL;
  const loopback = !explicit || /:\/\/(127\.0\.0\.1|localhost)([:/]|$)/.test(explicit);
  if (!loopback) return explicit;
  const ip = lanIPv4();
  return `http://${ip || '127.0.0.1'}:${port}`;
}

module.exports = {
  port,
  sessionTtlMs: Number(process.env.SESSION_TTL_MS) || 60 * 60 * 1000,
  publicSignalingUrl: publicSignalingUrl(),
};
