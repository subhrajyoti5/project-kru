const dgram = require('dgram');

function startUdp() {
  const peers = new Map();
  const socket = dgram.createSocket('udp4');
  const ready = new Promise((resolve, reject) => {
    socket.once('listening', () => resolve(socket.address().port));
    socket.once('error', reject);
  });

  socket.on('message', (message, rinfo) => {
    if (message.length >= 37 && message.subarray(0, 5).toString() === 'HELLO') {
      const sessionId = message.subarray(5, 37).toString();
      peers.set(sessionId, { address: rinfo.address, port: rinfo.port });
      return;
    }
    // File datagrams stay on this socket. They are not copied onto the TCP session.
  });

  socket.bind(0, '0.0.0.0');
  return {
    ready,
    peers,
    close: () => socket.close(),
  };
}

module.exports = { startUdp };
