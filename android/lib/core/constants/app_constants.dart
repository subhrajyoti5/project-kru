/// Protocol version written into QR payloads by the website.
const int qrProtocolVersion = 1;

/// How long a pairing session stays valid. Matches the server default.
const Duration sessionLifetime = Duration(minutes: 5);
