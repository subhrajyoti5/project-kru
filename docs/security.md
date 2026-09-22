# Security

## Pairing

A session id and a 256-bit token are created together. The QR is the only way the phone learns the token. The token is not an account password and is not reused.

Checks:

- short lifetime (5 minutes by default)
- random token compared in constant use only by equality on the server (the id space is unguessable; a timing-safe compare can replace `!==` before any shared deployment)
- expiry and close both make the token fail
- the server forgets the session when the process stops

The QR does not grant access after disconnect.

## LAN limit

V1 assumes the same Wi-Fi. Signaling may cross the internet because it carries only session metadata and SDP. File bytes are required to use the direct channel. If that channel cannot be built, the product must stop and explain the Wi-Fi requirement. It must not start uploading files to the server as a workaround.

## File permissions

Not implemented. When the file service is added it must:

- ask for Android storage or media permission in the app
- expose only what that permission allows
- refuse paths outside the granted roots
- treat the browser as untrusted until the data channel is tied to the paired session

No `FileEntry` is written to a database.

## Threat model

| Threat | Response in this scaffold |
| --- | --- |
| Someone photographs the QR | They can pair until expiry. Lifetime stays short. The LAN channel still has to succeed on their network. |
| Server operator reads files | They cannot. There is no file route and no storage. |
| Stolen session id without the token | `404`. |
| Mixed-content trick that sends the browser to a phone HTTP port | Not part of the design. See architecture.md. |
| Guest-network client isolation | Connection fails. Copy tells the user to use the same Wi-Fi. |

CORS on the server is open so a local Next.js origin can call it. Tighten the allow-list to the real site origin before any shared deployment. The JSON body limit is 64kb so a client cannot post a file into the signaling mailbox by accident.
