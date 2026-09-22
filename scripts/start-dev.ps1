# Starts the signaling server and the Next.js site in two windows.
$root = Split-Path -Parent $PSScriptRoot
Start-Process pwsh -WorkingDirectory (Join-Path $root 'server') -ArgumentList '-NoExit', '-Command', 'npm start'
Start-Process pwsh -WorkingDirectory (Join-Path $root 'web') -ArgumentList '-NoExit', '-Command', 'npm run dev'
