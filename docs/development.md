# Development

## Layout

```text
android/     Flutter project (native project is android/android)
web/         Next.js App Router
server/      Express signaling
docs/        Architecture, protocol, security
scripts/     start-dev.ps1
```

Flutter feature code is split into `presentation`, `application`, and `data`. Widgets call application types. `FileService` and `LanChannel` are the seams for later work.

Web UI calls hooks. Hooks call `lib/api`, `lib/connection`, and `lib/filesystem`. Components do not create sessions themselves except through `useSession`.

## Commands

```powershell
cd server
npm install
npm start

cd web
copy .env.example .env.local
npm install
npm run dev

cd android
flutter pub get
flutter test
flutter run
```

`scripts/start-dev.ps1` opens the server and the website in two terminals after dependencies are installed.

## Milestone

The connection milestone is implemented:

- website creates a session, renders the QR, and opens a TCP WebSocket
- phone scans or pastes the payload, pairs, and joins the same TCP socket
- the page shows Connected when both TCP sockets are up
- file bytes go out as UDP datagrams after that

File listing and transfers are still not implemented. Do not add a database or cloud storage to add them.

The phone must reach `PUBLIC_SIGNALING_URL`. `127.0.0.1` on the phone is the phone itself. Set that variable to this computer's LAN address, for example `http://192.168.1.20:4000`, and the same value in `web/.env.local` as `NEXT_PUBLIC_API_URL`. Cleartext HTTP is allowed in the Android manifest so that local signaling server can be reached.

## Native boundary

Kotlin under `android/android` owns the activity Flutter generates. Reach Android-only APIs through a plugin or a `MethodChannel`. Storage and camera permissions belong there or in the plugin manifest, not in widget code.

## Web boundary

`app/connect/page.tsx` is the pairing screen. `app/files/page.tsx` is the shell for the file manager and currently has an empty list. Transfer components return nothing until a channel exists.
