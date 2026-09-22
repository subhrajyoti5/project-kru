import 'dart:math';

import 'package:flutter/services.dart';
import 'package:kru_android/features/device/data/device_info.dart';

class DeviceIdentity {
  DeviceIdentity({Random? random}) : _random = random ?? Random.secure();

  static const _channel = MethodChannel('kru/network');
  final Random _random;

  Future<DeviceInfo> load(String network) async {
    Map<Object?, Object?> details = const {};
    try {
      final raw = await _channel.invokeMethod<Map<Object?, Object?>>('device');
      if (raw != null) details = raw;
    } on MissingPluginException {
      details = const {};
    }
    String read(String key, String fallback) {
      final value = details[key];
      if (value == null || '$value'.isEmpty) return fallback;
      return '$value';
    }

    return DeviceInfo(
      deviceId: _id(),
      name: read('name', 'Android phone'),
      platform: 'android',
      manufacturer: read('manufacturer', ''),
      model: read('model', ''),
      brand: read('brand', ''),
      androidVersion: read('androidVersion', ''),
      sdkInt: read('sdkInt', ''),
      network: network,
    );
  }

  String _id() {
    final bytes = List<int>.generate(16, (_) => _random.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
