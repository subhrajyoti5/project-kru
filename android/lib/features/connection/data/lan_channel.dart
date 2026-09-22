import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

/// Direct phone-to-browser channel. Bytes on this channel stay on the LAN.
abstract class LanChannel {
  Future<SessionStatus> open(QrPayload payload);
  Future<void> close();
}

const String sameNetworkMessage =
    'Unable to connect.\n\nMake sure your phone and computer are connected to the same Wi-Fi network.';
