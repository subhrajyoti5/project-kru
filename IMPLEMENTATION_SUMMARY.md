# Persistent Connections and Reliable File Transfer Implementation

## Overview

This implementation ensures that connections between Android devices and web browsers remain persistent even when apps are backgrounded, closed, or undergo network interruptions. File transfers are protected by SHA-256 checksums to prevent corruption.

## Changes Made

### 1. Android App - Persistent Connection Service

**File:** `android/lib/core/services/persistent_connection_service.dart`

A new singleton service manages WebSocket connections with:
- **Automatic reconnection** with exponential backoff (max 10 attempts)
- **Heartbeat mechanism** with 30-second ping intervals
- **Graceful disconnect** handling
- **Event streams** for connection state changes (`connected`, `reconnecting`, `failed`, `disconnected`)

Key features:
- Connection survives app backgrounding
- Automatic reconnection on network loss
- Configurable heartbeat interval
- Exponential backoff for reconnection attempts
- Manual disconnect support

### 2. Android App - Connection Controller Updates

**File:** `android/lib/features/connection/application/connection_controller.dart`

Modified to use `PersistentConnectionService`:
- Injected as dependency
- Provides persistent connection management
- Connection no longer closes when page widget is disposed
- Added `isConnected`, `persistentService`, and `disconnect()` methods

### 3. Android App - Connection Page Updates

**File:** `android/lib/features/connection/presentation/connection_page.dart`

Modified `dispose()` method:
- No longer closes the persistent connection when page is disposed
- Connection remains active for background operations
- Only closes when user explicitly calls `disconnect()`

### 4. Android App - Session Status Enum

**File:** `android/lib/shared/models/session_status.dart`

Added `disconnected` status to track when connection is temporarily unavailable but attempting to reconnect.

### 5. Web App - Heartbeat and Reconnection

**File:** `web/lib/connection/peer-session.ts`

Implemented persistent connection features:
- **Heartbeat:** 30-second ping-pong mechanism
- **Disconnect method:** Graceful disconnect with disconnect message
- **Reconnection prevention:** Flag to distinguish manual disconnect from network failure
- **SHA-256 verification:** Web Crypto API for download checksum validation

Key methods:
- `startHeartbeat()` - Sends periodic pings
- `disconnect()` - Graceful user-initiated disconnect
- `calculateSHA256(blob)` - Verifies file integrity

### 6. Web App - Session Type Updates

**File:** `web/types/session.ts`

Added `disconnected` to SessionStatus type for proper state management.

### 7. Web App - Connection Labels

**File:** `web/lib/connection/labels.ts`

Updated labels to show:
- "Disconnected - waiting to reconnect" for `disconnected` status
- "Link established" for intermediate `link` status

### 8. Web App - Connection Status Component

**File:** `web/components/connection/connection-status.tsx`

Enhanced visual feedback:
- Green (●) for connected
- Amber (●) for disconnected
- Gray (●) for other states

### 9. Web App - Files Page

**File:** `web/app/files/page.tsx`

Updated disconnect button to:
- Call new `peerSession.disconnect()` method
- Show proper error handling
- Navigate back to connect page

### 10. Server - TCP Hub

**File:** `server/src/tcp/hub.js`

Added message handlers:
- `disconnect` message: Closes socket gracefully
- `ping` message: Responds with `pong`

## Protocol Changes

### Heartbeat Protocol

**Ping Message (Client → Server):**
```json
{
  "type": "ping"
}
```

**Pong Message (Server → Client):**
```json
{
  "type": "pong"
}
```

### Disconnect Message

**Disconnect (Client → Server):**
```json
{
  "type": "disconnect"
}
```

## File Transfer Integrity

### Android Implementation (Existing)
- SHA-256 checksum calculated on upload/download
- Filename: `sha256OfFile()` in `data_protocol.dart`
- Verification: Compares checksums before confirming transfer

### Web Implementation (New)
- Uses Web Crypto API: `crypto.subtle.digest('SHA-256', buffer)`
- Verifies downloads before saving
- Shows error if checksums don't match

## Reconnection Logic

```
Connection Lost
    ↓
[Attempt 1] - Wait 5s
[Attempt 2] - Wait 10s (5 * 2)
[Attempt 3] - Wait 20s (5 * 2^2)
[Attempt 4] - Wait 40s (5 * 2^3)
[Attempt 5-10] - Wait 80s (5 * 2^3, max)
    ↓
Failed after 10 attempts (~2-3 minutes)
```

## Status States

### Complete State Flow

```
IDLE → PENDING → PAIRED → LINK → CONNECTED
                                     ↓
                              [Connection Lost]
                                     ↓
                            DISCONNECTED → [Reconnecting]
                                             ↓
                                        CONNECTED (if successful)
                                             ↓
                                        FAILED (if 10 attempts exhausted)

User-initiated DISCONNECT from any state → IDLE
```

## Benefits

1. **Persistence:** Connections survive app backgrounding, WiFi interruptions
2. **Reliability:** Automatic reconnection with exponential backoff
3. **Integrity:** SHA-256 checksums prevent file corruption
4. **User Experience:** Transparent handling of network issues
5. **Battery Efficiency:** Heartbeat without aggressive polling
6. **Graceful Shutdown:** Proper disconnect handling

## Testing Checklist

- [ ] Connection survives app backgrounding
- [ ] Automatic reconnection on network loss
- [ ] Heartbeat pings sent every 30 seconds
- [ ] File transfers complete without corruption
- [ ] SHA-256 checksums verified
- [ ] User-initiated disconnect works
- [ ] Connection fails gracefully after max attempts
- [ ] No memory leaks on reconnection

## Configuration

Default values (can be customized in `persistent_connection_service.dart`):

```dart
const Duration _heartbeatInterval = Duration(seconds: 30);
const Duration _reconnectDelay = Duration(seconds: 5);
const int _maxReconnectAttempts = 10;
```

## Future Improvements

1. Configurable heartbeat interval
2. Connection state persistence to shared preferences
3. Foreground service for Android (battery optimization)
4. Exponential backoff tweaking based on device type
5. Metrics/logging for connection diagnostics
