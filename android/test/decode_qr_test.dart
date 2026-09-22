import 'package:flutter_test/flutter_test.dart';
import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/core/utils/clock.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';

class FixedClock implements Clock {
  FixedClock(this._now);
  final DateTime _now;
  @override
  DateTime now() => _now;
}

void main() {
  const raw = '''
{
  "version": 1,
  "sessionId": "sess_123",
  "token": "0123456789abcdef0123456789abcdef",
  "expiresAt": "2026-09-22T12:05:00.000Z",
  "signalingUrl": "http://127.0.0.1:4000"
}
''';

  test('decodes a website QR payload', () {
    final payload = decodeQrPayload(
      raw,
      clock: FixedClock(DateTime.utc(2026, 9, 22, 12)),
    );
    expect(payload.sessionId, 'sess_123');
    expect(payload.signalingUrl.port, 4000);
  });

  test('rejects an expired QR', () {
    expect(
      () => decodeQrPayload(
        raw,
        clock: FixedClock(DateTime.utc(2026, 9, 22, 13)),
      ),
      throwsA(isA<AppException>()),
    );
  });
}
