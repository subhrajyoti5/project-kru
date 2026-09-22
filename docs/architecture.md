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
LAN session over TCP, file bytes over UDP
   |
   v
File service on the phone
   |
   v
Browser file manager
```

## Transports

Connection establishment is TCP. The browser and the phone each open a WebSocket to `/sessions/:id/tcp` on the signaling server. The session becomes connected only after both sockets have joined.

File bytes are UDP. After TCP is up, the server tells both sides the UDP port. The phone sends file datagrams there. The TCP socket closes if a frame carries file bytes.

Three networks are recognized:

- Home router: the phone and the laptop are clients of the same personal modem or router. The session is allowed.
- Phone hotspot: the laptop joins the hotspot served by the phone. That path is allowed, including when the phone's upstream link is a restricted network, because the laptop talks to the phone on the hotspot itself.
- College or enterprise Wi-Fi: refused. These networks use 802.1X or a captive portal and their firewalls block phone-to-laptop traffic. The laptop refuses to create a session when its Wi-Fi authentication is enterprise. The phone refuses to pair when it is a client of that kind of network and its hotspot is off.

## What is intentionally absent

No database. No object storage. No STUN, TURN, or internet relay. No file route on the server. The file manager components are shells.

## Process boundaries

```text
android/   Flutter UI, QR decode, pairing client, future file service
web/       Next.js UI, QR display, session polling, future data channel
server/    Express, in-memory sessions, signaling mailbox
```

The phone does not generate the QR. The website does.
