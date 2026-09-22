import 'dart:convert';
import 'dart:io';

import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/features/device/data/device_info.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

class PairingResult {
  const PairingResult({required this.status});

  final SessionStatus status;
}

class SignalMessage {
  const SignalMessage({
    required this.id,
    required this.role,
    required this.type,
    required this.payload,
  });

  final int id;
  final String role;
  final String type;
  final Map<String, Object?> payload;
}

/// Talks only to the signaling server. File contents must not be sent here.
class SignalingClient {
  SignalingClient({HttpClient? httpClient}) : _http = httpClient ?? HttpClient();

  final HttpClient _http;

  Future<PairingResult> pair({
    required QrPayload payload,
    required DeviceInfo device,
  }) async {
    final decoded = await _send(
      payload: payload,
      path: '/sessions/${payload.sessionId}/pair',
      body: {
        'token': payload.token,
        'device': device.toJson(),
      },
    );
    final session = decoded['session'];
    final status = session is Map ? session['status'] : null;
    return PairingResult(
      status: status is String ? SessionStatus.parse(status) : SessionStatus.paired,
    );
  }

  Future<List<SignalMessage>> readSignals({
    required QrPayload payload,
    required int after,
  }) async {
    final decoded = await _send(
      payload: payload,
      method: 'GET',
      path: '/sessions/${payload.sessionId}/signals',
      query: {'after': '$after'},
      bearer: true,
    );
    final raw = decoded['signals'];
    if (raw is! List) return const [];
    return raw.whereType<Map>().map((entry) {
      final payloadMap = entry['payload'];
      return SignalMessage(
        id: entry['id'] is int ? entry['id'] as int : int.parse('${entry['id']}'),
        role: '${entry['role']}',
        type: '${entry['type']}',
        payload: payloadMap is Map
            ? payloadMap.map((key, value) => MapEntry('$key', value))
            : <String, Object?>{},
      );
    }).toList();
  }

  Future<void> sendSignal({
    required QrPayload payload,
    required String type,
    required Map<String, Object?> signalPayload,
  }) {
    return _send(
      payload: payload,
      path: '/sessions/${payload.sessionId}/signals',
      bearer: true,
      body: {
        'role': 'android',
        'type': type,
        'payload': signalPayload,
      },
    );
  }

  void close() {
    _http.close(force: true);
  }

  Future<Map<String, Object?>> _send({
    required QrPayload payload,
    required String path,
    String method = 'POST',
    Map<String, String>? query,
    Object? body,
    bool bearer = false,
  }) async {
    final uri = payload.signalingUrl.replace(path: path, queryParameters: query);
    final request = await _http.openUrl(method, uri);
    if (bearer) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer ${payload.token}');
    }
    if (body != null) {
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(body));
    }
    final response = await request.close();
    final text = await response.transform(utf8.decoder).join();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AppException(_message(text) ?? 'Signaling request failed.', code: 'signal');
    }
    if (text.isEmpty) return {};
    final decoded = jsonDecode(text);
    if (decoded is! Map) {
      throw AppException('Signaling response was not an object.', code: 'signal');
    }
    return decoded.map((key, value) => MapEntry('$key', value));
  }

  String? _message(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map && decoded['error'] is String) {
        return decoded['error'] as String;
      }
    } on FormatException {
      return null;
    }
    return null;
  }
}
