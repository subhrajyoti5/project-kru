# Android app

Flutter app. The phone scans the QR code that the desktop website displays, then pairs with that session.

```powershell
cd android
flutter pub get
flutter test
flutter run
```

Camera scanning is not wired yet. The home screen accepts a pasted QR payload so decode and pairing can be exercised. The session socket is TCP. File datagrams are UDP. See `../docs/architecture.md`.

Native Android code stays under `android/`. Dart reaches it only through a plugin or a `MethodChannel` when a concrete platform API is required (camera, storage permissions). Do not put file-transfer logic in widgets.
