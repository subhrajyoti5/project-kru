You are implementing the FILE TRANSFER / FILE SHARING SERVICE for KRU.

IMPORTANT:
The repository already exists. DO NOT recreate the project or scaffold a new application.

Repository:
project-kru/

Existing structure:
- android/
- web/
- server/
- docs/
- scripts/
- prd.md
- README.md

First inspect the existing implementation and architecture before modifying anything.

==================================================
PRODUCT REQUIREMENT
==================================================

KRU is a LAN-first Android file manager.

The user opens KRU in a desktop browser.

Flow:

1. Desktop website generates a temporary connection QR code.
2. Android KRU app scans the QR code.
3. Both devices are on the SAME LOCAL Wi-Fi network.
4. Android and browser establish a direct peer-to-peer connection.
5. Website shows "Connected".
6. Browser can browse Android-accessible files.
7. Browser can download files from Android.
8. Browser can upload files to Android.
9. Browser can rename, delete and create folders.
10. Actual file bytes must NOT pass through the backend server.

The backend is only for:
- session creation
- QR/session information
- WebRTC signaling
- connection lifecycle

The backend MUST NOT become a file proxy.

==================================================
TRANSPORT REQUIREMENT
==================================================

Use a UDP-based transport for the actual device-to-device file transfer.

CRITICAL BROWSER CONSTRAINT:

A normal web browser cannot directly create arbitrary raw UDP sockets.

Therefore DO NOT implement:

Browser -> raw UDP socket -> Android

Instead use:

Browser
   |
   | WebRTC DataChannel
   |
   | SCTP
   |
   | DTLS
   |
   | UDP
   |
Android

Use WebRTC DataChannel as the browser-compatible UDP-based P2P transport.

Prefer a DIRECT LAN peer connection.

Do NOT introduce TURN/cloud relay for V1.

STUN may be used only if required for WebRTC candidate discovery, but the architecture must prioritize direct local-network candidates.

The implementation must verify that the selected ICE candidate pair is local/LAN where possible.

==================================================
CORE ARCHITECTURE
==================================================

Implement the system as:

                 KRU WEB
                    |
                    |
             WebRTC DataChannel
                    |
             UDP-based transport
                    |
             KRU ANDROID APP
                    |
              File System APIs

Existing backend:

Desktop <---- signaling ----> Server <---- signaling ----> Android

Server responsibilities:

- create temporary session
- store temporary signaling state
- exchange SDP offer/answer
- exchange ICE candidates
- authenticate temporary session
- expire sessions
- notify disconnect

Server responsibilities MUST NOT include:

- file contents
- file upload
- file download
- file storage
- file buffering
- file proxying

==================================================
FIRST TASK: INSPECT EXISTING CODE
==================================================

Before implementing anything:

1. Inspect:
   - prd.md
   - README.md
   - docs/
   - server/
   - web/
   - android/

2. Identify:
   - existing QR/session implementation
   - existing server APIs
   - existing WebSocket implementation
   - existing Android networking code
   - existing Flutter architecture
   - existing state management
   - existing UI components
   - existing file-system abstraction

3. Do NOT replace working architecture unnecessarily.

4. Create/update:

docs/file-transfer-architecture.md

Document the actual architecture you implement.

==================================================
PHASE 1 — PEER CONNECTION PROOF
==================================================

Before implementing file transfer, prove that the browser and Android app can establish a WebRTC DataChannel over the SAME Wi-Fi network.

Implement:

Browser:
- RTCPeerConnection
- createDataChannel("kru")
- SDP offer
- ICE candidate handling
- DataChannel state management

Android:
- WebRTC peer connection
- receive SDP offer
- create SDP answer
- ICE candidate handling
- receive DataChannel

Backend:
- signaling only

Connection states:

IDLE
CONNECTING
CONNECTED
DISCONNECTED
FAILED

When DataChannel opens:

Android sends:

{
  "type": "hello",
  "protocolVersion": 1,
  "device": {
    "platform": "android"
  }
}

Browser responds:

{
  "type": "hello_ack",
  "protocolVersion": 1
}

Display in browser:

● Connected

Do not proceed to file operations until this connection is reliable.

==================================================
PHASE 2 — DEFINE THE KRU DATA PROTOCOL
==================================================

Create a formal application-level protocol over the WebRTC DataChannel.

Create:

docs/file-transfer-protocol.md

Every message must have:

{
  "type": "...",
  "requestId": "...",
  ...
}

Use requestId for request/response correlation.

Define at minimum:

connection:
- hello
- hello_ack
- ping
- pong
- disconnect

filesystem:
- list_directory
- directory_response
- stat
- stat_response
- create_directory
- rename
- delete
- operation_response

transfer:
- download_request
- download_start
- download_chunk
- download_complete
- upload_request
- upload_start
- upload_chunk
- upload_complete
- transfer_cancel
- transfer_error

==================================================
PHASE 3 — FILESYSTEM API
==================================================

Android must expose ONLY files that Android allows the application to access.

DO NOT promise unrestricted access to:

/data
/system
/root
or other protected Android directories.

Use Android-supported storage APIs.

Prioritize:

- Pictures
- DCIM
- Movies
- Downloads
- Documents
- Music
- user-accessible folders

Create a clean Android filesystem abstraction:

FileSystemService

Example operations:

listDirectory(path)
stat(path)
createDirectory(path)
rename(path, newName)
delete(path)
openForRead(path)
openForWrite(path)

Never expose raw unrestricted filesystem access to the browser.

==================================================
PHASE 4 — PATH SECURITY
==================================================

This is mandatory.

The browser must NEVER be allowed to send arbitrary filesystem paths.

Use a controlled root / document-tree abstraction.

Reject:

../
../../
absolute paths outside the allowed root
path traversal
invalid filenames
null bytes
reserved paths
protected Android directories

Normalize and validate every path on Android.

Never trust:

- filename
- path
- size
- MIME type
- transfer ID
- request ID

from the browser.

==================================================
PHASE 5 — DIRECTORY BROWSING
==================================================

Implement:

Browser:
- root directory
- folders
- files
- breadcrumb navigation
- file name
- type
- size
- modified time

Android responds to:

list_directory

Example:

{
  "type": "directory_response",
  "requestId": "...",
  "path": "/Downloads",
  "entries": [
    {
      "name": "file.pdf",
      "type": "file",
      "size": 123456,
      "modifiedAt": 1234567890,
      "mimeType": "application/pdf"
    }
  ]
}

Do not send file contents when listing directories.

==================================================
PHASE 6 — DOWNLOAD: ANDROID -> BROWSER
==================================================

Implement browser download.

Flow:

Browser:

download_request
{
  "type": "download_request",
  "requestId": "...",
  "path": "/Downloads/video.mp4"
}

Android:

1. validate path
2. verify file exists
3. obtain file metadata
4. create transferId
5. send download_start

Example:

{
  "type": "download_start",
  "requestId": "...",
  "transferId": "...",
  "name": "video.mp4",
  "size": 524288000,
  "mimeType": "video/mp4"
}

Then transfer chunks.

IMPORTANT:

DO NOT load the entire file into RAM.

Use streaming reads.

==================================================
PHASE 7 — UDP/WEBRTC CHUNK TRANSFER
==================================================

DataChannel messages have practical message-size limits.

DO NOT send a 500 MB file as one DataChannel message.

Implement chunking.

Start with a conservative chunk size such as:

64 KiB

Make it configurable.

Every chunk must contain:

transferId
sequenceNumber
offset
payloadLength
checksum/hash if required

Example conceptual packet:

{
  "type": "download_chunk",
  "transferId": "...",
  "sequence": 42,
  "offset": 2752512,
  "length": 65536,
  "data": "..."
}

However, avoid inefficient JSON/base64 encoding for large binary payloads.

For actual file payloads:

USE BINARY DATA CHANNEL MESSAGES.

Use a small control-message protocol plus binary chunk frames.

For example:

CONTROL:

{
  "type": "chunk",
  "transferId": "...",
  "sequence": 42,
  "offset": 2752512,
  "length": 65536
}

followed by:

BINARY FRAME:
[raw bytes]

Design the framing so the receiver can unambiguously associate binary data with the transfer.

Prefer a compact binary framing format if practical.

==================================================
IMPORTANT: RELIABILITY
==================================================

Do NOT assume UDP means unreliable file transfer.

For file transfer, data integrity is mandatory.

Use WebRTC DataChannel configured as:

ordered = true
reliable = true

for the initial implementation.

The underlying transport remains UDP-based while the DataChannel provides reliable ordered delivery.

DO NOT implement your own unreliable UDP file-transfer protocol in V1.

If later implementing an optimized unreliable mode, it must have:

- sequence numbers
- acknowledgements
- retransmission
- missing chunk detection
- checksum validation
- resume support

But this is NOT required for V1.

First make reliable transfer correct.

==================================================
PHASE 8 — BACKPRESSURE
==================================================

This is mandatory.

Do NOT continuously call DataChannel.send() until the entire file is sent.

Monitor:

bufferedAmount

Use:

bufferedAmountLowThreshold

Implement a send queue.

Conceptually:

while data remains:
    if bufferedAmount is too high:
        pause reading file
        wait for bufferedamountlow
    read next chunk
    send chunk
    update progress

This prevents:

- browser memory explosion
- Android memory explosion
- DataChannel saturation
- UI freezing

==================================================
PHASE 9 — UPLOAD: BROWSER -> ANDROID
==================================================

Implement:

PC file picker
        |
        v
Browser
        |
        | WebRTC DataChannel
        v
Android
        |
        v
local file

Browser sends:

upload_request

Android validates:

- filename
- target directory
- allowed path
- file size
- permissions

Then:

upload_start

Browser streams chunks.

Android writes chunks directly to disk.

DO NOT hold the entire uploaded file in Android RAM.

==================================================
PHASE 10 — TRANSFER STATE MACHINE
==================================================

Every transfer must have:

QUEUED
PREPARING
TRANSFERRING
COMPLETED
CANCELLED
FAILED

Track:

transferId
filename
direction
totalBytes
transferredBytes
percentage
startedAt
completedAt
error

Browser UI should show:

filename
upload/download
progress
transferred / total
percentage
speed
ETA
cancel button

Example:

video.mp4
Downloading
342 MB / 1.2 GB
28%
18.4 MB/s
ETA 47 sec
[Cancel]

==================================================
PHASE 11 — CANCELLATION
==================================================

Implement:

transfer_cancel

Either side must be able to cancel.

Browser cancels:

transfer_cancel

Android must:

- stop file read/write
- close streams
- release resources
- remove partial file OR mark it as incomplete
- notify browser

Browser must stop processing the transfer.

Never leave corrupted partial files pretending to be completed files.

==================================================
PHASE 12 — INTEGRITY
==================================================

Every completed transfer must be validated.

At minimum:

- expected byte count
- actual byte count

Prefer SHA-256 for completed files.

For example:

download_start:
expectedSize

download_complete:
actualSize
sha256

Browser verifies the received file.

For upload:

Browser calculates hash if practical.

Android calculates hash after writing.

Compare hashes.

If mismatch:

FAILED

Never show:

"Transfer complete"

unless integrity validation succeeds.

==================================================
PHASE 13 — FILE OPERATIONS
==================================================

Implement:

Create folder
Rename
Delete

All operations must:

1. receive request
2. validate request
3. validate path
4. perform operation
5. return result

Example:

{
  "type": "operation_response",
  "requestId": "...",
  "success": true
}

Errors:

{
  "type": "operation_response",
  "requestId": "...",
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "..."
  }
}

Define standard error codes.

==================================================
PHASE 14 — PREVIEW
==================================================

Implement browser-side previews for:

Images
Videos
PDFs where browser supports them

Do not transfer the entire file unnecessarily just to display a preview.

For initial MVP:

Use download/streaming-based preview where practical.

Do not build a separate media server unless technically required.

==================================================
PHASE 15 — LARGE FILE SUPPORT
==================================================

Must test:

10 MB
100 MB
500 MB
1 GB+

The implementation must:

- stream
- chunk
- apply backpressure
- avoid whole-file RAM usage
- handle disconnect
- report errors
- verify integrity

Memory usage should remain approximately independent of total file size.

==================================================
PHASE 16 — DISCONNECTION HANDLING
==================================================

If WebRTC disconnects:

Browser must show:

● Disconnected

Active transfers:

FAILED or INTERRUPTED

Do not pretend they completed.

Release:

- file handles
- transfer queues
- timers
- event listeners
- DataChannel resources

Session must be invalidated appropriately.

==================================================
PHASE 17 — SECURITY
==================================================

Security requirements:

1. Temporary session ID.
2. Cryptographically random authentication token.
3. Short session lifetime.
4. Token must not be reusable after expiration.
5. Android must verify session authorization.
6. Browser must not gain permanent filesystem access.
7. Server must never receive file contents.
8. Server logs must not contain file contents.
9. Validate every filesystem path.
10. Validate every operation.
11. Limit concurrent transfers.
12. Apply reasonable maximum message sizes.
13. Reject malformed protocol messages.
14. Prevent request flooding.
15. Clean up expired sessions.

Do not add accounts in V1.

==================================================
PHASE 18 — WEB UI
==================================================

After connection:

Desktop UI:

------------------------------------------------
KRU
● Connected

Phone
  > Internal Storage
      > DCIM
      > Downloads
      > Pictures
      > Documents
      > Music

------------------------------------------------

File table:

Name | Type | Size | Modified | Actions

Actions:

- Open
- Download
- Rename
- Delete

Top actions:

[Upload]
[New Folder]
[Refresh]

Transfers panel:

Transfers
-------------------------------
video.mp4
↓ Downloading
342 MB / 1.2 GB
18.4 MB/s
[Cancel]
-------------------------------

Keep the interface simple.

Do not turn KRU into a generic cloud-drive UI.

==================================================
PHASE 19 — ANDROID UI
==================================================

Android should remain minimal.

Main screen:

KRU

[ Scan QR ]

Connected:
Desktop Chrome
● Connected

[ Disconnect ]

Do not build a complete Android file manager.

The browser is the primary file-management interface.

==================================================
PHASE 20 — PERFORMANCE
==================================================

Measure:

- connection establishment time
- DataChannel open time
- transfer throughput
- CPU usage
- memory usage
- time to first byte
- large-file transfer stability

Log development diagnostics such as:

[WebRTC]
ICE state: connected
DataChannel: open
Candidate type: host
Transport: UDP

[Transfer]
ID: abc123
Direction: DOWNLOAD
Size: 524288000
Chunk: 65536
Speed: 28.4 MB/s

Do not expose sensitive file contents in logs.

==================================================
PHASE 21 — TESTING
==================================================

Add automated tests where practical.

Server:

- session creation
- token validation
- expiration
- signaling
- invalid messages
- disconnect

Android:

- path validation
- filesystem operations
- file metadata
- chunk writing
- checksum validation
- cancellation
- permission errors

Web:

- connection state
- directory navigation
- transfer state
- progress calculation
- cancellation
- error handling

==================================================
PHASE 22 — PHYSICAL LAN TEST
==================================================

This is mandatory.

Test with:

Device A:
Windows desktop + Chrome/Edge

Device B:
Android phone

Both connected to:

SAME Wi-Fi router

Test:

1. Website generates QR.
2. Android scans QR.
3. WebRTC connection establishes.
4. DataChannel opens.
5. Browser displays Connected.
6. Browse Downloads.
7. Browse Pictures.
8. Download image.
9. Download PDF.
10. Download 100+ MB video.
11. Upload image.
12. Upload PDF.
13. Upload 100+ MB video.
14. Create folder.
15. Rename file.
16. Delete file.
17. Cancel active transfer.
18. Disconnect phone.
19. Reconnect.
20. Repeat transfer.

Record actual transfer speeds.

==================================================
IMPORTANT ARCHITECTURAL RULE
==================================================

DO NOT implement:

Browser
  -> Server
  -> Android
  -> Server
  -> Browser

for file data.

Correct:

Browser
    |
    | WebRTC DataChannel
    | UDP-based P2P
    |
Android

Server:

Browser <---- signaling ----> Server <---- signaling ----> Android

Only signaling/session metadata goes through the server.

==================================================
DO NOT ADD
==================================================

Do not implement:

- cloud storage
- user accounts
- PostgreSQL
- subscriptions
- payments
- WAN file transfer
- TURN server
- file backup
- file synchronization
- native Windows application
- iOS
- screen mirroring
- remote phone control
- AI
- social features

==================================================
DOCUMENTATION
==================================================

Update:

docs/file-transfer-architecture.md
docs/file-transfer-protocol.md
docs/implementation-status.md
README.md

Document:

- architecture
- signaling flow
- WebRTC flow
- DataChannel configuration
- UDP transport explanation
- protocol
- chunk format
- backpressure
- integrity validation
- filesystem security
- transfer state machine
- known Android limitations
- known browser limitations
- testing results

==================================================
IMPLEMENTATION ORDER
==================================================

Do NOT implement everything at once.

Follow exactly:

PHASE 1
Repository inspection

PHASE 2
Browser <-> Android WebRTC DataChannel proof

PHASE 3
Signaling integration

PHASE 4
Hello/heartbeat protocol

PHASE 5
Android filesystem abstraction

PHASE 6
Directory browsing

PHASE 7
Download small file

PHASE 8
Binary chunk streaming + backpressure

PHASE 9
Upload small file

PHASE 10
Large-file transfer

PHASE 11
Transfer progress

PHASE 12
Cancellation

PHASE 13
Integrity verification

PHASE 14
Rename/delete/create-folder

PHASE 15
Preview

PHASE 16
Security hardening

PHASE 17
Physical LAN testing

PHASE 18
Documentation/polish

After each phase:

1. Run relevant tests.
2. Build the affected application.
3. Fix errors.
4. Update docs/implementation-status.md.
5. Do not proceed if the previous phase is fundamentally broken.

==================================================
CRITICAL ENGINEERING RULE
==================================================

If the browser cannot establish the desired direct LAN WebRTC connection using the current architecture:

STOP.

Do NOT silently switch to:

- HTTP file proxy
- WebSocket file transfer
- server-mediated file transfer
- cloud storage

Instead document:

1. What failed.
2. Why it failed.
3. Browser/platform restriction involved.
4. Possible solutions.
5. Recommended solution.
6. Exact architectural consequences.

Then wait for architectural approval.

The goal is:

KRU = browser-first + LAN-first + direct Android ↔ browser file transfer + UDP-based WebRTC transport.

Build the smallest technically correct implementation first.