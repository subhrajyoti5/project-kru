# Protocol

Version 1. The QR carries temporary pairing data only.

## Session creation

`POST /sessions`

Response `201`:

```json
{
  "session": {
    "sessionId": "hex",
    "browserId": "hex",
    "createdAt": "ISO-8601",
    "expiresAt": "ISO-8601",
    "status": "pending",
    "device": null
  },
  "qrPayload": {
    "version": 1,
    "sessionId": "hex",
    "token": "hex",
    "expiresAt": "ISO-8601",
    "signalingUrl": "http://127.0.0.1:4000"
  }
}
```

The example QR in the product brief included `browserIp` and `browserPort`. Those fields are omitted. A page cannot reliably learn the computer's LAN address, and putting one in the QR pushes the phone toward a connection the browser cannot complete under HTTPS. The browser endpoint is discovered later as a WebRTC host candidate.

Default lifetime is 5 minutes. Status values: `pending`, `paired`, `connected`, `expired`, `closed`.

`connected` is set only after the WebRTC data channel opens. Pairing alone sets `paired`, which the website shows as "Connecting...".

`POST /sessions/:sessionId/connected` with the bearer token moves `paired` to `connected`. Calling it before pairing returns `409`.

## Pairing

The phone decodes the payload, rejects an unknown version or an expiry in the past, then:

`POST /sessions/:sessionId/pair`

```json
{
  "token": "from-qr",
  "device": { "deviceId": "hex", "name": "Android phone", "platform": "android" }
}
```

The token in the body is the proof that the caller scanned the QR. A wrong token is `404` (same response as an unknown session, so ids are not confirmed). Expired or closed sessions are `410`.

## Authentication

Subsequent browser and phone calls send `Authorization: Bearer <token>`.

There is no user account. The token dies with the session.

## Signaling

These routes exist so WebRTC can be added without changing the session model.

`POST /sessions/:sessionId/signals` with bearer token:

```json
{ "role": "browser", "type": "offer", "payload": {} }
```

`role` is `browser` or `android`. `type` is `offer`, `answer`, `ice`, or `bye`.

`GET /sessions/:sessionId/signals?after=<id>` returns newer messages. The server stores them in the session object and does not inspect SDP.

## Heartbeat and disconnect

`POST /sessions/:sessionId/heartbeat` refreshes `lastSeenAt`.

`POST /sessions/:sessionId/close` sets `closed`. After that the token is rejected.

Expiry is checked on each read. Restarting the process drops every session, which is acceptable for V1 because nothing is persisted on purpose.

## File operations

Not defined yet. When they exist they travel on the data channel as a separate message format. They must not be added as HTTP routes on this server.
