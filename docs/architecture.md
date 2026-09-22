# Architecture

The website displays a QR code. The Android app scans it. After pairing, phone files are meant to be read over the same Wi-Fi. The signaling server coordinates the session and never sees file bytes.

```text
Website
   |
   | POST /sessions
   v
QR session (in memory)
   |
   | QR on screen
   v
Android scanner
   |
   | POST /sessions/:id/pair
   v
LAN connection (WebRTC data channel — not built yet)
   |
   v
File service on the phone
   |
   v
Browser file manager
```

## Why the direct channel is WebRTC

A hosted Next.js site is HTTPS. The day-1 question is how that page and the phone can still move bytes on the LAN.

| Option | What it is | Verdict for V1 |
| --- | --- | --- |
| A | Android runs an HTTP or WebSocket server; the page connects to `http://192.168.x.x` or `ws://` | Blocked. An HTTPS page cannot open `http:` or `ws:` (mixed content). A public CA will not issue a certificate for a private IP. Chrome local-network access also gates a public origin that fetches a private address. |
| B | WebRTC data channel. SDP and ICE go through this server. Media and file bytes go host-to-host on the LAN. | Chosen. A secure page may open a data channel. On the same subnet, host ICE candidates are gathered without STUN, TURN, or a relay. |
| C | The browser connects to a local service the phone exposes | Same mixed-content and private-network blocks as A. |
| D | mDNS discovery plus a LAN WebSocket | Discovery from a page is browser-specific, and `ws://` is still mixed content from HTTPS. |

WebRTC is chosen because the other options fail in a normal browser on a hosted HTTPS origin. It is not chosen because it is popular. The browser creates the data channel named `kru` and posts the offer. The phone answers after it scans the QR. When the channel opens, the browser marks the session `connected` and the page shows Connected. Offer and answer messages replace older signals from the same side so a restarted page does not leave a stale offer.

Guest Wi-Fi that isolates clients blocks every direct option, including WebRTC host candidates. The UI must say the phone and computer need the same Wi-Fi. There is no WAN fallback.

## What is intentionally absent

No database. No object storage. No STUN, TURN, or internet relay. No file route on the server. The file manager components are shells.

## Process boundaries

```text
android/   Flutter UI, QR decode, pairing client, future file service
web/       Next.js UI, QR display, session polling, future data channel
server/    Express, in-memory sessions, signaling mailbox
```

The phone does not generate the QR. The website does.
