# Signaling server

Node.js and Express. Sessions live in memory. There is no database and no file upload route.

The server creates a short-lived pairing session and stores WebRTC signaling messages (offer, answer, ICE, bye). It must not receive file bytes.

```powershell
cd server
npm install
npm start
```

`GET /health` returns `{ "ok": true }`.

`POST /sessions` returns the public session and the QR payload. See `../docs/protocol.md`.
