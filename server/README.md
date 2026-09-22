# Signaling server

Node.js and Express. Sessions live in memory. There is no database and no file upload route.

The server creates a short-lived pairing session and accepts the TCP WebSocket used to establish it. File bytes are accepted only on the UDP socket. They are not forwarded on the TCP socket.

```powershell
cd server
npm install
npm start
```

`GET /health` returns `{ "ok": true }`.

`POST /sessions` returns the public session and the QR payload. See `../docs/protocol.md`.
