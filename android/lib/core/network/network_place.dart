import 'package:flutter/services.dart';

const campusNetworkMessage =
    'This Wi-Fi is a college or enterprise network, and its firewall blocks the phone from reaching the laptop. '
    'Use your home router, or turn on the phone hotspot and join it from the laptop.';

class NetworkPlace {
  static const _channel = MethodChannel('kru/network');

  static Future<String> current() async {
    try {
      final place = await _channel.invokeMethod<String>('place');
      return place ?? 'home';
    } on MissingPluginException {
      return 'home';
    }
  }
}
