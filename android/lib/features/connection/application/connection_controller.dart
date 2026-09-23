import 'dart:async';

import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/core/network/network_place.dart';
import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/core/services/persistent_connection_service.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/connection/data/tcp_lan_channel.dart';
import 'package:kru_android/features/device/data/device_info.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

class ConnectionSnapshot {
  const ConnectionSnapshot({required this.status, this.detail});

  final SessionStatus status;
  final String? detail;
}

/// Pairs over HTTP, then establishes persistent session with automatic reconnection.
/// The connection persists even when the app is backgrounded.
class ConnectionController {
  ConnectionController({
    required this.signaling,
    LanChannel? lanChannel,
    PersistentConnectionService? connectionService,
  })  : channel = lanChannel ?? TcpLanChannel(),
        _connectionService = connectionService ?? PersistentConnectionService();

  final SignalingClient signaling;
  final LanChannel channel;
  final PersistentConnectionService _connectionService;
  StreamSubscription<ConnectionEvent>? _eventSubscription;

  Stream<ConnectionSnapshot> connect(QrPayload payload, DeviceInfo device) async* {
    yield const ConnectionSnapshot(
      status: SessionStatus.pending,
      detail: 'Pairing...',
    );
    
    final place = await NetworkPlace.current();
    if (place == 'campus') {
      throw AppException(campusNetworkMessage, code: 'campus');
    }
    
    await signaling.pair(payload: payload, device: device);
    yield const ConnectionSnapshot(
      status: SessionStatus.paired,
      detail: 'Establishing connection...',
    );

    try {
      // Establish persistent connection
      await _connectionService.connect(payload);
      
      // Listen for connection events and yield status updates
      _eventSubscription = _connectionService.connectionEvents.listen((event) {
        // Handle reconnection events if needed
      });

      yield ConnectionSnapshot(
        status: SessionStatus.connected,
        detail: 'Connected',
      );
    } catch (error) {
      yield ConnectionSnapshot(
        status: SessionStatus.closed,
        detail: 'Connection failed: $error',
      );
      rethrow;
    }
  }

  /// Check if connection is currently active
  bool get isConnected => _connectionService.isConnected;

  /// Get the persistent connection service for direct access to protocols
  PersistentConnectionService get persistentService => _connectionService;

  /// Gracefully disconnect the session
  Future<void> disconnect() => _connectionService.disconnect();

  /// Close the connection and cleanup resources (for widget disposal)
  Future<void> close() async {
    await _eventSubscription?.cancel();
    await _connectionService.disconnect();
    await channel.close();
  }

  /// Permanently dispose the service
  void dispose() {
    _eventSubscription?.cancel();
    _connectionService.dispose();
  }
}
