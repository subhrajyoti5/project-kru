const { execFileSync } = require('child_process');

const campusMessage =
  'This Wi-Fi is a college or enterprise network, and its firewall blocks the phone from reaching the laptop. Use your home router, or turn on the phone hotspot and join it from the laptop.';

function connectedWifiAuthentication() {
  let output = '';
  try {
    output = execFileSync('netsh', ['wlan', 'show', 'interfaces'], {
      encoding: 'utf8',
      windowsHide: true,
    });
  } catch {
    return null;
  }
  const blocks = output.split(/\r?\n\s*\r?\n/);
  for (const block of blocks) {
    if (!/^\s*State\s*:\s*connected\s*$/im.test(block)) continue;
    const auth = block.match(/^\s*Authentication\s*:\s*(.+)\s*$/im);
    if (auth) return auth[1].trim();
  }
  return null;
}

function assertAllowedNetwork() {
  const authentication = connectedWifiAuthentication();
  if (authentication && /enterprise|802\.1x/i.test(authentication)) {
    const error = new Error(campusMessage);
    error.status = 403;
    throw error;
  }
}

module.exports = { assertAllowedNetwork, campusMessage, connectedWifiAuthentication };
