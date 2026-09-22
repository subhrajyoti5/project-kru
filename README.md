# Kru

Browse an Android phone from a desktop browser on the same Wi-Fi.

The website generates a temporary QR code. The Android app scans it. Files are not uploaded to the server. The server only keeps the pairing session in memory.

Read [docs/architecture.md](docs/architecture.md) before changing the connection path. The session is established over TCP. File bytes move over UDP.

```text
android/    Flutter scanner and future file service
web/        Next.js QR and file-manager shell
server/     Express session and signaling mailbox
docs/       Protocol, security, and how to run
```

```powershell
cd server; npm install; npm start
cd web; copy .env.example .env.local; npm install; npm run dev
cd android; flutter pub get; flutter test
```

The product direction is fixed: the desktop shows the QR, the phone scans it.
