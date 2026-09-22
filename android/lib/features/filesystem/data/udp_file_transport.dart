import 'dart:io';
import 'dart:typed_data';

/// File bytes leave the phone as UDP datagrams. This socket is never used to
/// establish the session.
class UdpFileTransport {
  RawDatagramSocket? _socket;
  InternetAddress? _desktop;
  int? _desktopPort;
  String? _sessionId;

  Future<void> open({
    required String desktopHost,
    required int desktopPort,
    required String sessionId,
  }) async {
    _desktop = InternetAddress(desktopHost);
    _desktopPort = desktopPort;
    _sessionId = sessionId;
    _socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
    final hello = Uint8List.fromList([
      ...'HELLO'.codeUnits,
      ...sessionId.codeUnits,
    ]);
    _socket!.send(hello, _desktop!, desktopPort);
  }

  void sendFile(Uint8List bytes) {
    final socket = _socket;
    final desktop = _desktop;
    final port = _desktopPort;
    final sessionId = _sessionId;
    if (socket == null || desktop == null || port == null || sessionId == null) {
      throw StateError('UDP file transport is not open.');
    }
    const chunkSize = 1100;
    for (var offset = 0; offset < bytes.length; offset += chunkSize) {
      final end = offset + chunkSize > bytes.length ? bytes.length : offset + chunkSize;
      final chunk = Uint8List(4 + sessionId.length + (end - offset));
      chunk.setRange(0, 4, 'FILE'.codeUnits);
      chunk.setRange(4, 4 + sessionId.length, sessionId.codeUnits);
      chunk.setRange(4 + sessionId.length, chunk.length, bytes.sublist(offset, end));
      socket.send(chunk, desktop, port);
    }
  }

  Future<void> close() async {
    _socket?.close();
    _socket = null;
  }
}
