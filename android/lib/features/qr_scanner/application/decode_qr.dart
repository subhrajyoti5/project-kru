import 'package:kru_android/core/utils/clock.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';

/// Application entry for turning scanned text into a [QrPayload].
class DecodeQr {
  DecodeQr({Clock? clock}) : _clock = clock ?? SystemClock();

  final Clock _clock;

  QrPayload call(String raw) => decodeQrPayload(raw, clock: _clock);
}
