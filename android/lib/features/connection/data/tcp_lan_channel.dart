import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/filesystem/data/udp_file_transport.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

/// Opens the session over a TCP WebSocket. File bytes stay on [files].
class TcpLanChannel implements LanChannel {
  TcpLanChannel({UdpFileTransport? files}) : files = files ?? UdpFileTransport();

  final UdpFileTransport files;
  WebSocket? _socket;
  bool _closed = false;

  @override
  Future<SessionStatus> open(QrPayload payload) async {
    _closed = false;
    final wsUri = payload.signalingUrl.replace(
      scheme: payload.signalingUrl.scheme == 'https' ? 'wss' : 'ws',
      path: '/sessions/${payload.sessionId}/tcp',
    );
    final socket = await WebSocket.connect(wsUri.toString()).timeout(
      const Duration(seconds: 8),
      onTimeout: () => throw AppException(sameNetworkMessage, code: 'lan'),
    );
    _socket = socket;
    socket.add(jsonEncode({
      'type': 'join',
      'role': 'android',
      'token': payload.token,
    }));

    final established = Completer<int>();
    final subscription = socket.listen(
      (event) {
        final message = jsonDecode(event is String ? event : utf8.decode(event as List<int>));
        if (message is Map && message['type'] == 'established' && !established.isCompleted) {
          final port = message['udpPort'];
          established.complete(port is int ? port : int.parse('$port'));
        }
      },
      onError: (Object error) {
        if (!established.isCompleted) {
          established.completeError(AppException(sameNetworkMessage, code: 'lan'));
        }
      },
      onDone: () {
        if (!established.isCompleted) {
          established.completeError(AppException(sameNetworkMessage, code: 'lan'));
        }
      },
    );

    final udpPort = await established.future.timeout(
      const Duration(seconds: 25),
      onTimeout: () => throw AppException(sameNetworkMessage, code: 'lan'),
    );
    if (_closed) {
      await subscription.cancel();
      throw AppException(sameNetworkMessage, code: 'lan');
    }
    await files.open(
      desktopHost: payload.signalingUrl.host,
      desktopPort: udpPort,
      sessionId: payload.sessionId,
    );
    return SessionStatus.connected;
  }

  @override
  Future<void> close() async {
    _closed = true;
    await files.close();
    await _socket?.close();
    _socket = null;
  }
}
