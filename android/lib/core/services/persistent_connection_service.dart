import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/features/transfer/data_protocol.dart';
import 'package:kru_android/shared/models/session_status.dart';

const Duration _heartbeatInterval = Duration(seconds: 30);
const Duration _reconnectDelay = Duration(seconds: 5);
const int _maxReconnectAttempts = 10;

enum ConnectionEvent {
  connected,
  disconnected,
  reconnecting,
  failed,
}

class PersistentConnectionService {
  PersistentConnectionService._internal();
  static final PersistentConnectionService _instance = PersistentConnectionService._internal();
  static PersistentConnectionService get instance => _instance;
  factory PersistentConnectionService() => _instance;

  WebSocket? _socket;
  DataProtocol? _protocol;
  QrPayload? _payload;
  
  bool _disposed = false;
  bool _manualDisconnect = false;
  int _reconnectAttempts = 0;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  
  final StreamController<ConnectionEvent> _connectionEvents = StreamController<ConnectionEvent>.broadcast();
  final StreamController<SessionStatus> _statusUpdates = StreamController<SessionStatus>.broadcast();

  Stream<ConnectionEvent> get connectionEvents => _connectionEvents.stream;
  Stream<SessionStatus> get statusUpdates => _statusUpdates.stream;
  
  bool get isConnected => _socket != null && _socket!.readyState == WebSocket.open;
  bool get isDisposed => _disposed;

  /// Establishes persistent connection with automatic reconnection
  Future<void> connect(QrPayload payload) async {
    if (_disposed) throw AppException('Service is disposed', code: 'disposed');
    if (_socket != null && _socket!.readyState == WebSocket.open) {
      if (_payload?.sessionId == payload.sessionId) {
        // Already connected to this session
        return;
      }
      // Connected to another session, disconnect first
      await disconnect();
    }

    _payload = payload;
    _manualDisconnect = false;
    _reconnectAttempts = 0;
    
    await _openConnection();
  }

  /// Gracefully disconnects the persistent connection
  Future<void> disconnect() async {
    _manualDisconnect = true;
    _cancelHeartbeat();
    _cancelReconnect();
    
    _protocol?.stop();
    if (_socket?.readyState == WebSocket.open) {
      await _socket?.close();
    }
    _socket = null;
    _protocol = null;
    
    _connectionEvents.add(ConnectionEvent.disconnected);
    _statusUpdates.add(SessionStatus.disconnected);
  }

  /// Disposes the service permanently
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    
    _manualDisconnect = true;
    _cancelHeartbeat();
    _cancelReconnect();
    
    _protocol?.stop();
    _socket?.close().ignore();
    
    _connectionEvents.close();
    _statusUpdates.close();
  }

  Future<void> _openConnection() async {
    if (_disposed || _manualDisconnect) return;
    if (_payload == null) throw AppException('No payload set', code: 'no_payload');

    try {
      _connectionEvents.add(ConnectionEvent.reconnecting);
      
      final wsUri = _payload!.signalingUrl.replace(
        scheme: _payload!.signalingUrl.scheme == 'https' ? 'wss' : 'ws',
        path: '/sessions/${_payload!.sessionId}/tcp',
      );

      final socket = await WebSocket.connect(wsUri.toString()).timeout(
        const Duration(seconds: 8),
        onTimeout: () => throw AppException('Connection timeout', code: 'timeout'),
      );

      _socket = socket;
      _reconnectAttempts = 0;
      _setupSocket();
      _startHeartbeat();
      
      _connectionEvents.add(ConnectionEvent.connected);
    } catch (error) {
      _socket = null;
      _handleConnectionError(error);
    }
  }

  void _setupSocket() {
    if (_socket == null) return;

    final socket = _socket!;
    final protocol = DataProtocol(
      sendText: (text) async => socket.add(text),
      sendBinary: (bytes) async => socket.add(bytes),
    );
    _protocol = protocol;
    
    final established = Completer<void>();

    socket.listen(
      (event) {
        if (_disposed || _manualDisconnect) return;
        
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
            if (!established.isCompleted) {
              established.complete();
              _statusUpdates.add(SessionStatus.connected);
            }
            return;
          }
          if (event.contains('"pong"')) {
            // Heartbeat response received, connection is alive
            return;
          }
          protocol.onText(event);
          return;
        }
        
        final bytes = event is Uint8List ? event : Uint8List.fromList(event as List<int>);
        protocol.onBinary(bytes);
      },
      onError: (Object error) {
        if (_disposed || _manualDisconnect) return;
        if (!established.isCompleted) {
          established.completeError(error);
        }
        _handleSocketError(error);
      },
      onDone: () {
        if (_disposed || _manualDisconnect) return;
        if (!established.isCompleted) {
          established.completeError(AppException('Connection closed', code: 'closed'));
        }
        _handleSocketClosed();
      },
    );

    socket.add(jsonEncode({
      'type': 'join',
      'role': 'android',
      'token': _payload!.token,
    }));

    established.future.timeout(
      const Duration(seconds: 25),
      onTimeout: () => throw AppException('Handshake timeout', code: 'handshake_timeout'),
    ).then(
      (_) { /* connection established */ },
      onError: (error) {
        if (_disposed || _manualDisconnect) return;
        _handleConnectionError(error);
      },
    );
  }

  void _startHeartbeat() {
    _cancelHeartbeat();
    if (_disposed) return;

    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (_) {
      if (_socket?.readyState == WebSocket.open && !_disposed) {
        try {
          _socket!.add(jsonEncode({'type': 'ping'}));
        } catch (e) {
          // Ignore errors; socket will close and trigger reconnection
        }
      }
    });
  }

  void _cancelHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _cancelReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  void _handleConnectionError(Object error) {
    if (_disposed || _manualDisconnect) return;

    _cancelHeartbeat();
    _socket = null;
    _protocol = null;
    _connectionEvents.add(ConnectionEvent.failed);
    
    _scheduleReconnect();
  }

  void _handleSocketError(Object error) {
    if (_disposed || _manualDisconnect) return;

    _cancelHeartbeat();
    _connectionEvents.add(ConnectionEvent.reconnecting);
    _scheduleReconnect();
  }

  void _handleSocketClosed() {
    if (_disposed || _manualDisconnect) return;

    _cancelHeartbeat();
    _socket = null;
    _protocol = null;
    _connectionEvents.add(ConnectionEvent.reconnecting);
    
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed || _manualDisconnect) return;
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _connectionEvents.add(ConnectionEvent.failed);
      return;
    }

    _cancelReconnect();
    _reconnectAttempts++;
    
    final delay = _reconnectDelay * (1 << (_reconnectAttempts - 1).clamp(0, 3));
    _reconnectTimer = Timer(delay, () {
      if (!_disposed && !_manualDisconnect) {
        _openConnection();
      }
    });
  }

  // Data protocol helpers
  Future<void> sendText(String text) async {
    if (!isConnected) throw AppException('Not connected', code: 'not_connected');
    _socket!.add(text);
  }

  Future<void> sendBinary(Uint8List bytes) async {
    if (!isConnected) throw AppException('Not connected', code: 'not_connected');
    _socket!.add(bytes);
  }

  // Direct access to protocol for file operations
  DataProtocol? getProtocol() {
    if (!isConnected) return null;
    return _protocol;
  }
}
