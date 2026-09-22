# Web

Next.js App Router site. It creates a pairing session and displays the QR code. The Android app scans that code.

```powershell
cd web
copy .env.example .env.local
npm install
npm run dev
```

File browsing UI shells live under `components/file-manager`. They do not list phone files until a LAN channel exists.
