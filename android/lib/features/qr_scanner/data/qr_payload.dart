import 'dart:convert';

import 'package:kru_android/core/constants/app_constants.dart';
import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/core/security/pairing_token.dart';
import 'package:kru_android/core/utils/clock.dart';

/// Temporary connection information from the website QR.
/// File paths and document contents are never part of this payload.
class QrPayload {
  QrPayload({
    required this.version,
    required this.sessionId,
    required this.token,
    required this.expiresAt,
    required this.signalingUrl,
  });

  final int version;
  final String sessionId;
  final String token;
  final DateTime expiresAt;
  final Uri signalingUrl;

  bool isExpired(Clock clock) => !expiresAt.isAfter(clock.now());
}

QrPayload decodeQrPayload(String raw, {Clock clock = const _DefaultClock()}) {
  final Object? decoded;
  try {
    decoded = jsonDecode(raw);
  } on FormatException {
    throw AppException('QR payload is not JSON.', code: 'qr');
  }
  if (decoded is! Map) {
    throw AppException('QR payload must be an object.', code: 'qr');
  }
  final map = decoded.cast<Object?, Object?>();
  final version = map['version'];
  final sessionId = map['sessionId'];
  final token = map['token'];
  final expiresAtRaw = map['expiresAt'];
  final signalingUrlRaw = map['signalingUrl'];

  if (version is! int || version != qrProtocolVersion) {
    throw AppException('Unsupported QR version.', code: 'qr');
  }
  if (sessionId is! String || sessionId.isEmpty) {
    throw AppException('QR is missing a session id.', code: 'qr');
  }
  if (token is! String) {
    throw AppException('QR is missing a pairing token.', code: 'qr');
  }
  assertTokenShape(token);
  if (expiresAtRaw is! String) {
    throw AppException('QR is missing an expiry.', code: 'qr');
  }
  final expiresAt = DateTime.tryParse(expiresAtRaw)?.toUtc();
  if (expiresAt == null) {
    throw AppException('QR expiry is not a valid time.', code: 'qr');
  }
  if (signalingUrlRaw is! String) {
    throw AppException('QR is missing the signaling URL.', code: 'qr');
  }
  final signalingUrl = Uri.tryParse(signalingUrlRaw);
  if (signalingUrl == null || !signalingUrl.hasScheme) {
    throw AppException('QR signaling URL is invalid.', code: 'qr');
  }
  final payload = QrPayload(
    version: version,
    sessionId: sessionId,
    token: token,
    expiresAt: expiresAt,
    signalingUrl: signalingUrl,
  );
  if (payload.isExpired(clock)) {
    throw AppException('This QR code has expired. Refresh it on the computer.', code: 'expired');
  }
  return payload;
}

class _DefaultClock implements Clock {
  const _DefaultClock();

  @override
  DateTime now() => DateTime.now().toUtc();
}
