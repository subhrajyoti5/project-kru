import 'package:flutter/material.dart';
import 'package:kru_android/features/device/data/device_info.dart';

/// Shows the identity that will be sent during pairing.
class DevicePage extends StatelessWidget {
  const DevicePage({super.key, required this.device});

  final DeviceInfo device;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('This phone')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(device.name, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Platform ${device.platform}'),
          Text('Id ${device.deviceId}'),
        ],
      ),
    );
  }
}
