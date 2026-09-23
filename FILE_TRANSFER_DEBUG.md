# File Transfer Debugging Guide

## Checksum Mismatches - Root Causes & Solutions

### Problem Pattern: "Checksum mismatch"

```
Downloading 100% failed Checksum mismatch: 
  expected <android_hash>
  got <web_hash>
```

### Common Causes

| Cause | Symptom | Fix |
|-------|---------|-----|
| **Out-of-order chunks** | Happens randomly | Use offset-based Map for assembly (FIXED) |
| **Dropped packets** | Incomplete transfer | TCP handles retransmission (should not occur) |
| **SHA-256 algorithm mismatch** | Consistent mismatches | Verify both use SHA-256 (not MD5, etc.) |
| **Endianness difference** | Platform-specific | All systems use big-endian for SHA-256 |
| **Partial file transfer** | Sizes don't match | Wait for `download_complete` message |
| **Memory corruption** | Random failures | Check for buffer overflows |

## Implementation Verification

### Android Side (data_protocol.dart)

```dart
// Verify this exists:
String sha256OfFile(String path) {
  final sink = _DigestSink();
  final input = sha256.startChunkedConversion(sink);
  // Reads file in chunkSize blocks and updates hash
}
```

### Web Side (peer-session.ts)

```typescript
// Verify chunks are sorted by offset:
while (currentOffset < expectedSize) {
  const chunk = chunkMap.get(currentOffset);  // ✅ By offset
  chunks.push(chunk);
  currentOffset += chunk.length;
}

// Verify hash calculation:
const calculatedHash = await this.calculateSHA256(blob);
if (calculatedHash !== result.sha256) {
  throw new Error(`Checksum mismatch...`);
}
```

## Monitoring Transfers

### Check Frame Format

The binary frame format should be:
```
[0x4b, 0x52, 0x55, 0x31]  // Magic: "KRU1"
[version=2]                // Protocol version
[idLength]                 // Length of transfer ID
[transferId...]            // Transfer ID bytes
[offset_big_endian]        // 32-bit big-endian offset
[payload...]               // File chunk data
```

### Network Analysis

```bash
# Capture download traffic (adjust interface as needed)
tcpdump -i eth0 'tcp port 3000' -w download.pcap

# Analyze packet order
wireshark download.pcap
# Look for binary frames (0x4b 0x52 0x55 0x31)
# Check offset field matches payload position
```

## Common Mistakes to Avoid

❌ **Don't**: Append chunks without considering offset
```typescript
chunks.push(payload);  // WRONG if packets arrive out of order
```

✅ **Do**: Store chunks by offset, then reassemble sequentially
```typescript
chunkMap.set(offset, payload);  // Correct
```

---

❌ **Don't**: Compare checksums before all chunks received
```typescript
if (received === expected) {
  verifyChecksum();  // TOO EARLY - missing chunks cause mismatch
}
```

✅ **Do**: Verify only after download_complete message
```typescript
const result = await this.awaitDownloadComplete(transferId);
if (result.sha256) {
  verifyChecksum(result.sha256);  // Correct - all data received
}
```

---

❌ **Don't**: Use different hash algorithms
```typescript
// Android: SHA-256
// Web: MD5  // WRONG!
```

✅ **Do**: Match algorithms exactly
```typescript
// Both use SHA-256
await crypto.subtle.digest('SHA-256', buffer);
```

## Debugging Steps

### If downloads still fail with checksum mismatch:

1. **Check chunk count**
   ```typescript
   console.log('Total chunks received:', chunkMap.size);
   console.log('Expected file size:', result.actualSize);
   ```

2. **Verify offset continuity**
   ```typescript
   const offsets = Array.from(chunkMap.keys()).sort((a, b) => a - b);
   let expectedOffset = 0;
   for (const offset of offsets) {
     console.log(`Chunk at ${offset}, expected ${expectedOffset}`);
     expectedOffset += chunkMap.get(offset)!.length;
   }
   ```

3. **Log both hashes**
   ```typescript
   const calculatedHash = await this.calculateSHA256(blob);
   console.log('Expected hash:', result.sha256);
   console.log('Calculated hash:', calculatedHash);
   console.log('Match:', calculatedHash === result.sha256);
   ```

4. **Check file size**
   ```typescript
   console.log('Total bytes assembled:', 
     Array.from(chunkMap.values()).reduce((sum, chunk) => sum + chunk.length, 0)
   );
   console.log('Expected size:', result.actualSize);
   ```

## Performance Tuning

If transfers are slow or incomplete:

```typescript
// Current settings in peer-session.ts
const chunkSize = 64 * 1024;  // 64KB chunks
const maxBuffered = 1024 * 1024;  // 1MB buffered

// For slow networks, increase chunk size:
const chunkSize = 256 * 1024;  // 256KB chunks

// For high-latency networks, reduce max buffered:
const maxBuffered = 512 * 1024;  // 512KB buffered
```

## Related Issues

- **Uploads still failing?** Check `sendUploadFrame()` in data_protocol.dart
- **Large files timeout?** Increase heartbeat timeout from 30s
- **Memory issues?** Stream chunks instead of buffering entire file
