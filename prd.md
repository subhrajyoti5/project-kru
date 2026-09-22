# KRU — PRODUCT IMPLEMENTATION MASTER PROMPT

You are the lead engineer responsible for implementing the complete MVP of **KRU**, an Android-to-desktop browser file manager.

The repository has ALREADY been scaffolded.

Do NOT recreate the project structure from scratch.

The current repository looks approximately like:

```text
project-kru/
├── android/
├── docs/
├── scripts/
├── server/
├── web/
├── .gitignore
├── LICENSE
├── package-lock.json
├── prd.md
└── README.md
```

Work inside this existing repository.

---

# 1. PRODUCT IDEA

KRU is a **LAN-first Android file manager for desktop browsers**.

The core product principle is:

> **Don't send files. Access your phone.**

Instead of:

```text
Phone
  ↓
Select file
  ↓
Send
  ↓
Choose computer
```

the user should experience:

```text
Desktop Browser
      ↓
Connect phone
      ↓
Phone filesystem appears
      ↓
Browse
      ↓
Download / Upload / Manage
```

The desktop browser should feel like a file explorer for the Android phone.

---

# 2. EXACT USER FLOW

This flow is NON-NEGOTIABLE.

## Step 1 — Desktop

The user opens:

```text
KRU website
```

The website displays:

```text
Connect your Android phone

┌─────────────────┐
│                 │
│    QR CODE      │
│                 │
└─────────────────┘

Scan this QR code using the KRU Android app.
```

The **website generates the QR code**.

---

# Step 2 — Android

The user opens the KRU Android application.

The Android application has:

```text
Scan QR
```

The user scans the QR code currently displayed on the desktop website.

The Android application decodes the QR payload.

---

# Step 3 — LAN Connection

The Android app determines the connection information contained in the QR/session.

The Android device and desktop must be on the **same local Wi-Fi network**.

The app establishes a direct local connection to the desktop/browser.

The website changes:

```text
Connecting...
```

to:

```text
● Connected
```

within a few seconds under normal LAN conditions.

---

# Step 4 — Phone Files

After connection:

```text
Android phone
      ↓
Accessible filesystem/media
      ↓
Desktop browser
```

The desktop browser displays the phone's accessible files.

The user can navigate them like a normal file explorer.

---

# 3. IMPORTANT QR DIRECTION

The direction MUST remain:

```text
WEBSITE
   │
   │ generates QR
   ▼
QR CODE
   │
   │ scanned by
   ▼
ANDROID APP
   │
   ▼
LAN CONNECTION
   │
   ▼
DESKTOP BROWSER
```

Do NOT implement:

```text
Android → QR → Website scanner
```

The Android application is the scanner.

The website is the QR generator/display.

---

# 4. LAN-ONLY MVP

The first release MUST work only when:

```text
Android phone
      +
Desktop
      ↓
Same Wi-Fi / LAN
```

Do NOT implement WAN connectivity.

Do NOT implement:

* STUN
* TURN
* Cloud relay
* Internet file transfer
* Remote access
* Cloud sync
* Internet-based device access

These are future versions.

---

# 5. PRIVACY ARCHITECTURE

The product is local-first.

The actual file data should travel:

```text
Android
   ⇄
Desktop Browser
```

over the local network.

The backend MUST NOT become a file-transfer proxy.

The backend MUST NOT receive:

* photos
* videos
* documents
* arbitrary files
* file contents

The backend may only assist with:

* temporary session creation
* pairing
* connection metadata
* signaling if absolutely necessary

For MVP:

```text
Database: NONE
Cloud storage: NONE
User accounts: NONE
```

---

# 6. EXISTING STACK

Do not replace the existing stack.

## Android

```text
Flutter
Dart
Android SDK
Kotlin when native Android APIs are required
```

## Web

```text
Next.js
React
TypeScript
Tailwind CSS
App Router
```

## Server

```text
Node.js
Express
JavaScript
```

## Database

None.

## Cloud file storage

None.

## C++

Not required.

---

# 7. DEVELOPMENT PRIORITY

Build in this exact order.

```text
1. LAN connection proof
2. QR pairing
3. Secure session
4. Android file discovery
5. Browser file explorer
6. Download
7. Upload
8. File management
9. Preview
10. Error handling
11. Polish
```

Do not build the entire UI first.

Do not create fake functionality.

Do not use mocked file data once the real Android filesystem layer is available.

---

# 8. PHASE 0 — INSPECT THE REPOSITORY

Before modifying anything:

1. Inspect the existing repository.
2. Inspect `prd.md`.
3. Inspect `README.md`.
4. Inspect `docs/`.
5. Inspect the Android project.
6. Inspect the Next.js project.
7. Inspect the server.
8. Determine what is already implemented.
9. Do not overwrite existing working code unnecessarily.

Then create/update:

```text
docs/implementation-status.md
```

containing:

```text
Component
Current status
Missing functionality
Next action
```

---

# 9. PHASE 1 — PROVE LAN COMMUNICATION

This is the most important technical milestone.

Before implementing the complete product, create the smallest possible working connection.

The target is:

```text
Windows Chrome/Edge
        ⇅
      LAN
        ⇅
Android
```

The Android application should be able to establish a local authenticated connection with the browser.

Test:

* Same Wi-Fi
* Different Wi-Fi
* Phone hotspot
* Router isolation if applicable
* Windows firewall behavior
* Android permissions
* Browser security restrictions
* HTTPS → local network communication
* CORS
* WebSocket behavior
* Connection timeout
* Disconnect/reconnect

Do not assume that a hosted HTTPS page can freely communicate with arbitrary HTTP localhost/LAN endpoints.

Investigate the actual browser security model.

If the initial architecture has a browser security problem, solve it before proceeding.

---

# 10. CONNECTION ARCHITECTURE

Choose the simplest architecture that actually works.

Evaluate:

### Option A — Android local server

```text
Browser
   ↓
LAN
   ↓
Android HTTP/WebSocket server
```

### Option B — WebRTC

```text
Browser
   ⇄
WebRTC
   ⇄
Android
```

### Option C — Local web application

```text
Android
 ├── local server
 └── local UI/API
        ↑
     Browser
```

### Option D — Another browser-compatible LAN architecture

You may choose another architecture if it is technically more reliable.

Do NOT choose WebRTC just because it sounds advanced.

Optimize for:

```text
Reliability
+
Security
+
One-week implementation speed
```

---

# 11. QR SESSION

The desktop website should request a temporary session.

Conceptually:

```text
Browser
   ↓
POST /session
   ↓
Server
   ↓
temporary session
   ↓
Browser
   ↓
Generate QR
```

The QR should contain only temporary connection information.

Example:

```json
{
  "version": 1,
  "sessionId": "...",
  "browserId": "...",
  "endpoint": "...",
  "token": "...",
  "expiresAt": "..."
}
```

Do not put file data in the QR.

Do not put permanent credentials in the QR.

---

# 12. SESSION SECURITY

Every pairing session must have:

* Random session ID
* Cryptographically random temporary token
* Expiration time
* One-time or limited-use pairing behavior
* Session status
* Connection status

Example states:

```text
CREATED
WAITING
SCANNED
AUTHENTICATING
CONNECTED
DISCONNECTED
EXPIRED
FAILED
```

---

# 13. WEBSITE

The website needs these primary screens.

## `/`

Landing/connect page.

```text
KRU

Access your Android phone
from your browser.

[ QR CODE ]

Open KRU on Android
and scan this code.
```

Connection status:

```text
Waiting for phone...
```

then:

```text
Connecting...
```

then:

```text
● Connected
```

---

# 14. FILE MANAGER

After connection, route the user to the file manager.

Suggested layout:

```text
┌───────────────────────────────────────────────────────┐
│ KRU                     Pixel / Android   ● Connected │
├──────────────┬────────────────────────────────────────┤
│              │                                        │
│ Home         │ Home                                   │
│              │                                        │
│ Photos       │ 📁 DCIM                                │
│ Videos       │ 📁 Downloads                           │
│ Documents    │ 📁 Pictures                            │
│ Downloads    │ 📁 Documents                           │
│ Music        │ 📁 Music                               │
│              │                                        │
│              │                                        │
└──────────────┴────────────────────────────────────────┘
```

The UI should resemble:

> Windows Explorer / Finder

not:

> An admin dashboard.

---

# 15. FILE OPERATIONS

Implement these operations.

## Required

### Browse

```text
GET directory
```

### Download

```text
Android → Browser → Desktop
```

### Upload

```text
Desktop → Browser → Android
```

### Rename

```text
rename(file)
```

### Delete

```text
delete(file)
```

### Create folder

```text
mkdir(folder)
```

### Metadata

Display:

```text
Name
Type
Size
Modified time
```

---

# 16. ANDROID FILE ACCESS

Do NOT assume unrestricted Android filesystem access.

Use Android-supported APIs and permissions.

Prioritize:

```text
Photos
Videos
Downloads
Documents
Music
User-accessible folders
```

The implementation must respect Android storage restrictions.

If an operation requires Android authorization, implement the appropriate permission/request flow.

Never bypass Android security restrictions.

---

# 17. LARGE FILE TRANSFERS

Never load an entire large file into memory.

Use:

```text
streaming
```

or:

```text
chunked transfer
```

Example:

```text
video.mp4

Chunk 1
Chunk 2
Chunk 3
...
Chunk N
```

The browser should display:

```text
video.mp4

████████████░░░░░░░░
62%

1.24 GB / 2.00 GB
```

---

# 18. TRANSFER SYSTEM

Create a transfer abstraction.

Example conceptual model:

```text
Transfer
├── id
├── filename
├── direction
├── size
├── transferred
├── percentage
├── status
└── error
```

States:

```text
QUEUED
TRANSFERRING
COMPLETED
CANCELLED
FAILED
```

Implement:

* Progress
* Cancellation
* Error handling
* Multiple transfers if feasible
* Retry where practical

---

# 19. FILE PREVIEW

Implement browser previews for supported files.

At minimum:

### Images

```text
jpg
jpeg
png
webp
gif
```

### Video

Use browser-native support where available.

Do not implement transcoding in V1.

---

# 20. SEARCH

Implement basic filename search.

Example:

```text
Search:
resume

Results:
resume.pdf
resume-final.pdf
resume-2026.pdf
```

Do not build a complex indexing engine for V1.

---

# 21. ANDROID APP UX

The Android application should remain extremely simple.

Main screen:

```text
┌──────────────────────────┐
│                          │
│          KRU             │
│                          │
│   Connect to computer    │
│                          │
│     [ Scan QR Code ]     │
│                          │
│                          │
│ Status: Disconnected     │
│                          │
└──────────────────────────┘
```

After scanning:

```text
Connecting...
```

Then:

```text
✓ Connected

You can now manage your
phone from your browser.
```

Do not turn the Android app into a giant file manager.

The browser is the primary file-management interface.

---

# 22. ANDROID QR SCANNER

The Android app must:

1. Request camera permission.
2. Open QR scanner.
3. Detect QR.
4. Decode payload.
5. Validate payload version.
6. Validate expiration.
7. Extract connection information.
8. Attempt LAN connection.
9. Authenticate.
10. Report connection status.

Invalid QR:

```text
Invalid KRU QR code.
```

Expired QR:

```text
This QR code has expired.
Generate a new one from the website.
```

Different-network error:

```text
Couldn't connect.

Make sure your phone and computer
are connected to the same Wi-Fi network.
```

---

# 23. CONNECTION STATUS

The website must clearly show:

```text
Waiting
Connecting
Connected
Disconnected
Failed
```

The Android app should show the same logical state.

If the phone disappears:

```text
Phone disconnected.

Trying to reconnect...
```

Use a heartbeat/ping mechanism where appropriate.

---

# 24. DISCONNECT

Provide:

```text
Disconnect
```

on the desktop.

When disconnected:

* Invalidate session where appropriate.
* Stop file service access for that session.
* Clear temporary connection state.
* Return website to the QR screen.

---

# 25. ERROR HANDLING

Never show raw stack traces to users.

Handle:

* No Wi-Fi
* Different networks
* Invalid QR
* Expired QR
* Connection timeout
* Android permission denied
* File not found
* File deleted during transfer
* Storage full
* Browser unsupported
* Network interruption
* Transfer cancellation

User-facing messages should be concise and actionable.

---

# 26. SECURITY

Implement:

### Authentication

Temporary random token.

### Authorization

A paired browser can only access the currently exposed Android filesystem through the active session.

### Expiration

Sessions expire automatically.

### No permanent access

Scanning a QR must not create an everlasting connection.

### No server file storage

The backend must never receive file contents.

### Input validation

Validate:

* Paths
* filenames
* session IDs
* tokens
* commands
* file operations

Prevent path traversal.

Never allow:

```text
../../../../
```

or equivalent path manipulation to escape the intended accessible filesystem.

---

# 27. API DESIGN

Keep APIs minimal.

Potential server APIs:

```text
POST /api/session
GET  /api/session/:id
POST /api/session/:id/expire
GET  /api/health
```

Do NOT create:

```text
POST /upload-to-server
POST /files
POST /media
```

on the cloud backend.

File APIs should exist between the browser and Android connection layer.

---

# 28. WEB COMPONENT ARCHITECTURE

Keep UI separate from networking.

Suggested:

```text
web/
├── app/
├── components/
│   ├── qr/
│   ├── connection/
│   ├── file-manager/
│   └── transfers/
│
├── hooks/
│   ├── useSession.ts
│   ├── useConnection.ts
│   ├── useFiles.ts
│   └── useTransfer.ts
│
├── lib/
│   ├── connection/
│   ├── filesystem/
│   ├── session/
│   └── utils/
│
└── types/
```

React components should not directly contain low-level network protocols.

---

# 29. ANDROID ARCHITECTURE

Keep these layers separate:

```text
Presentation
      ↓
Application / State
      ↓
Domain
      ↓
Data
      ↓
Android / Network / Filesystem
```

The QR scanner should not directly manipulate filesystem code.

The filesystem service should not know about UI widgets.

The networking layer should not contain UI logic.

---

# 30. STATE MANAGEMENT

Use a lightweight state-management solution appropriate for the existing Flutter project.

Do not introduce a massive architecture/framework unless needed.

At minimum manage:

```text
ConnectionState
SessionState
DeviceState
FileState
TransferState
```

---

# 31. TESTING

Implement tests for the critical parts.

## Server

* Session creation
* Token generation
* Expiration
* Invalid sessions

## Android

* QR payload validation
* Session validation
* File listing
* Path validation

## Web

* Session state
* Connection state
* File navigation
* Transfer state

---

# 32. REAL DEVICE TESTING

The final MVP MUST be tested with:

```text
Windows laptop/desktop
+
Android physical device
+
same Wi-Fi router
```

Do not consider localhost-only testing sufficient.

Test:

```text
Phone → PC
PC → Phone
```

with:

* Small image
* PDF
* Large video
* Folder
* Rename
* Delete

---

# 33. PERFORMANCE TARGET

For a normal local network:

* Connection should normally complete within a few seconds.
* Directory listing should feel immediate for ordinary directories.
* File transfers should use streaming/chunking.
* UI should remain responsive during transfers.
* Large files should not cause excessive memory usage.

Do not hard-code unrealistic throughput guarantees.

---

# 34. UI DESIGN

The UI should be:

* Minimal
* Fast
* Clean
* Desktop-first
* File-explorer oriented

Avoid:

* Excessive gradients
* Excessive animations
* Dashboard cards everywhere
* Marketing-heavy UI after connection
* Unnecessary settings
* Feature clutter

The core interaction should remain obvious.

---

# 35. DO NOT ADD THESE FEATURES

For this MVP, explicitly DO NOT implement:

```text
Accounts
Subscriptions
Payments
Cloud backup
Cloud storage
WAN
Remote access
Screen mirroring
SMS
Notifications
Remote camera
AI
Social features
iOS
Native Windows application
Linux application
macOS application
```

Do not get distracted by future features.

---

# 36. IMPLEMENTATION STRATEGY

Work incrementally.

After each major phase:

1. Implement.
2. Run tests.
3. Build.
4. Verify.
5. Fix errors.
6. Document.
7. Move to the next phase.

Do not generate thousands of lines of code without validating the previous layer.

---

# 37. REQUIRED BUILD ORDER

Execute this exact order:

## Phase 1

Repository inspection.

## Phase 2

LAN connection proof.

## Phase 3

Website QR generation.

## Phase 4

Android QR scanning.

## Phase 5

Session authentication.

## Phase 6

Connected state.

## Phase 7

Android filesystem API.

## Phase 8

Desktop file explorer.

## Phase 9

Download.

## Phase 10

Upload.

## Phase 11

Rename/delete/create folder.

## Phase 12

Preview.

## Phase 13

Transfer progress/cancellation.

## Phase 14

Security hardening.

## Phase 15

Physical-device testing.

## Phase 16

UI polish.

---

# 38. IMPORTANT DEVELOPMENT BEHAVIOR

When you encounter a technical blocker:

Do NOT silently replace the architecture.

Explain:

```text
Problem
Why it happens
Possible solutions
Chosen solution
Why it was chosen
```

Then continue implementation.

If a dependency is required, justify it before adding it.

Avoid dependency bloat.

---

# 39. README

Keep `README.md` updated with:

```text
What KRU is
Architecture
Requirements
Installation
Development
Running Android
Running Web
Running Server
LAN setup
Testing
Known limitations
```

---

# 40. DOCUMENTATION

Update:

```text
docs/architecture.md
docs/protocol.md
```
