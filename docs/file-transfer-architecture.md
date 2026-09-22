# File transfer architecture

The browser and the phone move file bytes on a WebRTC data channel. That channel is SCTP over DTLS over UDP, with `ordered: true`, so delivery is reliable. The server only exchanges the SDP offer, the answer, and ICE candidates.

```text
Browser
  RTCPeerConnection
  DataChannel "kru"
        |
        | UDP, direct LAN candidate when one is available
        |
Android
  answers the offer
  FileSystemService
```

A STUN server is configured so the browser can discover candidates. The phone keeps UDP host candidates and drops TCP candidates. File bytes are not posted to the signaling server, and they are not written into the TCP session socket.

The browser addresses files with virtual paths such as `/Download/notes.txt`. Android maps those onto the shared storage folders Download, DCIM, Pictures, Documents, Music, and Movies. Paths that escape those roots are rejected.

Control messages are JSON text frames. File payload is a binary frame:

```text
KRU1 | kind | id length | transfer id | offset uint32 | bytes
```

Chunks are 64 KiB. The sender waits while `bufferedAmount` is above 1 MiB.
