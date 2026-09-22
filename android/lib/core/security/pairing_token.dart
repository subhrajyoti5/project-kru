import 'package:kru_android/core/errors/app_exception.dart';

/// Checks that a pairing token has the shape the server issues.
/// The server remains the authority; this only rejects obvious garbage
/// before a network call.
void assertTokenShape(String token) {
  if (token.length < 32) {
    throw AppException('Pairing token is too short.', code: 'token');
  }
}
