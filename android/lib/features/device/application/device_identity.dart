import 'dart:math';

import 'package:kru_android/features/device/data/device_info.dart';

/// In-memory device identity for the current process.
/// A stable id belongs with the pairing milestone that persists consent.
class DeviceIdentity {
  DeviceIdentity({Random? random}) : _random = random ?? Random.secure() {
    _info = DeviceInfo(
      deviceId: _id(),
      name: 'Android phone',
      platform: 'android',
    );
  }

  final Random _random;
  late final DeviceInfo _info;

  DeviceInfo get current => _info;

  String _id() {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
