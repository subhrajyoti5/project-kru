import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/connection/data/webrtc_lan_channel.dart';
import 'package:kru_android/features/device/data/device_info.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

class ConnectionSnapshot {
  const ConnectionSnapshot({required this.status, this.detail});

  final SessionStatus status;
  final String? detail;
}

/// Pairs with the website session, then opens the LAN data channel.
class ConnectionController {
  ConnectionController({
    required this.signaling,
    LanChannel? lanChannel,
  }) : channel = lanChannel ?? WebRtcLanChannel(signaling);

  final SignalingClient signaling;
  final LanChannel channel;

  Stream<ConnectionSnapshot> connect(QrPayload payload, DeviceInfo device) async* {
    yield const ConnectionSnapshot(
      status: SessionStatus.pending,
      detail: 'Connecting...',
    );
    await signaling.pair(payload: payload, device: device);
    yield const ConnectionSnapshot(
      status: SessionStatus.paired,
      detail: 'Connecting...',
    );
    final status = await channel.open(payload);
    yield ConnectionSnapshot(status: status, detail: 'Connected');
  }

  Future<void> close() => channel.close();
}
