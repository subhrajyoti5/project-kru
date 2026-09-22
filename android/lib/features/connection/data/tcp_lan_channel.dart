import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/features/transfer/data_protocol.dart';
import 'package:kru_android/shared/models/session_status.dart';

/// Session and file bytes share one TCP WebSocket. Nothing is sent over UDP.
class TcpLanChannel implements LanChannel {
  WebSocket? _socket;
  DataProtocol? _protocol;
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
    final protocol = DataProtocol(
      sendText: (text) async => socket.add(text),
      sendBinary: (bytes) async => socket.add(bytes),
    );
    _protocol = protocol;
    final opened = Completer<void>();

    socket.listen(
      (event) {
        if (event is String) {
          if (event.contains('"established"')) {
            socket.add(jsonEncode({
              'type': 'hello',
              'protocolVersion': 1,
              'device': {'platform': 'android'},
            }));
            return;
          }
          if (event.contains('"hello_ack"')) {
            if (!opened.isCompleted) opened.complete();
            return;
          }
          protocol.onText(event);
          return;
        }
        final bytes = event is Uint8List ? event : Uint8List.fromList(event as List<int>);
        protocol.onBinary(bytes);
      },
      onError: (Object _) {
        if (!opened.isCompleted) {
          opened.completeError(AppException(sameNetworkMessage, code: 'lan'));
        }
      },
      onDone: () {
        if (!opened.isCompleted) {
          opened.completeError(AppException(sameNetworkMessage, code: 'lan'));
        }
      },
    );

    socket.add(jsonEncode({
      'type': 'join',
      'role': 'android',
      'token': payload.token,
    }));

    await opened.future.timeout(
      const Duration(seconds: 25),
      onTimeout: () => throw AppException(sameNetworkMessage, code: 'lan'),
    );
    if (_closed) throw AppException(sameNetworkMessage, code: 'lan');
    return SessionStatus.connected;
  }

  @override
  Future<void> close() async {
    _closed = true;
    _protocol?.stop();
    await _socket?.close();
    _socket = null;
  }
}
